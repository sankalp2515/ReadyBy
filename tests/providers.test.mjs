import test from "node:test";
import assert from "node:assert/strict";
import { requestIntent, providerConfig } from "../src/readyby/providers.mjs";
const messages = [
  { role: "system", content: "Return JSON." },
  { role: "user", content: "Synthetic test request" },
];
const envNames = [
  "READYBY_AI_PROVIDER",
  "READYBY_AI_MODEL",
  "READYBY_AI_FALLBACKS",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "NVIDIA_API_KEY",
];
function environment(t, values) {
  const original = Object.fromEntries(envNames.map((k) => [k, process.env[k]]));
  for (const k of envNames) delete process.env[k];
  Object.assign(process.env, values);
  t.after(() => {
    for (const k of envNames) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });
}

test("hosted adapters use server-side credentials and parse native response formats without sending keys in URLs or payloads", async (t) => {
  environment(t, {
    GROQ_API_KEY: "test-groq",
    GEMINI_API_KEY: "test-gemini",
    NVIDIA_API_KEY: "test-nvidia",
    READYBY_AI_FALLBACKS: "",
  });
  for (const provider of ["groq", "gemini", "nvidia"]) {
    process.env.READYBY_AI_PROVIDER = provider;
    const result = await requestIntent(
      messages,
      {},
      {
        fetcher: async (url, options) => {
          assert.ok(!url.includes("test-"));
          assert.ok(
            !options.body.includes("test-groq") &&
              !options.body.includes("test-gemini") &&
              !options.body.includes("test-nvidia"),
          );
          const body = JSON.parse(options.body);
          if (provider === "gemini") {
            assert.equal(options.headers["x-goog-api-key"], "test-gemini");
            assert.equal(
              body.generationConfig.responseMimeType,
              "application/json",
            );
            return new Response(
              JSON.stringify({
                modelVersion: "test-model",
                candidates: [
                  {
                    content: {
                      parts: [
                        { thought: true, text: "not for parsing" },
                        { text: '{"action":"status"}' },
                      ],
                    },
                  },
                ],
              }),
            );
          }
          assert.equal(
            options.headers.Authorization,
            `Bearer test-${provider}`,
          );
          assert.equal(body.response_format.type, "json_object");
          return new Response(
            JSON.stringify({
              model: "test-model",
              choices: [{ message: { content: '{"action":"status"}' } }],
            }),
          );
        },
      },
    );
    assert.equal(result.content, '{"action":"status"}');
    assert.equal(result.hosted, true);
  }
});

test("provider failures never expose provider response bodies or credentials", async (t) => {
  environment(t, {
    READYBY_AI_PROVIDER: "groq",
    READYBY_AI_FALLBACKS: "",
    GROQ_API_KEY: "test-private",
  });
  await assert.rejects(
    () =>
      requestIntent(
        messages,
        {},
        {
          fetcher: async () =>
            new Response("test-private raw upstream details", { status: 401 }),
        },
      ),
    (e) => e.code === "AI_UNAVAILABLE" && !e.message.includes("test-private"),
  );
});

test("quota failure falls back explicitly and subsequent requests respect provider cooldown", async (t) => {
  environment(t, {
    READYBY_AI_PROVIDER: "groq",
    READYBY_AI_FALLBACKS: "gemini",
    GROQ_API_KEY: "test-groq",
    GEMINI_API_KEY: "test-gemini",
  });
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    return url.includes("groq.com")
      ? new Response("{}", { status: 429, headers: { "retry-after": "30" } })
      : new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: '{"action":"status"}' }] } },
            ],
          }),
        );
  };
  const first = await requestIntent(messages, {}, { fetcher });
  assert.equal(first.provider, "Google Gemini");
  assert.equal(first.attempts[0].reason, "HTTP 429");
  const second = await requestIntent(messages, {}, { fetcher });
  assert.equal(second.attempts[0].reason, "quota cooldown");
  assert.equal(calls.filter((url) => url.includes("groq.com")).length, 1);
  assert.equal(providerConfig().provider, "groq");
});
