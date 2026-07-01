"use client";

import { useState } from "react";
import type {
  MockInterviewAnswerRecord,
  MockInterviewEvaluation,
  MockInterviewQuestion,
  MockInterviewSession,
  MockInterviewSetup,
  MockInterviewSummary
} from "@/lib/schemas";

const ROLE_OPTIONS = [
  {
    value: "ai-product-general",
    label: "通用 AI 产品",
    note: "适合讲用户价值、方案边界和落地取舍。"
  },
  {
    value: "ai-growth",
    label: "AI 增长产品",
    note: "更看重漏斗、激活、留存和 ROI。"
  },
  {
    value: "ai-agent",
    label: "AI Agent 产品",
    note: "更强调任务拆解、工具调用和权限风险。"
  },
  {
    value: "ai-platform",
    label: "AI 平台产品",
    note: "更强调平台能力、评测体系和治理。"
  }
] as const;

const SENIORITY_OPTIONS = [
  { value: "intern", label: "实习 / 校招" },
  { value: "junior", label: "1-3 年" },
  { value: "mid", label: "3-5 年" }
] as const;

const COMPANY_STAGE_OPTIONS = [
  { value: "startup", label: "创业团队" },
  { value: "growth", label: "成长期公司" },
  { value: "bigtech", label: "大厂" }
] as const;

const DEFAULT_SETUP: MockInterviewSetup = {
  targetRole: "ai-product-general",
  seniority: "intern",
  companyStage: "growth",
  focusArea: "AI Copilot / Agent",
  candidateBackground: "有增长分析和实习项目经历"
};

type AnswerMap = Record<string, string>;
type EvaluationMap = Record<string, { answer: string; evaluation: MockInterviewEvaluation }>;

function getDimensionLabel(session: MockInterviewSession | null, key: string) {
  return session?.dimensions.find((dimension) => dimension.key === key)?.label ?? key;
}

async function postJson<T>(payload: unknown) {
  const response = await fetch("/api/mock-interview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorBody?.error ?? "请求失败");
  }

  return (await response.json()) as T;
}

