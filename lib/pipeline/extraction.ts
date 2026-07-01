import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { fetchJuejinDocument } from "@/lib/pipeline/juejin";
import { fetchNowcoderDocument } from "@/lib/pipeline/nowcoder";
import { normalizeWhitespace, summarizeText, uniqueStrings } from "@/lib/pipeline/text";
import type { InterviewSignal, QuestionEvidence, SearchInput, SourceCandidate } from "@/lib/schemas";

type ExtractionBundle = {
  signals: InterviewSignal[];
  extractedCount: number;
  extractionMode: string;
  warnings: string[];
};

type SourceDocument =
  | Awaited<ReturnType<typeof fetchNowcoderDocument>>
  | Awaited<ReturnType<typeof fetchJuejinDocument>>;

async function fetchSourceDocument(candidate: SourceCandidate): Promise<SourceDocument> {
  if (candidate.sourceUrl.includes("juejin.cn")) {
    return fetchJuejinDocument(candidate);
  }

  return fetchNowcoderDocument(candidate);
}

const ParsedInterviewSchema = z.object({
  process: z.array(z.string()).max(8),
  totalCycleDays: z.number().nullable(),
  questions: z.array(
    z.object({
      question: z.string(),
      normalizedQuestion: z.string(),
      topicTag: z.string(),
      roundLabel: z.string(),
      evidenceSnippet: z.string()
    })
  ),
  notes: z.array(z.string()).max(6),
  summarySnippet: z.string()
});

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function normalizeRoundLabel(raw: string) {
  const compact = raw.replace(/\s+/g, "");
  const lower = compact.toLowerCase();

  if (compact.includes("笔试") || compact.includes("测评")) {
    return "笔试";
  }
  if (compact.includes("群面")) {
    return "群面";
  }
  if (lower.includes("hr")) {
    return "HR面";
  }
  if (compact.includes("leader")) {
    return "leader面";
  }
  if (compact.includes("总监")) {
    return "总监面";
  }
  if (compact.includes("终")) {
    return "终面";
  }

  return compact.replace(/视频专业面/gi, "").trim() || compact;
}

function extractNormalizedRounds(text: string) {
  const matches = [
    ...text.matchAll(/((?:[一二三四五六七八九十]|\d+)\s*面|[Hh][Rr]\s*面|leader面|总监面|终面|群面|笔试|测评)/g)
  ];

  return uniqueStrings(matches.map((match) => normalizeRoundLabel(match[1])));
}

function sanitizeProcess(rawSteps: string[]) {
  const rounds = uniqueStrings(rawSteps.flatMap((step) => extractNormalizedRounds(step)));
  return rounds.slice(0, 8);
}

function normalizeQuestionRoundLabel(raw: string) {
  const rounds = extractNormalizedRounds(raw);
  return rounds[0] ?? "未注明轮次";
}

function classifyTopic(question: string) {
  if (/增长|留存|拉新|转化|漏斗|roi|激活|投放/i.test(question)) {
    return "增长分析";
  }
  if (/数据|sql|指标|分析|归因|a\/b|ab/i.test(question)) {
    return "数据分析";
  }
  if (/项目|实习|经历|做过/i.test(question)) {
    return "项目复盘";
  }
  if (/协作|研发|运营|推动|推进|资源/i.test(question)) {
    return "协作推进";
  }
  if (/产品|优化|需求|功能|app|竞品|策略/i.test(question)) {
    return "产品判断";
  }
  if (/自我介绍|为什么|规划|优势|劣势|职业/i.test(question)) {
    return "背景匹配";
  }

  return "通用能力";
}

function normalizeQuestionText(input: string) {
  return input
    .replace(/^[\-\*\s]+/, "")
    .replace(/^[（(]?\d+[）)\.\:：、]\s*/, "")
    .replace(/^[一二三四五六七八九十]+[、\.\:：]\s*/, "")
    .replace(/^问题[：:\s]*/, "")
    .replace(/^问[：:\s]*/, "")
    .replace(/[；;。]+$/, "")
    .trim();
}

