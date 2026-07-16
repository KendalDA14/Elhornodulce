type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
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