export function MockInterviewDemo() {
  const [setup, setSetup] = useState<MockInterviewSetup>(DEFAULT_SETUP);
  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [evaluations, setEvaluations] = useState<EvaluationMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [summary, setSummary] = useState<MockInterviewSummary | null>(null);
  const [busyAction, setBusyAction] = useState<"start" | "evaluate" | "summary" | null>(null);
  const [error, setError] = useState("");

  const currentQuestion = session?.questions[currentIndex] ?? null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] ?? "" : "";
  const currentEvaluation = currentQuestion ? evaluations[currentQuestion.id]?.evaluation ?? null : null;
  const completedCount = session ? Object.keys(evaluations).length : 0;
  const progress = session ? Math.round((completedCount / session.questions.length) * 100) : 0;

  function updateSetup<K extends keyof MockInterviewSetup>(key: K, value: MockInterviewSetup[K]) {
    setSetup((previous) => ({
      ...previous,
      [key]: value
    }));
  }

  function updateAnswer(questionId: string, value: string) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value
    }));

    if (evaluations[questionId]) {
      setEvaluations((previous) => {
        const next = { ...previous };
        delete next[questionId];
        return next;
      });
      setSummary(null);
    }
  }

  async function startInterview() {
    setBusyAction("start");
    setError("");

    try {
      const nextSession = await postJson<MockInterviewSession>({
        action: "start",
        setup
      });

      setSession(nextSession);
      setAnswers({});
      setEvaluations({});
      setSummary(null);
      setCurrentIndex(0);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "启动模拟面试失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function evaluateCurrentAnswer() {
    if (!currentQuestion) {
      return;
    }

    if (currentAnswer.trim().length < 20) {
      setError("先至少写 20 个字，再让面试官点评。");
      return;
    }

    setBusyAction("evaluate");
    setError("");

    try {
      const evaluation = await postJson<MockInterviewEvaluation>({
        action: "evaluate",
        setup,
        question: currentQuestion,
        answer: currentAnswer
      });

      setEvaluations((previous) => ({
        ...previous,
        [currentQuestion.id]: {
          answer: currentAnswer,
          evaluation
        }
      }));
      setSummary(null);
    } catch (evaluationError) {
      setError(evaluationError instanceof Error ? evaluationError.message : "点评失败");
    } finally {
      setBusyAction(null);
    }
  }

  async function finishInterview() {
    if (!session) {
      return;
    }

    const records: MockInterviewAnswerRecord[] = session.questions
      .map((question) => {
        const matched = evaluations[question.id];

        if (!matched) {
          return null;
        }

        return {
          questionId: question.id,
          prompt: question.prompt,
          answer: matched.answer,
          evaluation: matched.evaluation
        };
      })
      .filter((record): record is MockInterviewAnswerRecord => record !== null);

    if (records.length !== session.questions.length) {
      setError("还有题目没点评完，先把每一题都过一遍。");
      return;
    }

    setBusyAction("summary");
    setError("");

    try {
      const nextSummary = await postJson<MockInterviewSummary>({
        action: "summary",
        records
      });

      setSummary(nextSummary);
    } catch (summaryError) {
      setError(summaryError instanceof Error ? summaryError.message : "生成总结失败");
    } finally {
      setBusyAction(null);
    }
  }

  function resetInterview() {
    setSession(null);
    setAnswers({});
    setEvaluations({});
    setSummary(null);
    setCurrentIndex(0);
    setError("");
    setBusyAction(null);
  }

  return (
    <div className="section-grid mock-demo-grid">
      <section className="panel span-8 mock-main-panel">
        {!session ? (
          <div className="mock-setup">
            <div className="section-header section-header-inline">
              <div>
                <span className="section-kicker">Mock Interview</span>
                <h2 className="panel-title">配置一场 AI 产品面试</h2>
              </div>
            </div>

            <div className="mock-role-grid">
              {ROLE_OPTIONS.map((option) => (
                <button
                  className={`mode-card ${setup.targetRole === option.value ? "mode-card-active" : ""}`}
                  key={option.value}
                  onClick={() => updateSetup("targetRole", option.value)}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <span>{option.note}</span>
                </button>
              ))}
            </div>

            <div className="mock-form-grid section">
              <label>
                目标职级
                <select
                  value={setup.seniority}
                  onChange={(event) => updateSetup("seniority", event.target.value as MockInterviewSetup["seniority"])}
                >
                  {SENIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                公司风格
                <select
                  value={setup.companyStage}
                  onChange={(event) => updateSetup("companyStage", event.target.value as MockInterviewSetup["companyStage"])}
                >
                  {COMPANY_STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="span-2">
                重点方向
                <input
                  onChange={(event) => updateSetup("focusArea", event.target.value)}
                  placeholder="例如：RAG 搜索 / AI Agent / Copilot"
                  value={setup.focusArea}
                />
              </label>

              <label className="span-2">
                你的背景
                <textarea
                  onChange={(event) => updateSetup("candidateBackground", event.target.value)}
                  placeholder="例如：有数据分析、增长项目或 AI 应用实习经历"
                  rows={4}
                  value={setup.candidateBackground}
                />
              </label>
            </div>

            <div className="callout callout-strong section">
              <strong>这版 demo 会做什么</strong>
              <p className="muted">
                先生成 4 道 AI 产品面试题，再逐题给出评分、追问和更强回答结构。没配
                `OPENAI_API_KEY` 时会走本地题库与规则评分，但整条链路依然可演示。
              </p>
            </div>

            <div className="button-row">
              <button className="primary-button" disabled={busyAction !== null || !setup.focusArea.trim()} onClick={startInterview} type="button">
                {busyAction === "start" ? "面试官入场中..." : "开始模拟面试"}
              </button>
              <span className="muted form-helper">建议把背景写得具体一点，这样更像真实面试中的定制追问。</span>
            </div>
          </div>
        ) : (
          <div className="mock-session">
            <div className="mock-session-top">
              <div>
                <div className="meta-row">
                  <span className="eyebrow">Session Live</span>
                  <span className="meta-pill">{session.mode === "openai" ? "AI 动态出题" : "本地回退模式"}</span>
                  <span className="meta-pill">
                    已完成 {completedCount}/{session.questions.length}
                  </span>
                </div>
                <h2 className="panel-title">{session.interviewerName} 正在面试你</h2>
                <p className="muted mock-intro">{session.intro}</p>
              </div>

              <div className="mock-progress-card">
                <span>当前进度</span>
                <strong>{progress}%</strong>
                <div className="progress-track" aria-hidden="true">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {currentQuestion ? (
              <div className="question-stage section">
                <div className="question-stage-header">
                  <div>
                    <span className="section-kicker">
                      Question {currentIndex + 1} / {session.questions.length}
                    </span>
                    <h3 className="panel-title">{currentQuestion.prompt}</h3>
                  </div>
                  <span className="meta-pill">建议时长 {currentQuestion.timebox}</span>
                </div>

                <p className="muted">{currentQuestion.intent}</p>

                <div className="chip-row section">
                  {currentQuestion.dimensionTags.map((tag) => (
                    <span className="chip static-chip" key={tag}>
                      {getDimensionLabel(session, tag)}
                    </span>
                  ))}
                </div>

                <div className="callout section">
                  <strong>强回答应该出现什么</strong>
                  <ul className="stack-list">
                    {currentQuestion.excellentSignals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </div>

                <label className="mock-answer-field section">
                  你的回答
                  <textarea
                    onChange={(event) => updateAnswer(currentQuestion.id, event.target.value)}
                    placeholder="试着按“用户问题 -> 方案取舍 -> 指标验证 -> 风险兜底”来回答。"
                    rows={8}
                    value={currentAnswer}
                  />
                </label>

                <div className="button-row">
                  <button
                    className="primary-button"
                    disabled={busyAction !== null}
                    onClick={evaluateCurrentAnswer}
                    type="button"
                  >
                    {busyAction === "evaluate" ? "面试官点评中..." : "提交这题并点评"}
                  </button>

                  {currentEvaluation ? (
                    currentIndex < session.questions.length - 1 ? (
                      <button
                        className="ghost-button"
                        disabled={busyAction !== null}
                        onClick={() => setCurrentIndex((previous) => previous + 1)}
                        type="button"
                      >
                        下一题
                      </button>
                    ) : (
                      <button
                        className="ghost-button"
                        disabled={busyAction !== null}
                        onClick={finishInterview}
                        type="button"
                      >
                        {busyAction === "summary" ? "生成总评中..." : "生成最终总评"}
                      </button>
                    )
                  ) : null}

                  <button className="ghost-button" disabled={busyAction !== null} onClick={resetInterview} type="button">
                    重新开始
                  </button>
                </div>

                {currentEvaluation ? (
                  <div className="mock-feedback section">
                    <div className="result-header">
                      <div className="result-intro">
                        <div className="meta-row">
                          <span className="eyebrow">Interview Feedback</span>
                          <span className="meta-pill">本题得分 {currentEvaluation.overallScore}</span>
                        </div>
                        <h3 className="panel-title">这一题的面试官反馈</h3>
                        <p className="muted">{currentEvaluation.verdict}</p>
                      </div>
                    </div>

                    <div className="stats-grid">
                      {currentEvaluation.dimensionScores.map((score) => (
                        <div className="stat-card" key={score.key}>
                          <p className="stat-label">{score.label}</p>
                          <p className="stat-value">
                            {score.score}
                            <span className="score-suffix">/5</span>
                          </p>
                          <p className="metric-note">{score.reason}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mock-feedback-grid section">
                      <div className="callout">
                        <strong>回答亮点</strong>
                        <ul className="stack-list">
                          {currentEvaluation.strengths.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="callout">
                        <strong>会被追问的点</strong>
                        <ul className="stack-list">
                          {currentEvaluation.gaps.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="callout callout-strong section">
                      <strong>面试官下一句大概率会问</strong>
                      <p className="muted">{currentEvaluation.followUpQuestion}</p>
                    </div>

                    <div className="callout section">
                      <strong>更强回答结构</strong>
                      <ol className="result-list">
                        {currentEvaluation.suggestedAnswerOutline.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {summary ? (
              <div className="section">
                <div className="result-header">
                  <div className="result-intro">
                    <div className="meta-row">
                      <span className="eyebrow">Final Debrief</span>
                      <span className="meta-pill">{summary.readinessLabel}</span>
                      <span className="meta-pill">总分 {summary.overallScore}</span>
                    </div>
                    <h3 className="panel-title">最终面试总结</h3>
                    <p className="muted">{summary.headline}</p>
                  </div>
                </div>

                <div className="stats-grid section">
                  {summary.dimensionAverages.map((item) => (
                    <div className="stat-card" key={item.key}>
                      <p className="stat-label">{item.label}</p>
                      <p className="stat-value">
                        {item.score}
                        <span className="score-suffix">/5</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mock-feedback-grid section">
                  <div className="callout">
                    <strong>你最稳的部分</strong>
                    <ul className="stack-list">
                      {summary.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="callout">
                    <strong>接下来要补的部分</strong>
                    <ul className="stack-list">
                      {summary.risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="callout callout-strong section">
                  <strong>下一轮练习建议</strong>
                  <ul className="stack-list">
                    {summary.nextSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <aside className="span-4 mock-side-column">
        <div className="panel">
          <div className="section-header section-header-inline">
            <div>
              <span className="section-kicker">Rubric</span>
              <h3 className="panel-title">面试官在看什么</h3>
            </div>
          </div>
          <ul className="stack-list">
            {(session?.dimensions ?? []).length > 0
              ? session?.dimensions.map((dimension) => (
                  <li key={dimension.key}>
                    <strong>{dimension.label}</strong>
                    <span className="muted">{dimension.description}</span>
                  </li>
                ))
              : [
                  "产品判断：能否定义用户问题、价值和取舍。",
                  "AI 理解：是否真的理解模型能力边界、质量与成本。",
                  "指标设计：能否把结果拆到业务指标和模型指标。",
                  "落地推进：是否能说清实验、灰度和协作。",
                  "风险意识：是否会主动补安全、合规和兜底。"
                ].map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="panel section">
          <div className="section-header section-header-inline">
            <div>
              <span className="section-kicker">Answer Pattern</span>
              <h3 className="panel-title">高分回答模板</h3>
            </div>
          </div>
          <ol className="result-list">
            <li>先定义用户、场景和问题，不要一上来就讲模型。</li>
            <li>再说明为什么这里值得用 AI，而不是规则或人工流程。</li>
            <li>给出指标、实验和分阶段推进方案。</li>
            <li>最后补风险控制、权限和人工兜底。</li>
          </ol>
        </div>

        <div className="panel section">
          <div className="section-header section-header-inline">
            <div>
              <span className="section-kicker">Demo Tips</span>
              <h3 className="panel-title">怎么讲这个产品</h3>
            </div>
          </div>
          <ul className="stack-list">
            <li>它不是单纯问答机器人，而是一套可演示的面试产品闭环。</li>
            <li>有 key 时是动态 AI 面试官，没 key 时也能完整跑通本地回退。</li>
            <li>每题都输出评分、追问和更强答案结构，方便继续迭代。</li>
          </ul>
        </div>

        {error ? (
          <div className="panel section error-panel">
            <strong>当前提示</strong>
            <p className="muted">{error}</p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
