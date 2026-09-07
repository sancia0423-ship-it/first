import "server-only";

import { createHash } from "node:crypto";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  OPENAI_MAX_RETRIES,
  OPENAI_REQUEST_TIMEOUT_MS,
  getOpenAIModel,
  hasOpenAIKey
} from "@/lib/config";
import {
  MockInterviewEvaluationSchema,
  MockInterviewSessionSchema,
  MockInterviewSummarySchema,
  type MockInterviewAnswerRecord,
  type MockInterviewDimension,
  type MockInterviewDimensionScore,
  type MockInterviewEvaluation,
  type MockInterviewQuestion,
  type MockInterviewSession,
  type MockInterviewSetup,
  type MockInterviewSummary,
  type MockInterviewTargetRole
} from "@/lib/schemas";

type RoleDefinition = {
  label: string;
  narrative: string;
};

type DimensionDefinition = MockInterviewDimension & {
  keywords: string[];
  actionHint: string;
  followUp: string;
};

type QuestionBlueprint = Omit<MockInterviewQuestion, "id">;

const ROLE_DEFINITIONS: Record<MockInterviewTargetRole, RoleDefinition> = {
  "ai-product-general": {
    label: "AI 产品经理",
    narrative: "重点看你能不能把用户价值、模型能力和业务结果连起来。"
  },
  "ai-growth": {
    label: "AI 增长产品经理",
    narrative: "重点看你能否把 AI 能力转成拉新、激活、留存和转化。"
  },
  "ai-agent": {
    label: "AI Agent 产品经理",
    narrative: "重点看你是否理解 agent 的任务拆解、工具调用和兜底机制。"
  },
  "ai-platform": {
    label: "AI 平台产品经理",
    narrative: "重点看你是否能搭一套可复用、可治理、可度量的平台能力。"
  }
};

const SENIORITY_LABELS = {
  intern: "实习 / 校招",
  junior: "1-3 年",
  mid: "3-5 年"
} as const;

const COMPANY_STAGE_LABELS = {
  startup: "创业团队",
  growth: "成长期公司",
  bigtech: "大厂"
} as const;

const DIMENSIONS: DimensionDefinition[] = [
  {
    key: "product_judgment",
    label: "产品判断",
    description: "能否定义目标用户、场景、价值和取舍。",
    keywords: ["用户", "场景", "需求", "痛点", "价值", "优先级", "取舍", "目标", "细分"],
    actionHint: "先把用户问题、核心场景和为什么值得做说透。",
    followUp: "如果资源只够做一个版本，你会保留哪一个核心场景，为什么？"
  },
  {
    key: "ai_reasoning",
    label: "AI 理解",
    description: "是否理解模型边界、评测、延迟、成本和系统方案。",
    keywords: ["模型", "prompt", "rag", "检索", "agent", "工具", "上下文", "评测", "幻觉", "延迟", "成本", "token", "微调"],
    actionHint: "补上为什么要用大模型、何时不用，以及质量与成本如何平衡。",
    followUp: "如果模型效果不稳定，你会怎么拆出 prompt、检索和工具链上的问题？"
  },
  {
    key: "metrics",
    label: "指标设计",
    description: "是否能提出业务指标、体验指标与模型指标。",
    keywords: ["指标", "北极星", "成功率", "留存", "转化", "满意度", "时延", "成本", "roi", "漏斗", "a/b", "ab", "通过率"],
    actionHint: "把目标拆到业务指标、体验指标和模型质量指标三层。",
    followUp: "你会用哪 3 个指标判断这个版本值得继续投入？"
  },
  {
    key: "execution",
    label: "落地推进",
    description: "是否能给出分阶段实验、灰度和跨团队协作方案。",
    keywords: ["实验", "灰度", "迭代", "上线", "埋点", "反馈", "协作", "研发", "运营", "复盘", "拆解", "里程碑"],
    actionHint: "讲清 MVP、验证节奏、谁来协作以及上线后的迭代闭环。",
    followUp: "如果研发和业务目标冲突，你会怎么排优先级并推进共识？"
  },
  {
    key: "risk",
    label: "风险意识",
    description: "是否考虑合规、安全、隐私、误伤与人工兜底。",
    keywords: ["风险", "安全", "合规", "隐私", "审核", "兜底", "人工", "权限", "误伤", "敏感", "治理"],
    actionHint: "别只讲效果，要补上安全边界、人工兜底和权限治理。",
    followUp: "如果线上出现高风险误答，你会先停哪一层能力，怎么留兜底？"
  }
];

