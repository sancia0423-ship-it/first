import { describe, expect, it } from "vitest";
import { aggregateSignals } from "../lib/pipeline/aggregation";
import type { InterviewSignal } from "../lib/schemas";

function makeSignal(overrides: Partial<InterviewSignal> = {}): InterviewSignal {
  return {
    sourceId: "test-01",
    title: "测试面经",
    sourceName: "Mock",
    sourceUrl: "https://example.com/test",
    publishedAt: "2026-03-01",
    authorLabel: "",
    company: "字节跳动",
    role: "产品经理实习",
    direction: "增长",
    process: ["一面", "二面", "HR面"],
    totalCycleDays: 10,
    questions: [
      {
        question: "你做过的增长项目里，最核心的指标是什么？",
        normalizedQuestion: "增长项目最核心的指标是什么",
        topicTag: "增长分析",
        roundLabel: "一面",
        evidenceSnippet: "面试官追问指标。"
      }
    ],
    notes: [],
    summarySnippet: "测试摘要。",
    extractionMethod: "heuristic",
    ...overrides
  };
}

describe("aggregateSignals", () => {
  it("returns sampleSize 0 for empty signals", () => {
    const result = aggregateSignals({
      input: { company: "字节跳动", role: "产品经理实习", direction: "增长" },
      expandedQueries: ["字节跳动 产品经理实习 增长 面经"],
      signals: [],
      mode: "mock",
      stageSummary: "无",
      sourceScope: "无",
      warnings: [],
      retrievalSource: "mock",
      extractionMode: "mock",
      retrievedCount: 0,
      extractedCount: 0
    });

    expect(result.sampleSize).toBe(0);
    expect(result.confidenceLabel).toBe("低");
  });

  it("computes median cycle days correctly", () => {
    const result = aggregateSignals({
      input: { company: "字节跳动", role: "产品经理实习", direction: "增长" },
      expandedQueries: [],
      signals: [
        makeSignal({ totalCycleDays: 8 }),
        makeSignal({ sourceId: "test-02", totalCycleDays: 12 }),
        makeSignal({ sourceId: "test-03", totalCycleDays: 15 })
      ],
      mode: "live",
      stageSummary: "",
      sourceScope: "",
      warnings: [],
      retrievalSource: "",
      extractionMode: "",
      retrievedCount: 3,
      extractedCount: 3
    });

    expect(result.overview.medianCycleDays).toBe(12);
    expect(result.sampleSize).toBe(3);
    expect(result.confidenceLabel).toBe("中高");
  });

  it("aggregates questions and counts duplicates", () => {
    const sharedQuestion = {
      question: "自我介绍",
      normalizedQuestion: "自我介绍",
      topicTag: "背景匹配",
      roundLabel: "一面",
      evidenceSnippet: "..."
    };

    const result = aggregateSignals({
      input: { company: "字节跳动", role: "产品经理实习", direction: "" },
      expandedQueries: [],
      signals: [
        makeSignal({ questions: [sharedQuestion] }),
        makeSignal({ sourceId: "test-02", questions: [{ ...sharedQuestion, roundLabel: "二面" }] })
      ],
      mode: "live",
      stageSummary: "",
      sourceScope: "",
      warnings: [],
      retrievalSource: "",
      extractionMode: "",
      retrievedCount: 2,
      extractedCount: 2
    });

    const matched = result.topQuestions.find((q) => q.question === "自我介绍");
    expect(matched).toBeDefined();
    expect(matched!.count).toBe(2);
    expect(matched!.roundLabels).toContain("一面");
    expect(matched!.roundLabels).toContain("二面");
  });
});
