import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, resolve, extname, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { openDatabase } from "./database.mjs";
import { rateLimiter, readSessionCookie, sessionCookie } from "./security.mjs";
import { templates } from "./templates.mjs";
import { rehearsal } from "./scenarios.mjs";
import { createMissionService } from "./missions.mjs";
import { handleMcp, MCP_VERSION, MCP_TOOL_NAMES } from "./mcp.mjs";
import { viewState } from "../readyby/reducer.mjs";
import { interpret, agentHealth } from "../readyby/agent.mjs";
import { DomainError, requireThat } from "../readyby/schema.mjs";
import { createSpeechService } from "./speech.mjs";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

export async function createPlatformServer({
  dbFile = resolve("data", "readyby-platform.sqlite"),
  publicDir = resolve("frontend", "dist"),
  interpreter = interpret,
  health = agentHealth,
  origin = process.env.READYBY_ORIGIN || null,
  production = process.env.NODE_ENV === "production",
  missionNow = Date.now,
} = {}) {
  requireThat(
    !production || origin?.startsWith("https://"),
    "Production requires a configured HTTPS READYBY_ORIGIN.",
  );
  const data = openDatabase(dbFile),
    speech = createSpeechService(),
    limits = rateLimiter(),
    missionService = createMissionService({
      data,
      interpreter,
      limits,
      now: missionNow,
    });
  let stopping = false;
  const app = http.createServer(async (req, res) => {
    const requestId = randomUUID();
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), geolocation=(), microphone=(self)",
    );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    const json = (code, result) => {
      res.writeHead(code, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(result));
    };
    const rawCookie = readSessionCookie(req.headers.cookie),
      identity = data.session(rawCookie);
    const address = req.socket.remoteAddress ?? "unknown";
    const port = app.address()?.port;
    const allowed = origin ?? `http://127.0.0.1:${port}`;
    const localHosts = new Set([
      `127.0.0.1:${port}`,
      `localhost:${port}`,
      `[::1]:${port}`,
    ]);
    let path = "/",
      rpcId = null;
    try {
      requireThat(
        !stopping,
        "Server is restarting. Please retry.",
        "UNAVAILABLE",
      );
      requireThat(
        origin
          ? req.headers.host === new URL(origin).host
          : localHosts.has(req.headers.host),
        "Unrecognized host.",
        "FORBIDDEN",
      );
      const url = new URL(req.url, allowed);
      path = url.pathname;
      if (path === "/healthz") {
        data.db.prepare("SELECT 1 AS ready").get();
        json(200, { ok: true, version: "0.3.0", database: "ready" });
        return;
      }
      if (path === "/mcp") {
        requireThat(
          identity,
          "Sign in to your household to use MCP.",
          "UNAUTHORIZED",
        );
        const sent = req.headers.origin;
        requireThat(
          !sent ||
            sent === allowed ||
            (!origin && sent === `http://${req.headers.host}`),
          "Cross-origin request denied.",
          "FORBIDDEN",
        );
        if (req.method === "POST") {
          requireThat(
            req.headers["x-csrf-token"] === identity.csrf,
            "Refresh your household session before using MCP.",
            "FORBIDDEN",
          );
          requireThat(
            req.headers["content-type"]?.startsWith("application/json"),
            "Use application/json.",
          );
        }
        limits.check("mcp:" + identity.accountId, { limit: 180 });
        let rpc;
        if (req.method === "POST") {
          let raw = "";
          for await (const chunk of req) {
            raw += chunk;
            requireThat(
              Buffer.byteLength(raw) <= 30000,
              "Request is too large.",
              "PAYLOAD_TOO_LARGE",
            );
          }
          try {
            rpc = JSON.parse(raw);
          } catch {
            throw new DomainError("Invalid JSON.");
          }
          requireThat(rpc && !Array.isArray(rpc), "Send one JSON-RPC message.");
          rpcId =
            typeof rpc.id === "string" || typeof rpc.id === "number"
              ? rpc.id
              : null;
          const version =
            rpc.method === "initialize"
              ? rpc.params?.protocolVersion
              : req.headers["mcp-protocol-version"];
          requireThat(
            version === MCP_VERSION,
            "ReadyBy requires MCP protocol 2025-11-25.",
          );
        }
        await handleMcp(req, res, rpc, { identity, service: missionService });
        return;
      }
      if (path.startsWith("/api/")) {
        const mutation = req.method !== "GET";
        if (mutation) {
          const sent = req.headers.origin;
          if (sent)
            requireThat(
              sent === allowed ||
                (!origin && sent === `http://${req.headers.host}`),
              "Cross-origin request denied.",
              "FORBIDDEN",
            );
          requireThat(
            req.headers["content-type"]?.startsWith("application/json"),
            "Use application/json.",
          );
        }
        let body = {};
        if (mutation) {
          let raw = "";
          for await (const chunk of req) {
            raw += chunk;
            requireThat(
              Buffer.byteLength(raw) <=
                (path === "/api/speech/transcribe" ? 900000 : 30000),
              "Request is too large.",
              "PAYLOAD_TOO_LARGE",
            );
          }
          try {
            body = JSON.parse(raw);
          } catch {
            throw new DomainError("Invalid JSON.");
          }
          requireThat(
            body && typeof body === "object" && !Array.isArray(body),
            "Expected JSON object.",
          );
        }
        const authPaths = [
          "/api/auth/signup",
          "/api/auth/login",
          "/api/auth/recover",
          "/api/auth/demo",
        ];
        if (authPaths.includes(path)) {
          requireThat(req.method === "POST", "Use POST.");
          limits.check("auth:" + address, { limit: 18, windowMs: 15 * 60000 });
          let started;
          if (path === "/api/auth/signup") started = await data.signup(body);
          if (path === "/api/auth/login") started = await data.login(body);
          if (path === "/api/auth/demo") {
            started = await data.signup(
              {
                displayName: "Maya",
                householdName: "Demo household",
                names: ["Maya", "Arun"],
              },
              true,
            );
            data.atomic(() =>
              data.insertMission(started.identity, rehearsal("opening")),
            );
          }
          if (path === "/api/auth/recover") {
            const result = await data.recover(body);
            json(200, result);
            return;
          }
          res.setHeader(
            "Set-Cookie",
            sessionCookie(started.raw, { secure: production }),
          );
          json(200, {
            ...data.bootstrap(started.identity),
            recoveryCode: started.recoveryCode ?? null,
            templates,
          });
          return;
        }
        if (path === "/api/bootstrap" && !identity) {
          json(200, { identity: null, templates });
          return;
        }
        requireThat(
          identity,
          "Sign in to your household to continue.",
          "UNAUTHORIZED",
        );
        if (mutation)
          requireThat(
            req.headers["x-csrf-token"] === identity.csrf,
            "Your session changed. Refresh before retrying.",
            "FORBIDDEN",
          );
        if (path === "/api/bootstrap" && req.method === "GET") {
          json(200, { ...data.bootstrap(identity), templates });
          return;
        }
        if (path === "/api/proposals/confirm" && req.method === "POST") {
          limits.check("confirm:" + identity.accountId, { limit: 30 });
          json(200, missionService.confirm(identity, body));
          return;
        }
        if (path === "/api/mcp" && req.method === "GET") {
          json(200, {
            endpoint: "/mcp",
            protocol: MCP_VERSION,
            transport: "Streamable HTTP",
            tools: MCP_TOOL_NAMES,
            authentication:
              "Household session + CSRF; loopback simulator, no native Alexa OAuth",
          });
          return;
        }
        if (path === "/api/runtime" && req.method === "GET") {
          json(200, await health());
          return;
        }
        if (path === "/api/speech" && req.method === "GET") {
          json(200, await speech.health());
          return;
        }
        if (path === "/api/speech/transcribe" && req.method === "POST") {
          limits.check("speech:" + identity.accountId, { limit: 12 });
          json(200, await speech.transcribe(body.pcm));
          return;
        }
        if (path === "/api/auth/logout" && req.method === "POST") {
          data.logout(rawCookie);
          res.setHeader(
            "Set-Cookie",
            sessionCookie("", { clear: true, secure: production }),
          );
          json(200, { ok: true });
          return;
        }
        if (path === "/api/household" && req.method === "PATCH") {
          json(200, data.updateHousehold(identity, body));
          return;
        }
        if (path === "/api/household/members" && req.method === "GET") {
          json(200, {
            members: data.listMembers(identity),
            households: data.listHouseholds(identity),
          });
          return;
        }
        if (path === "/api/household/switch" && req.method === "POST") {
          data.switchHousehold(identity, body.id, rawCookie);
          json(200, { ok: true });
          return;
        }
        if (path === "/api/household/remove-member" && req.method === "POST") {
          data.removeMember(identity, body.username);
          json(200, { ok: true });
          return;
        }
        if (path === "/api/household/invite" && req.method === "POST") {
          json(200, data.invite(identity));
          return;
        }
        if (path === "/api/household/join" && req.method === "POST") {
          data.join(identity, body.code);
          json(200, { ok: true });
          return;
        }
        if (path === "/api/household/export" && req.method === "GET") {
          json(200, data.exportHousehold(identity));
          return;
        }
        if (path === "/api/household/delete" && req.method === "POST") {
          data.deleteHousehold(identity, body.confirmation);
          res.setHeader(
            "Set-Cookie",
            sessionCookie("", { clear: true, secure: production }),
          );
          json(200, { ok: true });
          return;
        }
        if (path === "/api/missions" && req.method === "POST") {
          const s = data.create(identity, body);
          json(200, { state: viewState(s) });
          return;
        }
        if (path === "/api/missions/select" && req.method === "POST") {
          data.select(identity, body.missionId);
          json(200, { ok: true });
          return;
        }
        if (path === "/api/missions/archive" && req.method === "POST") {
          data.archive(identity, body.missionId);
          json(200, { ok: true });
          return;
        }
        if (path === "/api/routines" && req.method === "POST") {
          const id = data.saveRoutine(identity, body);
          json(200, { id });
          return;
        }
        if (path === "/api/routines/start" && req.method === "POST") {
          const s = data.createFromRoutine(identity, body.id, {
            mode: body.mode,
          });
          json(200, { state: viewState(s) });
          return;
        }
        if (path === "/api/state" && req.method === "GET") {
          const h = data.household(identity.householdId);
          if (!h.activeMissionId) {
            json(200, { state: null });
            return;
          }
          const row = data.authorizedMission(
            identity,
            url.searchParams.get("missionId") || h.activeMissionId,
          );
          json(200, { state: viewState(row.state) });
          return;
        }
        if (
          ["/api/action", "/api/command", "/api/demo/scenario"].includes(
            path,
          ) &&
          req.method === "POST"
        ) {
          const result =
            path === "/api/demo/scenario"
              ? missionService.scenario(identity, body)
              : path === "/api/command"
                ? await missionService.command(identity, body)
                : missionService.execute(identity, body);
          json(200, result);
          return;
        }
        throw new DomainError("Endpoint not found.", "NOT_FOUND");
      }
      requireThat(
        req.method === "GET" || req.method === "HEAD",
        "Method not allowed.",
        "NOT_FOUND",
      );
      let relative =
          path === "/"
            ? "index.html"
            : decodeURIComponent(path).replace(/^\/+/, ""),
        file = resolve(publicDir, relative);
      requireThat(
        file.startsWith(resolve(publicDir) + sep),
        "Invalid file path.",
        "FORBIDDEN",
      );
      try {
        const info = await stat(file);
        requireThat(info.isFile(), "File not found.", "NOT_FOUND");
      } catch {
        if (path.startsWith("/assets/"))
          throw new DomainError("Asset not found.", "NOT_FOUND");
        file = join(publicDir, "index.html");
      }
      const bytes = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": path.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch (error) {
      const code = error.code ?? "INTERNAL";
      const status =
        {
          UNAUTHORIZED: 401,
          FORBIDDEN: 403,
          NOT_FOUND: 404,
          STALE_REVISION: 409,
          CONFIRMATION_REQUIRED: 409,
          CONFLICT: 409,
          RATE_LIMIT: 429,
          PAYLOAD_TOO_LARGE: 413,
          UNAVAILABLE: 503,
          AI_UNAVAILABLE: 503,
          AI_INVALID: 502,
          SPEECH_UNAVAILABLE: 503,
          INVALID_ACTION: 400,
        }[code] ?? (error.name === "DomainError" ? 400 : 500);
      if (status === 429) res.setHeader("Retry-After", "60");
      if (path === "/mcp") {
        json(status, {
          jsonrpc: "2.0",
          id: rpcId,
          error: {
            code:
              status === 400
                ? error.message === "Invalid JSON."
                  ? -32700
                  : -32600
                : -32000,
            message:
              status === 500
                ? "The MCP request could not be completed."
                : error.message,
          },
        });
        return;
      }
      json(status, {
        error:
          status === 500
            ? "The request could not be completed. Your last saved mission remains available."
            : error.message,
        code,
        requestId,
      });
    }
  });
  app.requestTimeout = 30000;
  app.headersTimeout = 15000;
  app.keepAliveTimeout = 2000;
  app.on("close", () => {
    stopping = true;
    speech.close();
    data.close();
  });
  return { server: app, database: data };
}
