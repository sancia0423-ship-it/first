import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "../lib/concurrency";

describe("mapWithConcurrency", () => {
  it("preserves input order", async () => {
    const results = await mapWithConcurrency([5, 1, 3], 2, async (value) => {
      await new Promise((resolve) => setTimeout(resolve, value));
      return value * 2;
    });

    expect(results).toEqual([10, 2, 6]);
  });

  it("never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let peak = 0;

    await mapWithConcurrency(Array.from({ length: 10 }, (_, i) => i), 3, async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return null;
    });

    expect(peak).toBeLessThanOrEqual(3);
  });

  it("handles an empty list", async () => {
    await expect(mapWithConcurrency([], 4, async () => 1)).resolves.toEqual([]);
  });
});
