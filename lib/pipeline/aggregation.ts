import type { InterviewSignal, SearchInput, SearchResult } from "@/lib/schemas";

function median(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
}

function min(values: number[]) {
  return values.length > 0 ? Math.min(...values) : null;
}

function max(values: number[]) {
  return values.length > 0 ? Math.max(...values) : null;
}

function confidenceLabel(sampleSize: number): SearchResult["confidenceLabel"] {
  if (sampleSize >= 5) {
    return "高";
  }
  if (sampleSize >= 3) {
    return "中高";
  }
  if (sampleSize >= 2) {
    return "中";
  }
  return "低";
}

function roundSortValue(roundLabel: string) {
  const normalized = roundLabel.toLowerCase();
  const digitMatch = normalized.match(/(\d+)\s*面/);

  if (normalized.includes("笔试") || normalized.includes("测评")) {
    return 0;
  }
  if (normalized.includes("群面")) {
    return 1;
  }
  if (digitMatch) {
    return Number(digitMatch[1]);
  }

  if (normalized.includes("hr")) {
    return 90;
  }
  if (normalized.includes("leader")) {
    return 80;
  }
  if (normalized.includes("总监")) {
    return 85;
  }
  if (normalized.includes("终")) {
    return 88;
  }
  if (normalized.includes("一")) {
    return 1;
  }
  if (normalized.includes("二")) {
    return 2;
  }
  if (normalized.includes("三")) {
    return 3;
  }
  if (normalized.includes("四")) {
    return 4;
  }
  if (normalized.includes("五")) {
    return 5;
  }

  return 50;
}

function buildPrepSuggestions(hotTopics: string[], topQuestions: SearchResult["topQuestions"]) {
  const suggestions = [
    "先准备 90 秒自我介绍、1 个项目深挖案例、1 个“为什么想做这个方向”的回答，这三块最适合面前突击。",
    "优先把左侧重复出现的问题改写成自己的答题卡，每题至少配一个具体经历或分析框架。"
  ];

  if (hotTopics.includes("增长分析") || hotTopics.includes("数据分析")) {
    suggestions.push("把增长漏斗、指标拆解、异常定位和实验判断这类分析题单独练一遍，回答时尽量从现象走到原因。");
  }

  if (hotTopics.includes("协作推进")) {
    suggestions.push("准备一个你和研发、运营或设计协作推进项目的故事，重点讲冲突、取舍和推动方式。");
  }

  if (topQuestions.length === 0) {
    suggestions.push("如果当前没有稳定重复题，先把右侧来源原帖快速扫一遍，只提炼共通轮次和题型，不要纠结具体时间。");
  }

  if (topQuestions.some((item) => item.question.includes("为什么"))) {
    suggestions.push("补一轮背景匹配题，尤其是“为什么想做这个方向”和“为什么想来这家公司”的版本。");
  }

  return suggestions.slice(0, 4);
}

