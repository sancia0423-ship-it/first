import { aggregateSignals } from "@/lib/pipeline/aggregation";
import { extractInterviewSignals } from "@/lib/pipeline/extraction";
import { expandQuery } from "@/lib/pipeline/query-expansion";
import { retrieveCandidateSources, retrieveMockSignals } from "@/lib/pipeline/retrieval";
import type { SearchInput } from "@/lib/schemas";

export async function runSearchPipeline(input: SearchInput, options: { allowAi?: boolean } = {}) {
  const expansion = expandQuery(input);
  const warnings: string[] = [];

  try {
    const candidates = await retrieveCandidateSources(input, expansion);
    const extraction = await extractInterviewSignals({
      input,
      candidates,
      allowAi: options.allowAi
    });

    warnings.push(...extraction.warnings);

    if (extraction.signals.length > 0) {
      return aggregateSignals({
        input,
        expandedQueries: expansion.queries,
        signals: extraction.signals,
        mode: "live",
        stageSummary: `系统从公开面经里筛出了 ${extraction.signals.length} 篇可用样本，当前会优先综合牛客和掘金这两类公开来源。`,
        sourceScope: "当前真实来源：牛客网公开面经 + 掘金公开文章，样本年份跨度可能较大。",
        warnings,
        retrievalSource: "牛客公开搜索页 + 掘金公开搜索 API",
        extractionMode: extraction.extractionMode,
        retrievedCount: candidates.length,
        extractedCount: extraction.extractedCount
      });
    }

    warnings.push("这次真实检索没有解析出足够有效的面经信息，系统已回退到本地演示样本。");
  } catch (error) {
    warnings.push(
      error instanceof Error
        ? `真实来源抓取失败：${error.message}。系统已回退到本地演示样本。`
        : "真实来源抓取失败，系统已回退到本地演示样本。"
    );
  }

  const fallbackSignals = retrieveMockSignals(input, expansion);

  return aggregateSignals({
    input,
    expandedQueries: expansion.queries,
    signals: fallbackSignals,
    mode: warnings.length > 0 ? "mixed" : "mock",
    stageSummary:
      fallbackSignals.length > 0
        ? "当前显示的是回退演示结果，用来展示快速准备页会如何组织信息。"
        : "当前没有匹配样本。",
    sourceScope:
      fallbackSignals.length > 0
        ? "当前结果包含本地演示样本，用于在真实来源不可用时保持页面可用。"
        : "当前没有可展示的来源。",
    warnings,
    retrievalSource: warnings.length > 0 ? "公开来源 + 本地回退" : "本地演示样本",
    extractionMode: warnings.length > 0 ? "回退演示模式" : "演示模式",
    retrievedCount: fallbackSignals.length,
    extractedCount: fallbackSignals.length
  });
}