const QUESTION_LIBRARY: Record<MockInterviewTargetRole, QuestionBlueprint[]> = {
  "ai-product-general": [
    {
      prompt: "你要做一款 AI 会议助手，第一版你会锁定哪个核心用户场景？为什么？",
      intent: "判断候选人是否能先收敛场景，再判断 AI 是否真的带来价值。",
      dimensionTags: ["product_judgment", "ai_reasoning", "execution"],
      excellentSignals: ["先定义用户与频次最高的任务", "说明为什么规则方案不够", "给出 MVP 边界和验证方法"],
      timebox: "3 分钟"
    },
    {
      prompt: "如果会议助手的总结偶尔会幻觉，但用户又很喜欢自动总结功能，你会如何平衡体验和风险？",
      intent: "看候选人是否理解质量、信任和兜底机制。",
      dimensionTags: ["ai_reasoning", "risk", "execution"],
      excellentSignals: ["区分低风险和高风险输出", "设计引用来源或置信提示", "补人工校验或关闭高风险动作"],
      timebox: "4 分钟"
    },
    {
      prompt: "这款 AI 会议助手上线一个月后，你会优先看哪些指标来判断是否值得继续投入？",
      intent: "判断候选人能否提出业务、体验和模型质量指标。",
      dimensionTags: ["metrics", "product_judgment", "execution"],
      excellentSignals: ["给出北极星和漏斗指标", "同时覆盖质量与延迟/成本", "说明埋点与实验口径"],
      timebox: "3 分钟"
    },
    {
      prompt: "如果老板希望把这款产品做成 Agent，能自动帮用户发邮件和建任务，你会怎么推进下一阶段？",
      intent: "看候选人是否理解 agent 化带来的任务拆解和权限风险。",
      dimensionTags: ["ai_reasoning", "execution", "risk"],
      excellentSignals: ["先拆单步建议再逐步放权", "明确工具调用和权限范围", "设计人工确认与回滚机制"],
      timebox: "4 分钟"
    }
  ],
  "ai-growth": [
    {
      prompt: "你负责一款 AI 写作工具的新用户激活，第一周留存不理想，你会先怎么拆问题？",
      intent: "看候选人能否用增长漏斗拆解 AI 产品的激活难题。",
      dimensionTags: ["metrics", "product_judgment", "execution"],
      excellentSignals: ["先拆入口到首个成功体验漏斗", "识别价值感知是否足够快", "提出实验与埋点方案"],
      timebox: "3 分钟"
    },
    {
      prompt: "如果 AI 写作工具的生成质量不错，但单次调用成本很高，你会怎么做增长取舍？",
      intent: "看候选人如何平衡增长目标和单位经济模型。",
      dimensionTags: ["ai_reasoning", "metrics", "product_judgment"],
      excellentSignals: ["区分高价值用户与免费用户", "考虑模型分层和缓存策略", "把 ROI 与转化一起看"],
      timebox: "4 分钟"
    },
    {
      prompt: "你会怎么设计一个 A/B 实验，验证‘模板引导 + AI 首次代写’是否能提升激活？",
      intent: "看候选人是否能给出完整实验设计。",
      dimensionTags: ["metrics", "execution", "product_judgment"],
      excellentSignals: ["给出实验假设和主指标", "考虑分流口径与样本污染", "说明实验后如何复盘继续迭代"],
      timebox: "3 分钟"
    },
    {
      prompt: "如果用户说 AI 结果好，但不知道下一步怎么改，你会如何提高留存？",
      intent: "看候选人是否能把生成结果和编辑工作流连起来。",
      dimensionTags: ["product_judgment", "execution", "ai_reasoning"],
      excellentSignals: ["识别用户任务流断点", "补引导、推荐操作或智能下一步", "用留存和深度使用验证效果"],
      timebox: "4 分钟"
    }
  ],
  "ai-agent": [
    {
      prompt: "你要做一个销售 Agent，帮销售整理客户资料并生成跟进建议。第一版你会怎么定义任务边界？",
      intent: "看候选人是否理解 agent 不应一上来就全自动。",
      dimensionTags: ["product_judgment", "ai_reasoning", "risk"],
      excellentSignals: ["先选高频且低风险任务", "区分建议型和执行型动作", "明确工具与数据权限边界"],
      timebox: "4 分钟"
    },
    {
      prompt: "如果 Agent 需要调用 CRM、邮件和日历系统，你会怎么设计工具调用链和失败兜底？",
      intent: "判断候选人是否理解工具调用、状态机和回退机制。",
      dimensionTags: ["ai_reasoning", "execution", "risk"],
      excellentSignals: ["说明调用顺序与前置条件", "设计失败回滚与重试", "补人工确认和审计日志"],
      timebox: "4 分钟"
    },
    {
      prompt: "一个 Agent 任务成功率只有 62%，但用户觉得已经有帮助了。你会如何判断要不要继续推进？",
      intent: "看候选人是否能平衡成功率、用户价值和单位成本。",
      dimensionTags: ["metrics", "product_judgment", "ai_reasoning"],
      excellentSignals: ["拆任务成功率与人工节省时间", "区分不同任务复杂度", "同时看成本和误伤风险"],
      timebox: "3 分钟"
    },
    {
      prompt: "如果面试官追问‘什么时候不该做 Agent，而该做 Copilot’，你会怎么回答？",
      intent: "看候选人是否理解 autonomy 与 trust 的 trade-off。",
      dimensionTags: ["ai_reasoning", "product_judgment", "risk"],
      excellentSignals: ["按风险、可逆性和任务确定性区分", "说明先建议后执行的演进路径", "补信任与权限治理"],
      timebox: "3 分钟"
    }
  ],
  "ai-platform": [
    {
      prompt: "你要给内部业务团队搭一个 AI 平台，第一版你最先提供哪三类能力？为什么？",
      intent: "看候选人是否理解平台不是功能堆砌，而是提效和治理并重。",
      dimensionTags: ["product_judgment", "execution", "ai_reasoning"],
      excellentSignals: ["明确核心用户是哪些业务角色", "优先通用能力而不是定制需求", "兼顾提效、质量和治理"],
      timebox: "4 分钟"
    },
    {
      prompt: "如果不同业务线都在抱怨模型效果不稳定，你会怎么设计一套评测与反馈闭环？",
      intent: "看候选人是否理解平台侧的评测、观测和反馈系统。",
      dimensionTags: ["ai_reasoning", "metrics", "execution"],
      excellentSignals: ["区分离线评测与在线监控", "沉淀反馈数据集", "把质量、时延和成本一起观测"],
      timebox: "4 分钟"
    },
    {
      prompt: "平台要不要一开始就支持多模型切换？你会怎么判断优先级？",
      intent: "看候选人是否能做平台能力取舍。",
      dimensionTags: ["product_judgment", "metrics", "execution"],
      excellentSignals: ["从业务需求和成本收益判断", "考虑抽象层复杂度", "说明分阶段演进路径"],
      timebox: "3 分钟"
    },
    {
      prompt: "如果法务担心业务团队乱接外部模型接口，你会怎么设计治理策略？",
      intent: "考察平台产品的权限、审计和合规意识。",
      dimensionTags: ["risk", "execution", "ai_reasoning"],
      excellentSignals: ["补权限管理和审批流程", "加审计日志与敏感数据策略", "提供官方接入方案减少野生接入"],
      timebox: "3 分钟"
    }
  ]
};

