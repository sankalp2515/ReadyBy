import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { requireThat, DomainError } from "../readyby/schema.mjs";
import { validateMission } from "../readyby/schema.mjs";
import {
  digest,
  token,
  passwordHash,
  passwordMatches,
  safeString,
} from "./security.mjs";
import { createMission } from "./templates.mjs";

export function openDatabase(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  if (db.prepare("PRAGMA user_version").get().user_version > 1) {
    db.close();
    throw new DomainError(
      "This database needs a newer ReadyBy version.",
      "UNAVAILABLE",
    );
  }
  db.exec(
    "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
  );
  db.exec(`CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,display_name TEXT NOT NULL,password_hash TEXT NOT NULL,recovery_hash TEXT NOT NULL,guest INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS households(id TEXT PRIMARY KEY,name TEXT NOT NULL,people_json TEXT NOT NULL,active_mission_id TEXT,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS members(account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK(role IN('owner','member')),PRIMARY KEY(account_id,household_id));
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS missions(id TEXT PRIMARY KEY,household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,revision INTEGER NOT NULL,state_json TEXT NOT NULL,archived INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS routines(id TEXT PRIMARY KEY,household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,name TEXT NOT NULL,config_json TEXT NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS invitations(token_hash TEXT PRIMARY KEY,household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,created_by TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL,used_at INTEGER);
    CREATE INDEX IF NOT EXISTS missions_household ON missions(household_id,updated_at);
    CREATE INDEX IF NOT EXISTS sessions_account ON sessions(account_id);
    PRAGMA user_version=1;`);
  const q = (sql) => db.prepare(sql),
    now = () => Date.now();
  function atomic(fn) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  function household(id) {
    const h = q("SELECT * FROM households WHERE id=?").get(id);
    return h
      ? {
          id: h.id,
          name: h.name,
          people: JSON.parse(h.people_json),
          activeMissionId: h.active_mission_id,
        }
      : null;
  }
  function session(raw) {
    if (!raw || raw.length > 150) return null;
    const r = q(
      `SELECT s.*,a.username,a.display_name,a.guest,m.role FROM sessions s JOIN accounts a ON a.id=s.account_id JOIN members m ON m.account_id=s.account_id AND m.household_id=s.household_id WHERE s.token_hash=? AND s.expires_at>?`,
    ).get(digest(raw), now());
    if (!r) return null;
    return {
      accountId: r.account_id,
      householdId: r.household_id,
      csrf: r.csrf,
      expiresAt: r.expires_at,
      role: r.role,
      guest: Boolean(r.guest),
      username: r.username,
      displayName: r.display_name,
    };
  }
  function startSession(accountId, householdId) {
    const raw = token(),
      csrf = token();
    q("DELETE FROM sessions WHERE expires_at<?").run(now());
    q("INSERT INTO sessions VALUES(?,?,?,?,?)").run(
      digest(raw),
      accountId,
      householdId,
      csrf,
      now() + 7 * 86400000,
    );
    return { raw, identity: session(raw) };
  }
  function authorizedMission(
    identity,
    id = household(identity.householdId)?.activeMissionId,
  ) {
    requireThat(id, "Create your first mission.", "NOT_FOUND");
    const row = q("SELECT * FROM missions WHERE id=? AND household_id=?").get(
      id,
      identity.householdId,
    );
    requireThat(row, "Mission not found in this household.", "NOT_FOUND");
    return { ...row, state: JSON.parse(row.state_json) };
  }
  function saveMission(identity, state, expectedRevision) {
    validateMission(state);
    const result = q(
      "UPDATE missions SET state_json=?,revision=?,updated_at=? WHERE id=? AND household_id=? AND revision=?",
    ).run(
      JSON.stringify(state),
      state.revision,
      now(),
      state.id,
      identity.householdId,
      expectedRevision,
    );
    requireThat(
      result.changes === 1,
      "The mission changed. Review the latest revision.",
      "STALE_REVISION",
    );
    return state;
  }
  function insertMission(identity, state) {
    validateMission(state);
    q(
      "INSERT INTO missions(id,household_id,revision,state_json,updated_at) VALUES(?,?,?,?,?)",
    ).run(
      state.id,
      identity.householdId,
      state.revision,
      JSON.stringify(state),
      now(),
    );
    q("UPDATE households SET active_mission_id=? WHERE id=?").run(
      state.id,
      identity.householdId,
    );
    return state;
  }
  const owner = (identity) =>
    requireThat(
      identity.role === "owner",
      "Only the household owner can do that.",
      "FORBIDDEN",
    );
  return {
    db,
    close: () => db.close(),
    atomic,
    household,
    session,
    startSession,
    authorizedMission,
    saveMission,
    insertMission,
    async signup(
      { username, password, displayName, householdName, names },
      guest = false,
    ) {
      username = guest
        ? "guest-" + randomUUID()
        : safeString(username, "Account name", {
            min: 3,
            max: 40,
          }).toLowerCase();
      requireThat(
        guest || /^[a-z0-9][a-z0-9_.-]+$/.test(username),
        "Use letters, numbers, dots, underscores or hyphens for your account name.",
      );
      displayName = safeString(displayName || "Guest", "Your name", {
        max: 40,
      });
      householdName = safeString(
        householdName || `${displayName}'s household`,
        "Household name",
        { max: 60 },
      );
      names = names ?? [displayName, "Partner"];
      requireThat(
        Array.isArray(names) && names.length >= 1 && names.length <= 2,
        "Use one or two household participants.",
      );
      names = names.map((n) => safeString(n, "Participant name", { max: 40 }));
      requireThat(
        !q("SELECT id FROM accounts WHERE username=?").get(username),
        "That account name is already taken.",
        "CONFLICT",
      );
      const hash = guest ? "guest-no-password" : await passwordHash(password),
        recovery = token(),
        id = randomUUID(),
        hid = randomUUID();
      atomic(() => {
        requireThat(
          !q("SELECT id FROM accounts WHERE username=?").get(username),
          "That account name is already taken.",
          "CONFLICT",
        );
        q("INSERT INTO accounts VALUES(?,?,?,?,?,?,?)").run(
          id,
          username,
          displayName,
          hash,
          digest(recovery),
          guest ? 1 : 0,
          now(),
        );
        q("INSERT INTO households VALUES(?,?,?,?,?)").run(
          hid,
          householdName,
          JSON.stringify(names),
          null,
          now(),
        );
        q("INSERT INTO members VALUES(?,?,?)").run(id, hid, "owner");
      });
      const started = startSession(id, hid);
      return { ...started, recoveryCode: guest ? null : recovery };
    },
    async login({ username, password }) {
      const a = q("SELECT * FROM accounts WHERE username=? AND guest=0").get(
        String(username ?? "")
          .trim()
          .toLowerCase(),
      );
      const fallback =
        "scrypt$32768$8$3$0123456789abcdef0123456789abcdef$" + "0".repeat(128);
      const match = await passwordMatches(
        password,
        a?.password_hash ?? fallback,
      );
      requireThat(
        a && match,
        "Account name or passphrase is incorrect.",
        "UNAUTHORIZED",
      );
      const m = q(
        "SELECT household_id FROM members WHERE account_id=? ORDER BY role DESC LIMIT 1",
      ).get(a.id);
      requireThat(m, "No household membership found.", "UNAUTHORIZED");
      return startSession(a.id, m.household_id);
    },
    logout(raw) {
      if (raw) q("DELETE FROM sessions WHERE token_hash=?").run(digest(raw));
    },
    async recover({ username, recoveryCode, password }) {
      const a = q("SELECT * FROM accounts WHERE username=? AND guest=0").get(
        String(username ?? "")
          .trim()
          .toLowerCase(),
      );
      requireThat(
        a &&
          typeof recoveryCode === "string" &&
          digest(recoveryCode) === a.recovery_hash,
        "Account name or recovery code is incorrect.",
        "UNAUTHORIZED",
      );
      const hash = await passwordHash(password),
        next = token();
      atomic(() => {
        const changed = q(
          "UPDATE accounts SET password_hash=?,recovery_hash=? WHERE id=? AND recovery_hash=?",
        ).run(hash, digest(next), a.id, a.recovery_hash);
        requireThat(
          changed.changes === 1,
          "This recovery code was already used.",
          "UNAUTHORIZED",
        );
        q("DELETE FROM sessions WHERE account_id=?").run(a.id);
      });
      return { recoveryCode: next };
    },
    bootstrap(identity) {
      const h = household(identity.householdId);
      const missions = q(
        "SELECT id,state_json,archived,updated_at FROM missions WHERE household_id=? ORDER BY updated_at DESC LIMIT 60",
      )
        .all(h.id)
        .map((r) => {
          const s = JSON.parse(r.state_json);
          return {
            id: r.id,
            title: s.title,
            phase: s.phase,
            isDemo: s.isDemo ?? s.clock.mode === "demo",
            deadline: s.deadline,
            clock: s.clock,
            completed: s.tasks.filter((t) => t.status === "completed").length,
            total: s.tasks.length,
            archived: Boolean(r.archived),
            updatedAt: r.updated_at,
          };
        });
      const routines = q(
        "SELECT * FROM routines WHERE household_id=? ORDER BY created_at DESC",
      )
        .all(h.id)
        .map((r) => ({ id: r.id, name: r.name, ...JSON.parse(r.config_json) }));
      return {
        identity: {
          displayName: identity.displayName,
          username: identity.username,
          role: identity.role,
          guest: identity.guest,
        },
        household: h,
        missions,
        routines,
        csrfToken: identity.csrf,
      };
    },
    create(identity, config) {
      const h = household(identity.householdId),
        state = createMission({ ...config, names: h.people });
      return atomic(() => insertMission(identity, state));
    },
    select(identity, id) {
      authorizedMission(identity, id);
      q("UPDATE households SET active_mission_id=? WHERE id=?").run(
        id,
        identity.householdId,
      );
    },
    archive(identity, id) {
      owner(identity);
      authorizedMission(identity, id);
      q("UPDATE missions SET archived=1 WHERE id=? AND household_id=?").run(
        id,
        identity.householdId,
      );
      const h = household(identity.householdId);
      if (h.activeMissionId === id)
        q("UPDATE households SET active_mission_id=NULL WHERE id=?").run(
          identity.householdId,
        );
    },
    updateHousehold(identity, { name, names }) {
      owner(identity);
      name = safeString(name, "Household name", { max: 60 });
      requireThat(
        Array.isArray(names) && names.length >= 1 && names.length <= 2,
        "Use one or two participants.",
      );
      names = names.map((n) => safeString(n, "Participant name", { max: 40 }));
      q("UPDATE households SET name=?,people_json=? WHERE id=?").run(
        name,
        JSON.stringify(names),
        identity.householdId,
      );
      return household(identity.householdId);
    },
    saveRoutine(identity, { missionId, name }) {
      owner(identity);
      const { state: s } = authorizedMission(identity, missionId);
      requireThat(
        s.phase === "draft",
        "Save the routine before starting its mission.",
      );
      const config = {
        templateId: s.templateId ?? "school",
        minutes: s.deadline - s.start,
        taskSpecs: s.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          duration: t.duration,
          owner: t.owner,
          deps: t.deps,
          required: t.required,
          waitMinutes: Math.max(0, t.release - s.start),
          barrier: t.barrier === true,
        })),
      };
      const id = randomUUID();
      q("INSERT INTO routines VALUES(?,?,?,?,?)").run(
        id,
        identity.householdId,
        safeString(name, "Routine name", { max: 60 }),
        JSON.stringify(config),
        now(),
      );
      return id;
    },
    createFromRoutine(identity, id, { mode = "realtime" } = {}) {
      const r = q("SELECT * FROM routines WHERE id=? AND household_id=?").get(
        id,
        identity.householdId,
      );
      requireThat(r, "Routine not found.", "NOT_FOUND");
      return this.create(identity, {
        ...JSON.parse(r.config_json),
        title: r.name,
        mode,
      });
    },
    invite(identity) {
      owner(identity);
      requireThat(
        !identity.guest,
        "Create a permanent household account before inviting another adult.",
      );
      const code = token();
      q("INSERT INTO invitations VALUES(?,?,?,?,NULL)").run(
        digest(code),
        identity.householdId,
        identity.accountId,
        now() + 7 * 86400000,
      );
      return { code, expiresAt: now() + 7 * 86400000 };
    },
    join(identity, code) {
      requireThat(
        typeof code === "string" && code.length <= 100,
        "Enter a valid invitation.",
      );
      return atomic(() => {
        const i = q(
          "SELECT * FROM invitations WHERE token_hash=? AND used_at IS NULL AND expires_at>?",
        ).get(digest(code), now());
        requireThat(i, "Invitation is invalid or expired.", "NOT_FOUND");
        requireThat(
          !q("SELECT 1 FROM members WHERE account_id=? AND household_id=?").get(
            identity.accountId,
            i.household_id,
          ),
          "You already belong to this household.",
        );
        q("INSERT INTO members VALUES(?,?,?)").run(
          identity.accountId,
          i.household_id,
          "member",
        );
        q("UPDATE invitations SET used_at=? WHERE token_hash=?").run(
          now(),
          digest(code),
        );
        q(
          "UPDATE sessions SET household_id=? WHERE account_id=? AND household_id=?",
        ).run(i.household_id, identity.accountId, identity.householdId);
        return i.household_id;
      });
    },
    listHouseholds(identity) {
      return q(
        "SELECT h.id,h.name,m.role FROM households h JOIN members m ON m.household_id=h.id WHERE m.account_id=?",
      ).all(identity.accountId);
    },
    switchHousehold(identity, id, raw) {
      requireThat(
        q("SELECT 1 FROM members WHERE account_id=? AND household_id=?").get(
          identity.accountId,
          id,
        ),
        "Household membership required.",
        "FORBIDDEN",
      );
      q("UPDATE sessions SET household_id=? WHERE token_hash=?").run(
        id,
        digest(raw),
      );
    },
    removeMember(identity, username) {
      owner(identity);
      const a = q("SELECT id FROM accounts WHERE username=?").get(username);
      requireThat(
        a && a.id !== identity.accountId,
        "You cannot remove yourself.",
      );
      return atomic(() => {
        q(
          "DELETE FROM members WHERE account_id=? AND household_id=? AND role='member'",
        ).run(a.id, identity.householdId);
        q("DELETE FROM sessions WHERE account_id=? AND household_id=?").run(
          a.id,
          identity.householdId,
        );
      });
    },
    listMembers(identity) {
      return q(
        "SELECT a.display_name AS name,a.username,m.role FROM members m JOIN accounts a ON a.id=m.account_id WHERE m.household_id=?",
      ).all(identity.householdId);
    },
    exportHousehold(identity) {
      return {
        household: household(identity.householdId),
        missions: q("SELECT state_json FROM missions WHERE household_id=?")
          .all(identity.householdId)
          .map((r) => JSON.parse(r.state_json)),
        routines: this.bootstrap(identity).routines,
        exportedAt: new Date().toISOString(),
      };
    },
    deleteHousehold(identity, confirmation) {
      owner(identity);
      const h = household(identity.householdId);
      requireThat(
        confirmation === h.name,
        "Type the household name to confirm deletion.",
      );
      atomic(() => {
        q("DELETE FROM households WHERE id=?").run(h.id);
        q(
          "DELETE FROM accounts WHERE id=? AND NOT EXISTS(SELECT 1 FROM members WHERE account_id=?)",
        ).run(identity.accountId, identity.accountId);
      });
    },
  };
}
