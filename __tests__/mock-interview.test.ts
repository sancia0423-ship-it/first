import { describe, expect, it } from "vitest";
import {
  buildFallbackInterviewSession,
  evaluateAnswerHeuristically,
  summarizeInterview
} from "../lib/mock-interview";

const setup = {
  targetRole: "ai-agent" as const,
  seniority: "intern" as const,
  companyStage: "growth" as const,
  focusArea: "销售 Agent",
  candidateBackground: "有 ToB 实习和数据分析经历"
};

describe("mock interview fallback flow", () => {
  it("builds a deterministic fallback session with four questions", () => {
    const session = buildFallbackInterviewSession(setup);

    expect(session.mode).toBe("heuristic");
    expect(session.questions).toHaveLength(4);
    expect(session.dimensions).toHaveLength(5);
    expect(session.questions.every((question) => question.dimensionTags.length >= 2)).toBe(true);
  });

  it("scores a structured answer higher than a shallow answer", () => {
    const session = buildFallbackInterviewSession(setup);
    const question = session.questions[0];

    const strong = evaluateAnswerHeuristically({
      question,
      answer:
        "我会先限定在低风险、高频的跟进建议场景，先让 Agent 做资料整理和建议生成，不直接自动发邮件。然后我会把用户分成销售新人和资深销售两类，看谁最需要节省准备时间。方案上结合 CRM 检索、Prompt 约束和人工确认，先观察建议采纳率、任务成功率和单次调用成本。最后再补权限控制、审计日志和灰度放量。"
    });

    const weak = evaluateAnswerHeuristically({
      question,
      answer: "我会先做一个 Agent，帮助销售更快跟进客户，后面再慢慢优化。"
    });

    expect(strong.overallScore).toBeGreaterThan(weak.overallScore);
    expect(strong.dimensionScores.find((item) => item.key === "risk")?.score).toBeGreaterThanOrEqual(3);
  });

  it("aggregates per-question evaluations into a final summary", () => {
    const session = buildFallbackInterviewSession(setup);
    const records = session.questions.slice(0, 2).map((question) => ({
      questionId: question.id,
      prompt: question.prompt,
      answer:
        "我会先定义用户场景，再说明为什么用 AI，同时给出指标、灰度和人工兜底。",
      evaluation: evaluateAnswerHeuristically({
        question,
        answer:
          "我会先定义用户场景，再说明为什么用 AI，同时给出指标、灰度和人工兜底。"
      })
    }));

    const summary = summarizeInterview(records);

    expect(summary.dimensionAverages).toHaveLength(5);
    expect(summary.overallScore).toBeGreaterThan(0);
    expect(summary.nextSteps.length).toBeGreaterThan(0);
  });
});
