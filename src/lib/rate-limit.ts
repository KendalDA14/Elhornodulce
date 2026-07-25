import { headers } from "next/headers";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();
const MAX_BUCKETS = 10_000;
let lastPruneAt = 0;

function pruneExpiredBuckets(now: number) {
  if (now - lastPruneAt < 60_000) return;

  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }

  lastPruneAt = now;
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  pruneExpiredBuckets(now);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    if (!current && buckets.size >= MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (typeof oldestKey === "string") buckets.delete(oldestKey);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;

  current.count += 1;
  return true;
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}

export function rateLimitKey(scope: string, value: string) {
  return `${scope}:${value.toLowerCase().trim().slice(0, 120)}`;
}

export function clientIpFromHeaders(headerStore: Headers) {
  const forwardedChain = headerStore
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const forwarded = forwardedChain?.at(-1);
  const candidate =
    headerStore.get("cf-connecting-ip")?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    forwarded ||
    "unknown";

  return candidate.replace(/[^a-fA-F0-9:.\-_]/g, "").slice(0, 64) || "unknown";
}

export async function requestRateLimitKey(scope: string, discriminator = "") {
  const headerStore = await headers();
  const clientIp = clientIpFromHeaders(headerStore);
  return rateLimitKey(scope, `${clientIp}:${discriminator}`);
}
