import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { DomainError, requireThat } from "../readyby/schema.mjs";
const scrypt = promisify(scryptCallback);
export const token = () => randomBytes(32).toString("base64url");
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export function validatePassword(value) {
  requireThat(
    typeof value === "string" && value.length >= 12 && value.length <= 128,
    "Use a passphrase of 12–128 characters.",
  );
}
export async function passwordHash(password) {
  validatePassword(password);
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 3,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$32768$8$3$${salt}$${derived.toString("hex")}`;
}
export async function passwordMatches(password, stored) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [algorithm, n, r, p, salt, key] = (stored ?? "").split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;
  const derived = await scrypt(password, salt, 64, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  const expected = Buffer.from(key, "hex");
  return (
    expected.length === derived.length && timingSafeEqual(expected, derived)
  );
}
export function sessionCookie(raw, { secure = false, clear = false } = {}) {
  return `readyby_session=${clear ? "" : raw}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 604800}${secure ? "; Secure" : ""}`;
}
export function readSessionCookie(value) {
  const match = (value ?? "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("readyby_session="));
  return match?.slice("readyby_session=".length);
}
export function rateLimiter({ now = Date.now } = {}) {
  const buckets = new Map();
  return {
    check(key, { limit = 30, windowMs = 60000 } = {}) {
      const time = now();
      let b = buckets.get(key);
      if (!b || b.until <= time) {
        b = { count: 0, until: time + windowMs };
        buckets.set(key, b);
      }
      if (++b.count > limit)
        throw new DomainError(
          "Too many attempts. Please wait before trying again.",
          "RATE_LIMIT",
        );
      if (buckets.size > 5000)
        for (const [k, v] of buckets) if (v.until <= time) buckets.delete(k);
    },
  };
}
export function safeString(value, label, { min = 1, max = 80 } = {}) {
  requireThat(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.trim().length <= max,
    `${label} must be ${min}–${max} characters.`,
  );
  return value.trim();
}