const GeneratedSessionSchema = z.object({
  interviewerName: z.string(),
  intro: z.string(),
  questions: z.array(
    z.object({
      prompt: z.string(),
      intent: z.string(),
      dimensionTags: z.array(z.string()).min(2).max(4),
      excellentSignals: z.array(z.string()).min(3).max(5),
      timebox: z.string()
    })
  ).min(4).max(4)
});

const OpenAIEvaluationSchema = MockInterviewEvaluationSchema;

/**
 * Generating four questions or a full rubric takes well over a second; the old
 * 5s ceiling meant the AI path almost always lost the race and silently fell
 * back to the static question bank.
 */
const OPENAI_STEP_TIMEOUT_MS = OPENAI_REQUEST_TIMEOUT_MS;

function getClient() {
  if (!hasOpenAIKey()) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: OPENAI_MAX_RETRIES,
    timeout: OPENAI_REQUEST_TIMEOUT_MS
  });
}

async function withTimeout<T>(task: Promise<T>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  // The loser of the race must still be handled, or a late rejection surfaces
  // as an unhandled promise rejection and can take the process down.
  task.catch(() => undefined);

  try {
    return await Promise.race<T>([
      task,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function getRoleDefinition(role: MockInterviewTargetRole) {
  return ROLE_DEFINITIONS[role];
}

function sanitizeDimensionTags(tags: string[]) {
  const validKeys = new Set(DIMENSIONS.map((dimension) => dimension.key));
  const normalized = tags.filter((tag) => validKeys.has(tag));

  if (normalized.length >= 2) {
    return Array.from(new Set(normalized)).slice(0, 4);
  }

  return ["product_judgment", "ai_reasoning", "execution"];
}

function buildInterviewId(setup: MockInterviewSetup) {
  return createHash("sha1")
    .update(JSON.stringify({ setup, issuedAt: Date.now() }))
    .digest("hex")
    .slice(0, 12);
}

function buildQuestionId(interviewId: string, index: number) {
  return `${interviewId}-q${index + 1}`;
}

function buildFallbackIntro(setup: MockInterviewSetup) {
  const role = getRoleDefinition(setup.targetRole);
  const seniority = SENIORITY_LABELS[setup.seniority];
  const companyStage = COMPANY_STAGE_LABELS[setup.companyStage];
  const background = setup.candidateBackground
    ? `我会顺带参考你的背景：${setup.candidateBackground}。`
    : "如果你有相关项目经历，可以主动带进回答里。";

  return `今天我们模拟一场偏 ${companyStage} 风格的 ${role.label}${seniority}面试。重点会看 ${setup.focusArea}，以及你怎么把用户价值、模型边界和落地节奏串成一个完整方案。${background}`;
}

function buildFallbackQuestions(interviewId: string, setup: MockInterviewSetup) {
  return QUESTION_LIBRARY[setup.targetRole].map((question, index) => ({
    ...question,
    id: buildQuestionId(interviewId, index),
    dimensionTags: sanitizeDimensionTags(question.dimensionTags)
  }));
}

export function buildFallbackInterviewSession(setup: MockInterviewSetup): MockInterviewSession {
  const interviewId = buildInterviewId(setup);

  return MockInterviewSessionSchema.parse({
    interviewId,
    interviewerName: "Mira",
    intro: buildFallbackIntro(setup),
    mode: "heuristic",
    setup,
    dimensions: DIMENSIONS.map(({ key, label, description }) => ({ key, label, description })),
    questions: buildFallbackQuestions(interviewId, setup)
  });
}

async function buildOpenAIInterviewSession(setup: MockInterviewSetup): Promise<MockInterviewSession | null> {
  const client = getClient();

  if (!client) {
    return null;
  }

  const role = getRoleDefinition(setup.targetRole);

  const response = await client.responses.parse({
    model: getOpenAIModel(),
    instructions:
      "你是一位严谨但鼓励式的 AI 产品面试官。请根据候选人的目标岗位，生成 4 道中文面试题。题目必须覆盖用户价值、AI 能力边界、指标设计、落地推进与风险意识中的至少 4 个维度。dimensionTags 只能使用给定 key，不要发明新 key。",
    input: `岗位：${role.label}\n职级：${SENIORITY_LABELS[setup.seniority]}\n公司阶段：${COMPANY_STAGE_LABELS[setup.companyStage]}\n重点方向：${setup.focusArea}\n候选人背景：${setup.candidateBackground || "未提供"}\n\n评分维度：\n${DIMENSIONS.map((dimension) => `${dimension.key}: ${dimension.label} - ${dimension.description}`).join("\n")}`,
    text: {
      format: zodTextFormat(GeneratedSessionSchema, "mock_interview_session")
    }
  });

  if (!response.output_parsed) {
    return null;
  }

  const interviewId = buildInterviewId(setup);

  return MockInterviewSessionSchema.parse({
    interviewId,
    interviewerName: response.output_parsed.interviewerName,
    intro: response.output_parsed.intro,
    mode: "openai",
    setup,
    dimensions: DIMENSIONS.map(({ key, label, description }) => ({ key, label, description })),
    questions: response.output_parsed.questions.map((question, index) => ({
      ...question,
      id: buildQuestionId(interviewId, index),
      dimensionTags: sanitizeDimensionTags(question.dimensionTags)
    }))
  });
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function countKeywordHits(answer: string, keywords: string[]) {
  const normalized = normalizeText(answer);
  const matched = keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  return Array.from(new Set(matched));
}

function hasStructuredFlow(answer: string) {
  return /先|然后|接着|最后|第一|第二|第三|mvp|灰度|分阶段/i.test(answer);
}

function scoreFromHits(hitCount: number, answerLength: number) {
  if (answerLength < 40) {
    return 1;
  }
  if (hitCount >= 4) {
    return 5;
  }
  if (hitCount >= 2) {
    return 4;
  }
  if (hitCount >= 1) {
    return 3;
  }
  return answerLength >= 140 ? 2 : 1;
}

function buildDimensionReason(dimension: DimensionDefinition, matchedKeywords: string[], score: number) {
  if (score >= 4 && matchedKeywords.length > 0) {
    return `回答里提到了 ${matchedKeywords.slice(0, 3).join(" / ")}，说明你有意识覆盖这一维度。`;
  }

  if (score === 3) {
    return `已经触及 ${dimension.label}，但还可以再具体一点，比如补充验证方式或取舍。`;
  }

  return `${dimension.label}相对偏弱，建议补上 ${dimension.actionHint}`;
}

function buildOverallVerdict(score: number) {
  if (score >= 85) {
    return "这是一段比较有竞争力的回答，既有产品判断，也照顾到了 AI 系统约束。";
  }
  if (score >= 72) {
    return "回答方向基本正确，但还可以更像真实面试里的强答：再多一些指标、取舍和落地细节。";
  }
  if (score >= 60) {
    return "回答已经有框架，但偏概念化。面试官大概率会继续追问你如何验证和如何兜底。";
  }

  return "目前更像思路草稿，建议先把用户问题、方案边界和评估指标说完整，再进入细节。";
}

function buildSuggestedOutline(question: MockInterviewQuestion) {
  return [
    "先定义目标用户、核心任务和当前痛点。",
    ...question.excellentSignals.slice(0, 2),
    "最后补上线验证方式、风险控制和下一步迭代。"
  ].slice(0, 5);
}

function buildHeuristicFollowUp(question: MockInterviewQuestion, weakestDimension: DimensionDefinition) {
  if (question.dimensionTags.includes(weakestDimension.key)) {
    return weakestDimension.followUp;
  }

  const dimension = DIMENSIONS.find((item) => question.dimensionTags.includes(item.key));
  return (dimension ?? weakestDimension).followUp;
}

export function evaluateAnswerHeuristically(params: {
  question: MockInterviewQuestion;
  answer: string;
}): MockInterviewEvaluation {
  const normalizedAnswer = params.answer.trim();
  const answerLength = normalizedAnswer.length;
  const structureBonus = hasStructuredFlow(normalizedAnswer) ? 1 : 0;

  const dimensionScores: MockInterviewDimensionScore[] = DIMENSIONS.map((dimension) => {
    const matchedKeywords = countKeywordHits(normalizedAnswer, dimension.keywords);
    let score = scoreFromHits(matchedKeywords.length, answerLength);

    if (params.question.dimensionTags.includes(dimension.key) && structureBonus > 0 && score < 5) {
      score += 1;
    }

    if (!params.question.dimensionTags.includes(dimension.key) && score > 4) {
      score = 4;
    }

    return {
      key: dimension.key,
      label: dimension.label,
      score: Math.max(1, Math.min(5, score)),
      reason: buildDimensionReason(dimension, matchedKeywords, score)
    };
  });

  const averageScore =
    dimensionScores.reduce((sum, item) => sum + item.score, 0) / Math.max(dimensionScores.length, 1);
  const overallScore = Math.max(
    32,
    Math.min(
      96,
      Math.round(averageScore * 20 + (structureBonus > 0 ? 4 : 0) + (answerLength > 220 ? 4 : 0) - (answerLength < 70 ? 6 : 0))
    )
  );

  const sortedByScore = [...dimensionScores].sort((left, right) => right.score - left.score);
  const strengths = sortedByScore
    .filter((item) => item.score >= 4)
    .slice(0, 3)
    .map((item) => `${item.label}表现不错：${item.reason}`);
  const gaps = [...dimensionScores]
    .sort((left, right) => left.score - right.score)
    .filter((item) => item.score <= 3)
    .slice(0, 3)
    .map((item) => `${item.label}还可以加强：${item.reason}`);
  const lowestScoringKey = [...dimensionScores].sort((left, right) => left.score - right.score)[0]?.key;
  const weakestDimension =
    DIMENSIONS.find((dimension) => dimension.key === lowestScoringKey) ?? DIMENSIONS[0];

  return MockInterviewEvaluationSchema.parse({
    overallScore,
    verdict: buildOverallVerdict(overallScore),
    strengths:
      strengths.length > 0
        ? strengths
        : ["回答有基本框架，至少说明了你在尝试按步骤拆问题。"],
    gaps:
      gaps.length > 0
        ? gaps
        : ["可以再补一层业务结果或风险控制，这样会更像完整面试回答。"],
    followUpQuestion: buildHeuristicFollowUp(params.question, weakestDimension),
    dimensionScores,
    suggestedAnswerOutline: buildSuggestedOutline(params.question)
  });
}

async function evaluateAnswerWithOpenAI(params: {
  question: MockInterviewQuestion;
  answer: string;
  setup: MockInterviewSetup;
}): Promise<MockInterviewEvaluation | null> {
  const client = getClient();

  if (!client) {
    return null;
  }

  const response = await client.responses.parse({
    model: getOpenAIModel(),
    instructions:
      "你是一位中文 AI 产品面试官。请严格按照评分维度评价候选人的回答，既指出优点，也指出真正会被追问的漏洞。dimensionScores 必须覆盖全部维度 key，score 为 1-5 的整数。",
    input: `岗位：${getRoleDefinition(params.setup.targetRole).label}\n职级：${SENIORITY_LABELS[params.setup.seniority]}\n重点方向：${params.setup.focusArea}\n候选人背景：${params.setup.candidateBackground || "未提供"}\n\n题目：${params.question.prompt}\n题目意图：${params.question.intent}\n重点维度：${params.question.dimensionTags.join(", ")}\n优秀回答信号：${params.question.excellentSignals.join("；")}\n\n候选人回答：\n${params.answer}\n\n评分维度：\n${DIMENSIONS.map((dimension) => `${dimension.key} / ${dimension.label}: ${dimension.description}`).join("\n")}`,
    text: {
      format: zodTextFormat(OpenAIEvaluationSchema, "mock_interview_evaluation")
    }
  });

  if (!response.output_parsed) {
    return null;
  }

  return MockInterviewEvaluationSchema.parse({
    ...response.output_parsed,
    dimensionScores: response.output_parsed.dimensionScores.map((item) => {
      const matched = DIMENSIONS.find((dimension) => dimension.key === item.key || dimension.label === item.label);
      return {
        key: matched?.key ?? item.key,
        label: matched?.label ?? item.label,
        score: item.score,
        reason: item.reason
      };
    })
  });
}

function buildReadinessLabel(score: number) {
  if (score >= 88) {
    return "有亮点" as const;
  }
  if (score >= 76) {
    return "具备竞争力" as const;
  }
  if (score >= 64) {
    return "可进入一面" as const;
  }
  return "继续打磨" as const;
}

function buildSummaryHeadline(score: number, strongest: MockInterviewDimensionScore | undefined, weakest: MockInterviewDimensionScore | undefined) {
  if (score >= 85 && strongest) {
    return `你已经能稳定讲出 ${strongest.label}，下一步是把回答再压缩得更像真实一面的强答。`;
  }

  if (score >= 70 && weakest) {
    return `整体思路在线，但 ${weakest.label} 还是最容易被追问的短板。`;
  }

  return "这轮更适合当作框架演练，先把完整答题结构练出来，再追求亮点表达。";
}

export function summarizeInterview(records: MockInterviewAnswerRecord[]): MockInterviewSummary {
  const overallScore =
    records.reduce((sum, record) => sum + record.evaluation.overallScore, 0) / Math.max(records.length, 1);
  const dimensionAverages = DIMENSIONS.map((dimension) => {
    const relevantScores = records
      .map((record) => record.evaluation.dimensionScores.find((item) => item.key === dimension.key)?.score)
      .filter((score): score is number => typeof score === "number");
    const average =
      relevantScores.reduce((sum, score) => sum + score, 0) / Math.max(relevantScores.length, 1);

    return {
      key: dimension.key,
      label: dimension.label,
      score: Number(average.toFixed(1))
    };
  });
  const sorted = [...dimensionAverages].sort((left, right) => right.score - left.score);
  const strongest = sorted[0];
  const weakest = [...dimensionAverages].sort((left, right) => left.score - right.score)[0];
  const collectedStrengths = Array.from(new Set(records.flatMap((record) => record.evaluation.strengths))).slice(0, 4);
  const collectedRisks = Array.from(new Set(records.flatMap((record) => record.evaluation.gaps))).slice(0, 4);
  const nextSteps = [
    strongest ? `继续保留你的 ${strongest.label} 表达方式，但把案例缩到 90 秒内说完。` : "",
    weakest
      ? `${weakest.label} 是目前最弱的一项，建议专门准备一套“场景 - 方案 - 指标 - 风险”的标准答案。`
      : "",
    "至少准备 2 个 AI 项目案例，并能说明为什么选这个系统方案而不是纯规则方案。",
    "每道题都练到能自然补出业务指标、模型质量指标和灰度验证方案。"
  ].filter(Boolean);

  return MockInterviewSummarySchema.parse({
    overallScore: Math.round(overallScore),
    readinessLabel: buildReadinessLabel(overallScore),
    headline: buildSummaryHeadline(overallScore, strongest && { ...strongest, reason: "" }, weakest && { ...weakest, reason: "" }),
    strengths:
      collectedStrengths.length > 0
        ? collectedStrengths
        : ["你已经开始用结构化方式回答问题，这是一个不错的起点。"],
    risks:
      collectedRisks.length > 0
        ? collectedRisks
        : ["后续可以继续加强指标、风险和落地细节。"],
    nextSteps: nextSteps.slice(0, 4),
    dimensionAverages
  });
}

export async function createInterviewSession(setup: MockInterviewSetup) {
  try {
    const aiSession = await withTimeout(buildOpenAIInterviewSession(setup), OPENAI_STEP_TIMEOUT_MS);
    if (aiSession) {
      return aiSession;
    }
  } catch {
    // Fall back to the deterministic session builder.
  }

  return buildFallbackInterviewSession(setup);
}

export async function evaluateInterviewAnswer(params: {
  question: MockInterviewQuestion;
  answer: string;
  setup: MockInterviewSetup;
}) {
  try {
    const aiEvaluation = await withTimeout(evaluateAnswerWithOpenAI(params), OPENAI_STEP_TIMEOUT_MS);
    if (aiEvaluation) {
      return aiEvaluation;
    }
  } catch {
    // Fall back to the deterministic rubric.
  }

  return evaluateAnswerHeuristically({
    question: params.question,
    answer: params.answer
  });
}
