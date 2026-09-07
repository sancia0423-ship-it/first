import "server-only";

import { readCache, writeCache } from "@/lib/pipeline/cache";
import { getHtml, postJsonText } from "@/lib/pipeline/http";
import { compareCandidatePriority, isCandidateCompatible } from "@/lib/pipeline/relevance";
import { collectSettled, dedupeCandidates, scoreCandidate } from "@/lib/pipeline/scoring";
import type { SourceDocument } from "@/lib/pipeline/nowcoder";
import { htmlToPlainText, summarizeText, uniqueStrings } from "@/lib/pipeline/text";
import type { QueryExpansion, SearchInput, SourceCandidate } from "@/lib/schemas";

type JuejinSearchItem = Record<string, unknown>;

const SEARCH_CACHE_MS = 1000 * 60 * 60 * 12;
const DETAIL_CACHE_MS = 1000 * 60 * 60 * 24;

function formatDateFromSeconds(timestamp: unknown) {
  if (typeof timestamp !== "string" && typeof timestamp !== "number") {
    return "未知";
  }

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "未知";
  }

  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function computeCandidateScore(params: {
  title: string;
  previewText: string;
  publishedAt: string;
  expansion: QueryExpansion;
}) {
  return scoreCandidate(params, ({ title, previewText }) => {
    let bonus = 0;

    if (title.includes("面经") || title.includes("面试")) {
      bonus += 3;
    }

    if (previewText.includes("一面") || previewText.includes("二面") || previewText.includes("hr")) {
      bonus += 2;
    }

    if (title.includes("复盘") || previewText.includes("复盘")) {
      bonus += 1;
    }

    return bonus;
  });
}

function toCandidate(item: JuejinSearchItem, input: SearchInput, expansion: QueryExpansion): SourceCandidate | null {
  const resultType = typeof item.result_type === "number" ? item.result_type : -1;
  const resultModel = item.result_model as Record<string, unknown> | undefined;
  const articleInfo = resultModel?.article_info as Record<string, unknown> | undefined;
  const authorInfo = resultModel?.author_user_info as Record<string, unknown> | undefined;

  if (resultType !== 2 || !articleInfo) {
    return null;
  }

  const articleId = typeof articleInfo.article_id === "string" ? articleInfo.article_id : "";
  const title = typeof articleInfo.title === "string" ? articleInfo.title : "";
  const previewText = typeof articleInfo.brief_content === "string" ? articleInfo.brief_content : "";
  const publishedAt = formatDateFromSeconds(articleInfo.ctime);

  if (!articleId || !title) {
    return null;
  }

  const likelyInterview =
    /面经|面试|offer|复盘/i.test(title) ||
    /面经|面试|offer|复盘|一面|二面|hr/i.test(previewText);

  if (!likelyInterview) {
    return null;
  }

  const compatibility = isCandidateCompatible({
    title,
    previewText,
    input,
    expansion
  });

  if (!compatibility.compatible) {
    return null;
  }

  const score = computeCandidateScore({
    title,
    previewText,
    publishedAt,
    expansion
  });

  return {
    id: articleId,
    title,
    sourceName: "掘金",
    sourceUrl: `https://juejin.cn/post/${articleId}`,
    publishedAt,
    authorLabel: typeof authorInfo?.user_name === "string" ? authorInfo.user_name : "",
    summarySnippet: summarizeText(previewText),
    previewText,
    relevanceScore: score,
    retrievalReason: score >= 8 ? "标题与摘要高度匹配查询" : compatibility.reason,
    tags: uniqueStrings(["掘金文章", "公开面经"])
  };
}

function decodeJsStringLiteral(raw: string) {
  try {
    return JSON.parse(`"${raw}"`) as string;
  } catch {
    return raw;
  }
}

function buildPreviewDocument(candidate: SourceCandidate): SourceDocument {
  return {
    candidate,
    title: candidate.title,
    publishedAt: candidate.publishedAt,
    authorLabel: candidate.authorLabel,
    plainText: candidate.previewText,
    usedPreviewFallback: true
  };
}

export async function searchJuejinCandidates(input: SearchInput, expansion: QueryExpansion) {
  const queries = expansion.queries.slice(0, 4);
  const cacheKey = `juejin:search:v2:${queries.join("||")}`;
  const cached = await readCache<SourceCandidate[]>(cacheKey, SEARCH_CACHE_MS);

  if (cached) {
    return cached;
  }

  const resultGroups = await collectSettled(
    queries.map(async (query) => {
      const responseText = await postJsonText(
        "https://api.juejin.cn/search_api/v1/search",
        {
          cursor: "0",
          id_type: 0,
          key_word: query,
          limit: 10,
          search_type: 0
        },
        20
      );

      const payload = JSON.parse(responseText) as {
        data?: JuejinSearchItem[];
      };

      return (payload.data ?? [])
        .map((item) => toCandidate(item, input, expansion))
        .filter((candidate): candidate is SourceCandidate => Boolean(candidate));
    }),
    "juejin"
  );

  const rankedCandidates = [...resultGroups].sort(compareCandidatePriority);

  const strictCandidates = rankedCandidates.filter((candidate) => candidate.relevanceScore >= 8);
  const candidates = dedupeCandidates((strictCandidates.length > 0 ? strictCandidates : rankedCandidates).slice(0, 4));

  await writeCache(cacheKey, candidates);
  return candidates;
}

export async function fetchJuejinDocument(candidate: SourceCandidate): Promise<SourceDocument> {
  const cacheKey = `juejin:detail:${candidate.sourceUrl}`;
  const cached = await readCache<SourceDocument>(cacheKey, DETAIL_CACHE_MS);

  if (cached) {
    return cached;
  }

  try {
    const html = await getHtml(candidate.sourceUrl, 20);
    const webHtmlMatch = html.match(/web_html_content:"((?:\\.|[^"])*)"/);
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const descriptionMatch = html.match(/name="description" content="([^"]*)"/i);

    const rawHtml = webHtmlMatch ? decodeJsStringLiteral(webHtmlMatch[1]) : "";
    const plainText = rawHtml ? htmlToPlainText(rawHtml) : descriptionMatch?.[1] ?? candidate.previewText;

    const document: SourceDocument = {
      candidate,
      title: titleMatch?.[1]?.replace(/\s*-\s*掘金\s*$/i, "").trim() || candidate.title,
      publishedAt: candidate.publishedAt,
      authorLabel: candidate.authorLabel,
      plainText,
      usedPreviewFallback: plainText === candidate.previewText
    };

    await writeCache(cacheKey, document);
    return document;
  } catch {
    const previewDocument = buildPreviewDocument(candidate);
    await writeCache(cacheKey, previewDocument);
    return previewDocument;
  }
}
