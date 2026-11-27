type Attempt = { count: number; resetAt: number };

export type LimitRule = { max: number; windowMs: number };

/** Per account+IP login attempts. */
export const LOGIN_ACCOUNT_RULE: LimitRule = {
  max: 8,
  windowMs: 10 * 60 * 1000,
};

/** All login attempts from one IP, so rotating emails does not bypass the limit. */
export const LOGIN_IP_RULE: LimitRule = {
  max: 30,
  windowMs: 10 * 60 * 1000,
};

/** Account creation per IP (each one runs a cost-12 bcrypt hash). */
export const REGISTER_IP_RULE: LimitRule = {
  max: 5,
  windowMs: 60 * 60 * 1000,
};

const attempts = new Map<string, Attempt>();
const MAX_ENTRIES = 10_000;

function prune(now: number): void {
  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key);
  }
  // Guarantee the map stays bounded even when every entry is still live.
  while (attempts.size >= MAX_ENTRIES) {
    const oldest = attempts.keys().next();
    if (oldest.done) break;
    attempts.delete(oldest.value);
  }
}

function storageKey(bucket: string, key: string): string {
  return `${bucket}:${key}`;
}

export function checkLimit(
  bucket: string,
  key: string,
  rule: LimitRule,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = attempts.get(storageKey(bucket, key));
  if (!entry || entry.resetAt <= now) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= rule.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordLimitHit(
  bucket: string,
  key: string,
  rule: LimitRule,
): void {
  const now = Date.now();
  const id = storageKey(bucket, key);
  if (attempts.size >= MAX_ENTRIES) prune(now);

  const entry = attempts.get(id);
  if (!entry || entry.resetAt <= now) {
    attempts.set(id, { count: 1, resetAt: now + rule.windowMs });
    return;
  }
  entry.count += 1;
}

export function clearLimit(bucket: string, key: string): void {
  attempts.delete(storageKey(bucket, key));
}