export function aggregateSignals(params: {
  input: SearchInput;
  expandedQueries: string[];
  signals: InterviewSignal[];
  mode: SearchResult["mode"];
  stageSummary: string;
  sourceScope: string;
  warnings: string[];
  retrievalSource: string;
  extractionMode: string;
  retrievedCount: number;
  extractedCount: number;
}): SearchResult {
  const {
    input,
    expandedQueries,
    signals,
    mode,
    stageSummary,
    sourceScope,
    warnings,
    retrievalSource,
    extractionMode,
    retrievedCount,
    extractedCount
  } = params;
  const cycleDays = signals.flatMap((item) => (item.totalCycleDays === null ? [] : [item.totalCycleDays]));

  const processCounter = new Map<string, number>();
  const topicCounter = new Map<string, number>();
  const questionCounter = new Map<
    string,
    {
      question: string;
      topicTag: string;
      count: number;
      roundLabels: Set<string>;
      evidenceSnippet: string;
    }
  >();

  for (const signal of signals) {
    for (const step of signal.process) {
      processCounter.set(step, (processCounter.get(step) ?? 0) + 1);
    }

    for (const question of signal.questions) {
      topicCounter.set(question.topicTag, (topicCounter.get(question.topicTag) ?? 0) + 1);

      const existing = questionCounter.get(question.normalizedQuestion);
      if (existing) {
        existing.count += 1;
        existing.roundLabels.add(question.roundLabel);
      } else {
        questionCounter.set(question.normalizedQuestion, {
          question: question.question,
          topicTag: question.topicTag,
          count: 1,
          roundLabels: new Set([question.roundLabel]),
          evidenceSnippet: question.evidenceSnippet
        });
      }
    }
  }

  const hotTopics = [...topicCounter.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([topic]) => topic);

  const repeatedQuestionThreshold = 2;
  const topQuestions = [...questionCounter.values()]
    .filter((item) => item.count >= repeatedQuestionThreshold)
    .sort((left, right) => right.count - left.count)
    .slice(0, 8)
    .map((item) => ({
      question: item.question,
      count: item.count,
      topicTag: item.topicTag,
      roundLabels: [...item.roundLabels].sort((left, right) => roundSortValue(left) - roundSortValue(right)),
      evidenceSnippet: item.evidenceSnippet
    }));

  const processSupportThreshold = signals.length >= 2 ? 2 : 1;
  const typicalProcess = [...processCounter.entries()]
    .filter(([, count]) => count >= processSupportThreshold)
    .sort((left, right) => roundSortValue(left[0]) - roundSortValue(right[0]) || right[1] - left[1])
    .slice(0, 6)
    .map(([step]) => step);

  const medianCycleDays = cycleDays.length >= 2 ? median(cycleDays) : null;
  const cycleMin = min(cycleDays);
  const cycleMax = max(cycleDays);
  const timelineHighlights = [
    typicalProcess.length > 0 ? `快速准备时，优先按 ${typicalProcess.join(" -> ")} 去准备自我介绍、项目深挖和收尾追问。` : "当前样本里的轮次信息还不够稳定，建议先把来源原帖当作摸底材料。",
    hotTopics.length > 0 ? `题目更集中在 ${hotTopics.join("、")}，这一页更适合帮你快速锁定准备重点。` : "当前主题分布还不够稳定，建议直接回看来源原帖。",
    cycleDays.length >= 2 && cycleMin !== null && cycleMax !== null
      ? `时间信息跨样本差异比较大，目前只把周期当弱参考，已知范围约 ${cycleMin}-${cycleMax} 天。`
      : "这版产品优先聚焦结构化总结，时间信息只做弱参考。"
  ].filter(Boolean);

  return {
    mode,
    stageSummary,
    sourceScope,
    warnings,
    query: input,
    expandedQueries,
    sampleSize: signals.length,
    confidenceLabel: confidenceLabel(signals.length),
    lastUpdated: signals.map((item) => item.publishedAt).sort().reverse()[0] ?? "暂无",
    pipeline: {
      retrievalSource,
      extractionMode,
      retrievedCount,
      extractedCount
    },
    overview: {
      typicalProcess,
      medianCycleDays,
      hotTopics,
      cycleSampleCount: cycleDays.length,
      cycleRange: {
        min: cycleMin,
        max: cycleMax
      },
      repeatedQuestionCount: topQuestions.length
    },
    timelineHighlights,
    topQuestions,
    prepSuggestions: buildPrepSuggestions(hotTopics, topQuestions),
    sources: signals
      .map((signal) => ({
        id: signal.sourceId,
        title: signal.title,
        sourceName: signal.sourceName,
        sourceUrl: signal.sourceUrl,
        publishedAt: signal.publishedAt,
        relevanceLabel: signal.extractionMethod === "openai" ? "高相关 / AI 抽取" : "高相关 / 规则抽取",
        summarySnippet: signal.summarySnippet,
        extractionMethod: signal.extractionMethod,
        authorLabel: signal.authorLabel
      }))
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
  };
}
