import { describe, expect, it } from "vitest";
import {
  checkLimit,
  clearLimit,
  recordLimitHit,
  type LimitRule,
} from "@/lib/rate-limit";
import { registerSchema, safeNextPath } from "@/lib/validation";

describe("safeNextPath", () => {
  it("keeps in-app paths with query strings and hashes", () => {
    expect(safeNextPath("/week?week=2026-11-23")).toBe("/week?week=2026-11-23");
    expect(safeNextPath("/settings#account")).toBe("/settings#account");
  });

  it.each([
    "//evil.com",
    "///evil.com",
    "/\\evil.com",
    "/%5Cevil.com",
    "/%5cevil.com",
    "/%2F%2Fevil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "/%0d%0aLocation:%20https://evil.com",
    "/ok\r\nSet-Cookie: x=1",
  ])("rejects open-redirect candidate %s", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  it("falls back to the home path for empty or malformed values", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("/%zz")).toBe("/");
  });
});

describe("registerSchema password handling", () => {
  const base = { name: "Test", email: "test@example.com" };

  it("accepts a password within bcrypt's 72-byte limit", () => {
    expect(
      registerSchema.safeParse({ ...base, password: "a".repeat(72) }).success,
    ).toBe(true);
  });

  it("rejects a password longer than 72 bytes", () => {
    expect(
      registerSchema.safeParse({ ...base, password: "a".repeat(73) }).success,
    ).toBe(false);
  });

  it("counts bytes rather than characters for multi-byte passwords", () => {
    // "é" is 2 bytes in UTF-8: 36 chars = 72 bytes, 37 chars = 74 bytes.
    expect(
      registerSchema.safeParse({ ...base, password: "é".repeat(36) }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({ ...base, password: "é".repeat(37) }).success,
    ).toBe(false);
  });
});

describe("rate limiter", () => {
  const rule: LimitRule = { max: 2, windowMs: 10_000 };

  it("blocks after the configured number of hits and resets on clear", () => {
    const bucket = "test-bucket";
    const key = "1.2.3.4";
    clearLimit(bucket, key);

    expect(checkLimit(bucket, key, rule).allowed).toBe(true);
    recordLimitHit(bucket, key, rule);
    recordLimitHit(bucket, key, rule);

    const blocked = checkLimit(bucket, key, rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    clearLimit(bucket, key);
    expect(checkLimit(bucket, key, rule).allowed).toBe(true);
  });

  it("isolates buckets and keys from each other", () => {
    const ruleB: LimitRule = { max: 1, windowMs: 10_000 };
    clearLimit("bucket-a", "key");
    clearLimit("bucket-b", "key");
    clearLimit("bucket-a", "other");

    recordLimitHit("bucket-a", "key", ruleB);

    expect(checkLimit("bucket-a", "key", ruleB).allowed).toBe(false);
    expect(checkLimit("bucket-b", "key", ruleB).allowed).toBe(true);
    expect(checkLimit("bucket-a", "other", ruleB).allowed).toBe(true);
  });
});
