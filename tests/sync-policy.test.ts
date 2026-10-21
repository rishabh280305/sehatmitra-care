import { describe, expect, it } from "vitest";
import { retryDelayMs, shouldRetry } from "../src/lib/sync-policy";

describe("offline synchronization policy", () => {
  it("uses capped exponential backoff", () => {
    expect(retryDelayMs(0)).toBe(1_000);
    expect(retryDelayMs(3)).toBe(8_000);
    expect(retryDelayMs(20)).toBe(60_000);
  });

  it("retries transient failures only", () => {
    expect(shouldRetry(null)).toBe(true);
    expect(shouldRetry(429)).toBe(true);
    expect(shouldRetry(503)).toBe(true);
    expect(shouldRetry(400)).toBe(false);
    expect(shouldRetry(401)).toBe(false);
  });
});
