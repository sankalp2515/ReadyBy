import { DomainError } from "./schema.mjs";

const settings = {
  groq: {
    label: "Groq",
    key: "GROQ_API_KEY",
    model: "openai/gpt-oss-120b",
    url: "https://api.groq.com/openai/v1/chat/completions",
  },
  gemini: {
    label: "Google Gemini",
    key: "GEMINI_API_KEY",
    model: "gemini-3.1-flash-lite",
    url: "https://generativelanguage.googleapis.com/v1beta/models/",
  },
  nvidia: {
    label: "NVIDIA NIM",
    key: "NVIDIA_API_KEY",
    model: "openai/gpt-oss-20b",
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
  },
};

export function providerConfig(selected) {
  let provider = selected || process.env.READYBY_AI_PROVIDER || "auto";
  if (provider === "auto")
    provider =
      ["gemini", "groq", "nvidia"].find((p) => process.env[settings[p].key]) ||
      "ollama";
  if (provider === "ollama") {
    const raw =
      process.env.READYBY_OLLAMA_URL ||
      process.env.OLLAMA_HOST ||
      "http://127.0.0.1:11434";
    return {
      provider,
      label: "Ollama (local)",
      model:
        process.env.READYBY_AI_MODEL ||
        process.env.READYBY_MODEL ||
        "llama3:8b-instruct-q4_K_M",
      url: (raw.startsWith("http") ? raw : "http://" + raw).replace(/\/$/, ""),
    };
  }
  const s = settings[provider];
  if (!s)
    throw new DomainError(
      "Unknown READYBY_AI_PROVIDER. Use groq, gemini, nvidia or ollama.",
      "AI_UNAVAILABLE",
    );
  return {
    provider,
    ...s,
    model:
      process.env.READYBY_AI_MODEL ||
      process.env["READYBY_" + provider.toUpperCase() + "_MODEL"] ||
      s.model,
  };
}

export async function providerHealth() {
  const c = providerConfig();
  const base = {
    provider: c.label,
    model: c.model,
    hosted: c.provider !== "ollama",
    integration: "Alexa+ simulator + MCP",
    transport: "MCP 2025-11-25 · Streamable HTTP",
  };
  if (c.provider !== "ollama")
    return {
      ...base,
      available: Boolean(process.env[c.key]),
      availability: "credential configured; requests can still fail",
    };
  try {
    const r = await fetch(c.url + "/api/tags", {
      signal: AbortSignal.timeout(2500),
    });
    const data = await r.json();
    return {
      ...base,
      available:
        (r.ok && data.models?.some((m) => m.name === c.model)) || false,
    };
  } catch {
    return { ...base, available: false };
  }
}

async function singleRequest(
  messages,
  schema,
  { fetcher = fetch, config: c } = {},
) {
  let url = c.url,
    body,
    headers = { "Content-Type": "application/json" };
  if (c.provider === "ollama") {
    url += "/api/chat";
    body = {
      model: c.model,
      stream: false,
      format: schema,
      messages,
      options: { temperature: 0, num_ctx: 4096, num_predict: 600 },
    };
  } else {
    const key = process.env[c.key];
    if (!key)
      throw new DomainError(
        `${c.label} is not configured. Set its key on the server or select Ollama.`,
        "AI_UNAVAILABLE",
      );
    const system =
      messages[0].content +
      "\nReturn one JSON object only. JSON schema: " +
      JSON.stringify(schema);
    if (c.provider === "gemini") {
      url += encodeURIComponent(c.model) + ":generateContent";
      headers["x-goog-api-key"] = key;
      body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: messages[1].content }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 650,
          responseMimeType: "application/json",
          ...(c.model.startsWith("gemini-3")
            ? { thinkingConfig: { thinkingLevel: "minimal" } }
            : {}),
        },
      };
    } else {
      headers.Authorization = "Bearer " + key;
      body = {
        model: c.model,
        stream: false,
        temperature: 0,
        max_tokens: 650,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, messages[1]],
        ...(c.model.includes("gpt-oss") && c.provider === "groq"
          ? { reasoning_effort: "low" }
          : {}),
      };
    }
  }
  let response;
  try {
    response = await fetcher(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(c.provider === "ollama" ? 90000 : 18000),
    });
  } catch {
    throw new DomainError(
      `${c.label} did not respond in time. Your mission is unchanged. Retry or use task controls.`,
      "AI_UNAVAILABLE",
    );
  }
  if (!response.ok) {
    const error = new DomainError(
      `${c.label} request failed (HTTP ${response.status}). Your mission is unchanged.`,
      "AI_UNAVAILABLE",
    );
    error.status = response.status;
    error.retryAfterSeconds = Math.min(
      120,
      Math.max(5, Number(response.headers?.get("retry-after")) || 30),
    );
    throw error;
  }
  const data = await response.json();
  const content =
    c.provider === "ollama"
      ? data.message?.content
      : c.provider === "gemini"
        ? data.candidates?.[0]?.content?.parts
            ?.filter((p) => !p.thought)
            .map((p) => p.text || "")
            .join("")
        : data.choices?.[0]?.message?.content;
  return {
    content,
    model: data.model || data.modelVersion || c.model,
    provider: c.label,
    hosted: c.provider !== "ollama",
  };
}

const cooldown = new Map();
export async function requestIntent(
  messages,
  schema,
  { fetcher = fetch } = {},
) {
  const primary = providerConfig();
  const fallback =
    primary.provider === "ollama"
      ? []
      : (
          process.env.READYBY_AI_FALLBACKS ??
          (primary.provider === "groq" ? "gemini" : "groq")
        )
          .split(",")
          .map((p) => p.trim())
          .filter((p) => settings[p] && process.env[settings[p].key]);
  const attempts = [];
  for (const name of [...new Set([primary.provider, ...fallback])]) {
    if ((cooldown.get(name) || 0) > Date.now()) {
      attempts.push({ provider: name, reason: "quota cooldown" });
      continue;
    }
    const started = Date.now();
    try {
      const r = await singleRequest(messages, schema, {
        fetcher,
        config: providerConfig(name),
      });
      return {
        ...r,
        attempts: [
          ...attempts,
          {
            provider: name,
            latencyMs: Date.now() - started,
            status: "success",
          },
        ],
      };
    } catch (e) {
      attempts.push({
        provider: name,
        reason: e.status ? `HTTP ${e.status}` : "timeout or unavailable",
        latencyMs: Date.now() - started,
      });
      if (e.status === 429)
        cooldown.set(name, Date.now() + (e.retryAfterSeconds || 30) * 1000);
      if (e.code !== "AI_UNAVAILABLE") throw e;
    }
  }
  throw new DomainError(
    "Configured AI providers are unavailable or quota limited. Your mission is unchanged. Retry shortly or use task controls.",
    "AI_UNAVAILABLE",
  );
}
