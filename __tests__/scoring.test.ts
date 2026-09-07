import { describe, expect, it } from "vitest";
import { collectSettled, dedupeCandidates } from "../lib/pipeline/scoring";
import type { SourceCandidate } from "../lib/schemas";

function candidate(sourceUrl: string): SourceCandidate {
  return {
    id: sourceUrl,
    title: sourceUrl,
    sourceName: "test",
    sourceUrl,
    publishedAt: "未知",
    authorLabel: "",
    summarySnippet: "",
    previewText: "",
    relevanceScore: 0,
    retrievalReason: "",
    tags: []
  };
}

describe("dedupeCandidates", () => {
  it("keeps the first entry per url", () => {
    const result = dedupeCandidates([
      candidate("https://a.test/1"),
      candidate("https://b.test/1"),
      candidate("https://a.test/1")
    ]);

    expect(result.map((item) => item.sourceUrl)).toEqual(["https://a.test/1", "https://b.test/1"]);
  });
});

describe("collectSettled", () => {
  it("keeps results from the queries that succeeded", async () => {
    const results = await collectSettled(
      [Promise.resolve([1, 2]), Promise.reject(new Error("boom")), Promise.resolve([3])],
      "test"
    );

    expect(results).toEqual([1, 2, 3]);
  });

  it("rethrows when every query failed", async () => {
    await expect(
      collectSettled([Promise.reject(new Error("boom"))], "test")
    ).rejects.toThrow("boom");
  });
});
