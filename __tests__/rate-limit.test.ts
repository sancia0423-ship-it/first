import { describe, expect, it } from "vitest";
import { isRateLimited } from "../lib/pipeline/rate-limit";

describe("isRateLimited", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, 60_000, 5)).toBe(false);
    }
  });

  it("blocks requests over the limit", () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      isRateLimited(key, 60_000, 3);
    }
    expect(isRateLimited(key, 60_000, 3)).toBe(true);
  });
});