function parseMonthDayOccurrences(text: string) {
  const matches = [...text.matchAll(/(?<!\d)(\d{1,2})[./月](\d{1,2})(?:日)?/g)];

  return matches.map((match) => ({
    month: Number(match[1]),
    day: Number(match[2])
  }));
}

function estimateCycleDays(text: string, publishedAt: string) {
  const occurrences = parseMonthDayOccurrences(text);

  if (occurrences.length < 2 || publishedAt === "未知") {
    return null;
  }

  const publishYear = Number(publishedAt.slice(0, 4));
  const dates = occurrences.map((item) => new Date(Date.UTC(publishYear, item.month - 1, item.day)));
  const first = dates[0];
  const last = dates[dates.length - 1];
  const diff = Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0 || diff > 180) {
    return null;
  }

  return diff;
}

function extractProcess(lines: string[]) {
  const rounds: string[] = [];

  for (const line of lines) {
    const matches = [...line.matchAll(/((?:[一二三四五六七八九十]|\d+)\s*面|[Hh][Rr]\s*面|leader面|总监面|终面|群面|笔试|测评)/g)];

    for (const match of matches) {
      const round = normalizeRoundLabel(match[1]);
      if (!rounds.includes(round)) {
        rounds.push(round);
      }
    }
  }

  return rounds.slice(0, 8);
}

