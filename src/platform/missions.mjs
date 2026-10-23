import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  applyAction,
  viewState,
  describe,
  analyze,
} from "../readyby/reducer.mjs";
import { actionFromIntent } from "../readyby/agent.mjs";
import {
  pendingQuestion,
  resolveClarification,
  clarifyUnscopedDuration,
} from "../readyby/conversation.mjs";
import { DomainError, requireThat } from "../readyby/schema.mjs";
import { rehearsal } from "./scenarios.mjs";

export const toolForAction = {
  progress: "readyby_report_progress",
  delay: "readyby_report_delay",
  edit_task: "readyby_edit_task",
  availability: "readyby_set_availability",
  recalculate: "readyby_recalculate",
  approve: "readyby_commit_proposal",
  reject: "readyby_reject_proposal",
  start_mission: "readyby_start_mission",
  draft_mission: "readyby_draft_mission",
  clock: "readyby_advance_demo",
  resume_deferred: "readyby_resume_deferred",
};

export function createMissionService({
  data,
  interpreter,
  limits,
  now = Date.now,
}) {
  const inFlight = new Set(),
    prepared = new Map(),
    confirmations = new Map();
  const identityKey = (i) => `${i.accountId}:${i.householdId}:${i.csrf}`;
  const withoutCapabilities = (body) =>
    Object.fromEntries(
      Object.entries(body).filter(
        ([key]) => !["confirmationToken", "preparedToken"].includes(key),
      ),
    );
  function sweep() {
    for (const map of [prepared, confirmations])
      for (const [key, value] of map)
        if (value.expires <= now()) map.delete(key);
    requireThat(
      prepared.size < 300 && confirmations.size < 300,
      "Too many pending requests. Retry shortly.",
      "RATE_LIMIT",
    );
  }
  function snapshot(identity, body) {
    const s = data.authorizedMission(identity, body.missionId).state;
    requireThat(
      typeof body.idempotencyKey === "string" &&
        body.idempotencyKey.length >= 4 &&
        body.idempotencyKey.length <= 120,
      "Provide a valid request key.",
    );
    return s;
  }
  function duplicateCommand(s, body) {
    const previous = s.commandRequests?.find(
      (r) => r.key === body.idempotencyKey,
    );
    if (!previous) return null;
    requireThat(
      previous.text === body.text,
      "Request key belongs to different input.",
    );
    return { state: viewState(s), reply: previous.reply, duplicate: true };
  }
  const revision = (s, body) =>
    requireThat(
      body.expectedRevision === s.revision,
      "The plan changed. Review the latest version.",
      "STALE_REVISION",
    );
  async function interpretCommand(identity, body, s) {
    limits.check("ai:" + identity.accountId, { limit: 12 });
    requireThat(
      !inFlight.has(identity.accountId),
      "A request is already being interpreted. Please wait.",
      "RATE_LIMIT",
    );
    inFlight.add(identity.accountId);
    try {
      const ai =
        resolveClarification(s, body.text) ??
        clarifyUnscopedDuration(body.text) ??
        (await interpreter(s, body.text));
      if (ai.intent.action === "approve") {
        ai.reviewProposalId = s.proposal?.options.find(
          (o) => o.kind === (ai.intent.optionKind || "defer"),
        )?.id;
        ai.intent = {
          action: "clarify",
          question:
            "Please review the proposed change and choose Approve this revision. Your commitments have not changed.",
        };
        ai.receipt = {
          ...ai.receipt,
          intent: ai.intent,
          normalizations: [
            ...(ai.receipt.normalizations ?? []),
            "Conversational approval requires review of the exact proposal in the confirmation interface",
          ],
        };
      }
      return ai;
    } finally {
      inFlight.delete(identity.accountId);
    }
  }
  function execute(identity, body, { ai = null, transport = null } = {}) {
    limits.check("write:" + identity.accountId, { limit: 90 });
    const s = snapshot(identity, body);
    if (ai) {
      const previous = duplicateCommand(s, body);
      if (previous) return previous;
    } else if (s.requests.some((r) => r.key === body.idempotencyKey)) {
      const r = applyAction(s, withoutCapabilities(body));
      return { state: viewState(r.state), reply: r.reply, duplicate: true };
    }
    revision(s, body);
    const action = ai
      ? actionFromIntent(s, ai.intent)
      : withoutCapabilities(body);
    let approval;
    if (action?.type === "approve") {
      approval = confirmations.get(body.confirmationToken);
      requireThat(
        approval &&
          approval.expires > now() &&
          approval.owner === identityKey(identity) &&
          approval.missionId === s.id &&
          approval.revision === s.revision &&
          approval.proposalId === action.proposalId,
        "Review and confirm this exact revision before approving.",
        "CONFIRMATION_REQUIRED",
      );
    }
    const result = data.atomic(() => {
      const current = data.authorizedMission(identity, s.id).state;
      revision(current, body);
      const r = action
        ? applyAction(current, {
            ...action,
            expectedRevision: body.expectedRevision,
            idempotencyKey: body.idempotencyKey,
          })
        : {
            state: current,
            reply:
              ai.intent.action === "clarify"
                ? ai.intent.question || "Which change do you mean?"
                : describe(current, analyze(current)),
          };
      if (!r.duplicate) {
        r.state.pendingClarification = ai
          ? pendingQuestion(current, ai.intent, body.text)
          : null;
        if (r.state.pendingClarification)
          r.reply = r.state.pendingClarification.question;
        if (ai) r.state.messages.push({ role: "user", text: body.text });
        r.state.messages.push({ role: "assistant", text: r.reply });
        r.state.messages = r.state.messages.slice(-80);
        r.state.receipts.push({
          ...(ai ? ai.receipt : { id: randomUUID(), kind: "domain" }),
          tool: action?.type ?? "get_mission",
          revision: r.state.revision,
          ...(transport ? { mcp: transport } : {}),
          ...(approval
            ? {
                approval: {
                  source: "explicit review interface",
                  proposalId: action.proposalId,
                  revision: s.revision,
                },
              }
            : {}),
        });
        r.state.receipts = r.state.receipts.slice(-60);
        if (ai) {
          r.state.commandRequests ??= [];
          r.state.commandRequests.push({
            key: body.idempotencyKey,
            text: body.text,
            reply: r.reply,
          });
          r.state.commandRequests = r.state.commandRequests.slice(-60);
        }
        data.saveMission(identity, r.state, current.revision);
      }
      return {
        state: viewState(r.state),
        reply: r.reply,
        duplicate: r.duplicate ?? false,
        ...(ai?.reviewProposalId
          ? { reviewProposalId: ai.reviewProposalId }
          : {}),
      };
    });
    if (approval) confirmations.delete(body.confirmationToken);
    return result;
  }
  return {
    execute,
    get(identity, body = {}) {
      const id =
        body.missionId || data.household(identity.householdId).activeMissionId;
      return {
        state: id
          ? viewState(data.authorizedMission(identity, id).state)
          : null,
      };
    },
    confirm(identity, body) {
      sweep();
      const s = data.authorizedMission(identity, body.missionId).state;
      revision(s, body);
      requireThat(
        s.proposal?.options.some((o) => o.id === body.proposalId),
        "The proposal is no longer available.",
        "STALE_REVISION",
      );
      const confirmationToken = randomUUID();
      confirmations.set(confirmationToken, {
        owner: identityKey(identity),
        missionId: s.id,
        revision: s.revision,
        proposalId: body.proposalId,
        expires: now() + 120000,
      });
      return { confirmationToken, expiresInSeconds: 120 };
    },
    scenario(identity, body) {
      limits.check("write:" + identity.accountId, { limit: 90 });
      const s = snapshot(identity, body);
      revision(s, body);
      requireThat(
        s.isDemo === true,
        "Rehearsal controls only affect a demo mission.",
      );
      const next = rehearsal(body.scenario);
      next.id = s.id;
      next.revision = s.revision + 1;
      data.atomic(() => data.saveMission(identity, next, s.revision));
      return {
        state: viewState(next),
        reply:
          "Demo chapter loaded. The displayed time and progress are explicitly seeded.",
      };
    },
    async command(identity, body) {
      const s = snapshot(identity, body),
        previous = duplicateCommand(s, body);
      if (previous) return previous;
      revision(s, body);
      return execute(identity, body, {
        ai: await interpretCommand(identity, body, s),
      });
    },
    async prepare(identity, body) {
      sweep();
      const s = snapshot(identity, body),
        previous = duplicateCommand(s, body);
      if (previous) return { result: previous };
      revision(s, body);
      const key = identityKey(identity);
      for (const [preparedToken, p] of prepared)
        if (p.owner === key && p.body.idempotencyKey === body.idempotencyKey) {
          requireThat(
            p.body.text === body.text,
            "Request key belongs to different input.",
          );
          requireThat(
            p.body.expectedRevision === body.expectedRevision,
            "Prepared request is stale.",
            "STALE_REVISION",
          );
          return {
            toolName: p.toolName,
            arguments: { ...p.arguments, preparedToken },
          };
        }
      const ai = await interpretCommand(identity, body, s);
      const action = actionFromIntent(s, ai.intent),
        toolName = action ? toolForAction[action.type] : "readyby_get_mission";
      requireThat(
        toolName,
        "The interpreter requested an unsupported tool.",
        "AI_INVALID",
      );
      const args = {
        missionId: body.missionId,
        expectedRevision: body.expectedRevision,
        idempotencyKey: body.idempotencyKey,
        ...(action
          ? Object.fromEntries(
              Object.entries(action).filter(([k]) => k !== "type"),
            )
          : {}),
      };
      const preparedToken = randomUUID();
      prepared.set(preparedToken, {
        owner: key,
        body: structuredClone(body),
        ai,
        toolName,
        arguments: args,
        expires: now() + 90000,
      });
      return { toolName, arguments: { ...args, preparedToken } };
    },
    call(identity, toolName, body, transport) {
      if (body.preparedToken) {
        const p = prepared.get(body.preparedToken);
        requireThat(
          p && p.expires > now() && p.owner === identityKey(identity),
          "Prepared interpretation expired. Send the request again.",
          "FORBIDDEN",
        );
        const args = Object.fromEntries(
          Object.entries(body).filter(([k]) => k !== "preparedToken"),
        );
        requireThat(
          p.toolName === toolName && isDeepStrictEqual(p.arguments, args),
          "Prepared action was changed. No changes were applied.",
          "FORBIDDEN",
        );
        return execute(identity, p.body, { ai: p.ai, transport });
      }
      if (toolName === "readyby_get_mission") return this.get(identity, body);
      const type = Object.keys(toolForAction).find(
        (k) => toolForAction[k] === toolName,
      );
      requireThat(type, "Unknown household tool.");
      return execute(identity, { ...body, type }, { transport });
    },
  };
}
