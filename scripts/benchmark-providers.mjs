import "../src/platform/environment.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { interpret } from "../src/readyby/agent.mjs";
import { providerConfig } from "../src/readyby/providers.mjs";
import { intentCases } from "./intent-cases.mjs";
const provider = process.argv[2] || "groq";
process.env.READYBY_AI_PROVIDER = provider;
if (provider !== "auto"&&!process.argv.includes('--fallback')) process.env.READYBY_AI_FALLBACKS = "";
const all = process.argv.includes("--full");
const selected = all
  ? intentCases
  : [
      intentCases[7],
      intentCases[9],
      intentCases[16],
      intentCases[14],
      intentCases[13],
      intentCases[20],
    ];
const results = [];
for (const [text, state, expected] of selected) {
  const started = Date.now();
  try {
    const r = await interpret(state, text);
    const pass = Object.entries(expected).every(([k, v]) => r.intent[k] === v);
    results.push({
      text,
      expected,
      actual: r.intent,
      rawIntent: r.receipt.rawIntent,
      normalizations: r.receipt.normalizations,
      provider: r.receipt.provider,
      model: r.receipt.model,
      attempts: r.receipt.attempts,
      pass,
      latencyMs: r.receipt.latencyMs,
    });
    console.log(
      `${provider} ${pass ? "PASS" : "FAIL"} ${r.receipt.latencyMs}ms ${text}`,
    );
  } catch (e) {
    results.push({
      text,
      expected,
      pass: false,
      error: e.message,
      latencyMs: Date.now() - started,
    });
    console.log(`${provider} ERROR ${e.code || "request"}`);
  }
  if (all) await new Promise((resolve) => setTimeout(resolve, 1500));
}
const times = results
  .filter((r) => !r.error)
  .map((r) => r.latencyMs)
  .sort((a, b) => a - b);
const c = providerConfig();
const report = {
  at: new Date().toISOString(),
  provider,
  model: c.model,
  scope: all
    ? "Declared 30-utterance intent corpus; no household mutations"
    : "Six-case provider screening; no household mutations",
  total: results.length,
  passed: results.filter((r) => r.pass).length,
  medianMs: times[Math.floor(times.length / 2)] ?? null,
  p95Ms:
    times[Math.min(times.length - 1, Math.ceil(times.length * 0.95) - 1)] ??
    null,
  results,
};
await mkdir("docs/evidence/mcp-integration", { recursive: true });
await writeFile(
  `docs/evidence/mcp-integration/${provider}${process.argv.includes('--fallback')?'-fallback':''}-${all ? "full" : "screen"}.json`,
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    provider,
    model: c.model,
    passed: report.passed,
    total: report.total,
    medianMs: report.medianMs,
    p95Ms: report.p95Ms,
  }),
);
if (report.passed < report.total) process.exitCode = 1;