function buildCandidateLines(text: string) {
  return text
    .replace(/((?:[一二三四五六七八九十]|\d+)\s*面)/g, "\n$1")
    .replace(/([；;。])/g, "$1\n")
    .replace(/([：:])(?=[（(]?\d+[）)\.\:：、])/g, "$1\n")
    .replace(/([（(]?\d+[）)\.\:：、])/g, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function extractQuestions(lines: string[]) {
  const questions: QuestionEvidence[] = [];
  let currentRound = "未注明轮次";

  for (const line of lines) {
    const roundMatch = line.match(/((?:[一二三四五六七八九十]|\d+)\s*面|[Hh][Rr]\s*面|leader面|总监面|终面|群面)/);
    if (roundMatch) {
      currentRound = normalizeRoundLabel(roundMatch[1]);
    }

    if (/体验|总结|复盘|建议|背景|时间轴/.test(line)) {
      continue;
    }

    const cleaned = normalizeQuestionText(line);
    const likelyQuestion =
      /^(?:自我介绍|为什么|如何|怎么|讲一个|介绍|如果|你会|你最|某个|作为产品经理)/.test(cleaned) ||
      /^[\d一二三四五六七八九十]/.test(line) ||
      /[？?]/.test(line);

    if (!likelyQuestion) {
      continue;
    }

    if (cleaned.length < 2 || cleaned.length > 90) {
      continue;
    }

    if (/^(时间轴|全程|体验|今天|后来|然后|整个)/.test(cleaned)) {
      continue;
    }

    questions.push({
      question: cleaned,
      normalizedQuestion: cleaned
        .replace(/[？?]/g, "")
        .replace(/\s+/g, "")
        .slice(0, 50),
      topicTag: classifyTopic(cleaned),
      roundLabel: currentRound,
      evidenceSnippet: cleaned
    });
  }

  return questions.slice(0, 12);
}

function buildNotes(lines: string[], title: string) {
  const notes = uniqueStrings(
    [
      title.includes("offer") || title.toLowerCase().includes("oc") ? "来源标题显示候选人拿到了结果反馈。" : "",
      ...lines.filter((line) => /体验|面试官|节奏|效率|和善|施压|深挖/.test(line)).slice(0, 4)
    ].filter(Boolean)
  );

  return notes.slice(0, 5);
}

function extractHeuristically(document: SourceDocument, input: SearchInput) {
  const text = normalizeWhitespace(document.plainText);
  const lines = buildCandidateLines(text);
  const process = extractProcess(lines);
  const questions = extractQuestions(lines);

  return {
    sourceId: document.candidate.id,
    title: document.title,
    sourceName: document.candidate.sourceName,
    sourceUrl: document.candidate.sourceUrl,
    publishedAt: document.publishedAt,
    authorLabel: document.authorLabel || document.candidate.authorLabel,
    company: input.company,
    role: input.role,
    direction: input.direction,
    process:
      sanitizeProcess(process).length > 0
        ? sanitizeProcess(process)
        : uniqueStrings(questions.map((item) => item.roundLabel)).slice(0, 4),
    totalCycleDays: estimateCycleDays(text, document.publishedAt),
    questions,
    notes: buildNotes(lines, document.title),
    summarySnippet: summarizeText(document.candidate.summarySnippet || text.replace(/\n/g, " "), 150),
    extractionMethod: document.usedPreviewFallback ? "preview" : "heuristic"
  } satisfies InterviewSignal;
}

async function extractWithOpenAI(document: SourceDocument, input: SearchInput) {
  const openai = getClient();

  if (!openai) {
    return null;
  }

  const sourceText = document.plainText.slice(0, 8000);

  if (sourceText.length < 300) {
    return null;
  }

  const response = await openai.responses.parse({
    model: process.env.OPENAI_MODEL || "gpt-5.2",
    instructions:
      "你是一个面经结构化抽取器。只能基于给定文本提取信息，不要补充常识。输出面试轮次、整体周期、高频问题、观察备注和一段摘要。问题要保持接近原文措辞，每条问题必须带证据片段。",
    input: `目标公司：${input.company}\n目标岗位：${input.role}\n目标方向：${input.direction || "未指定"}\n\n原文：\n${sourceText}`,
    text: {
      format: zodTextFormat(ParsedInterviewSchema, "interview_signal")
    }
  });

  if (!response.output_parsed) {
    return null;
  }

  return {
    sourceId: document.candidate.id,
    title: document.title,
    sourceName: document.candidate.sourceName,
    sourceUrl: document.candidate.sourceUrl,
    publishedAt: document.publishedAt,
    authorLabel: document.authorLabel || document.candidate.authorLabel,
    company: input.company,
    role: input.role,
    direction: input.direction,
    process: sanitizeProcess(response.output_parsed.process),
    totalCycleDays: response.output_parsed.totalCycleDays,
    questions: response.output_parsed.questions.map((question) => ({
      ...question,
      roundLabel: normalizeQuestionRoundLabel(question.roundLabel)
    })),
    notes: response.output_parsed.notes,
    summarySnippet: response.output_parsed.summarySnippet,
    extractionMethod: "openai"
  } satisfies InterviewSignal;
}

export async function extractInterviewSignals(params: {
  input: SearchInput;
  candidates: SourceCandidate[];
}): Promise<ExtractionBundle> {
  const candidates = params.candidates.slice(0, 4);
  const warnings: string[] = [];
  const documents = await Promise.all(candidates.map((candidate) => fetchSourceDocument(candidate)));
  const signals: InterviewSignal[] = [];
  let usedOpenAI = 0;

  for (const document of documents) {
    let signal: InterviewSignal | null = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        signal = await extractWithOpenAI(document, params.input);
        if (signal) {
          usedOpenAI += 1;
        }
      } catch {
        warnings.push(`来源《${document.title}》的 AI 抽取失败，已自动切回规则抽取。`);
      }
    }

    if (!signal) {
      signal = extractHeuristically(document, params.input);
    }

    if (signal.questions.length > 0 || signal.process.length > 0) {
      signals.push(signal);
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    warnings.push("当前未配置 OPENAI_API_KEY，因此正文抽取使用规则解析；配置后会自动升级为结构化 AI 抽取。");
  }

  return {
    signals,
    extractedCount: documents.length,
    extractionMode: process.env.OPENAI_API_KEY
      ? usedOpenAI === documents.length
        ? "AI 结构化抽取"
        : "AI + 规则回退"
      : "规则抽取",
    warnings
  };
}
