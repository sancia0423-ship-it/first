import "server-only";

import { readCache, writeCache } from "@/lib/pipeline/cache";
import { getHtml } from "@/lib/pipeline/http";
import { compareCandidatePriority, isCandidateCompatible } from "@/lib/pipeline/relevance";
import { collectSettled, dedupeCandidates, scoreCandidate } from "@/lib/pipeline/scoring";
import { htmlToPlainText, summarizeText, textFromStructuredParts, uniqueStrings } from "@/lib/pipeline/text";
import type { QueryExpansion, SearchInput, SourceCandidate } from "@/lib/schemas";

type SearchRecord = Record<string, unknown>;

export type SourceDocument = {
  candidate: SourceCandidate;
  title: string;
  publishedAt: string;
  authorLabel: string;
  plainText: string;
  usedPreviewFallback: boolean;
};

const SEARCH_CACHE_MS = 1000 * 60 * 60 * 12;
const DETAIL_CACHE_MS = 1000 * 60 * 60 * 24;

function formatDateFromTimestamp(timestamp: unknown) {
  if (typeof timestamp !== "number" || Number.isNaN(timestamp) || timestamp <= 0) {
    return "未知";
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

function extractInitialState(html: string) {
  const match = html.match(/window\.__INITIAL_STATE__=(.*?);\(function\(\)\{var s;/s);

  if (!match) {
    throw new Error("unexpected nowcoder page structure");
  }

  return JSON.parse(match[1]) as Record<string, unknown>;
}

function computeCandidateScore(
  params: { title: string; previewText: string; publishedAt: string },
  expansion: QueryExpansion
) {
  return scoreCandidate({ ...params, expansion }, ({ title, previewText }) => {
    let bonus = 0;

    if (title.includes("面经")) {
      bonus += 3;
    }

    if (title.includes("offer") || title.includes("oc")) {
      bonus += 1;
    }

    if (previewText.includes("一面") || previewText.includes("二面") || previewText.includes("hr面")) {
      bonus += 2;
    }

    return bonus;
  });
}

function pickSearchAppState(initialState: Record<string, unknown>) {
  const appState = initialState.app;

  if (!appState || typeof appState !== "object") {
    return null;
  }

  return Object.values(appState).find(
    (value) =>
      value &&
      typeof value === "object" &&
      "records" in value &&
      Array.isArray((value as { records?: unknown[] }).records)
  ) as { records: SearchRecord[] } | null;
}

function toCandidate(record: SearchRecord, input: SearchInput, expansion: QueryExpansion): SourceCandidate | null {
  const data = record.data as Record<string, unknown> | undefined;
  const contentData = data?.contentData as Record<string, unknown> | undefined;

  if (!contentData) {
    return null;
  }

  const title =
    (typeof contentData.title === "string" ? contentData.title : "") ||
    textFromStructuredParts((contentData.newTitle as { data?: unknown[] } | undefined)?.data);
  const previewText =
    (typeof contentData.richText === "string" ? htmlToPlainText(contentData.richText) : "") ||
    (typeof contentData.content === "string" ? contentData.content : "") ||
    textFromStructuredParts((contentData.newContent as { data?: unknown[] } | undefined)?.data) ||
    (typeof contentData.desc === "string" ? contentData.desc : "");
  const typeName = typeof contentData.typeName === "string" ? contentData.typeName : "";
  const contentId = typeof contentData.id === "string" ? contentData.id : "";
  const publishedAt = formatDateFromTimestamp(contentData.showTime ?? contentData.createTime);

  if (!title || !contentId) {
    return null;
  }

  const likelyInterview =
    typeName.includes("面经") ||
    title.includes("面经") ||
    previewText.includes("一面") ||
    previewText.includes("二面") ||
    previewText.includes("hr面") ||
    previewText.includes("产品经理");

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

  const candidate: SourceCandidate = {
    id: contentId,
    title,
    sourceName: "牛客网",
    sourceUrl: `https://www.nowcoder.com/discuss/${contentId}`,
    publishedAt,
    authorLabel:
      typeof (data?.userBrief as Record<string, unknown> | undefined)?.authDisplayInfo === "string"
        ? ((data?.userBrief as Record<string, unknown>).authDisplayInfo as string)
        : "",
    summarySnippet: summarizeText(
      typeof contentData.desc === "string" && contentData.desc.trim()
        ? contentData.desc
        : previewText.replace(/\n/g, " ")
    ),
    previewText,
    relevanceScore: 0,
    retrievalReason: "",
    tags: uniqueStrings([typeName, "公开面经"])
  };

  const score = computeCandidateScore({ title, previewText, publishedAt }, expansion);

  return {
    ...candidate,
    relevanceScore: score,
    retrievalReason: score >= 9 ? "标题和摘要都高度匹配查询" : compatibility.reason
  };
}

export async function searchNowcoderCandidates(input: SearchInput, expansion: QueryExpansion) {
  const queries = expansion.queries.slice(0, 4);
  const cacheKey = `nowcoder:search:v5:${queries.join("||")}`;
  const cached = await readCache<SourceCandidate[]>(cacheKey, SEARCH_CACHE_MS);

  if (cached) {
    return cached;
  }

  const candidateGroups = await collectSettled(
    queries.map(async (query) => {
      const searchUrl = `https://www.nowcoder.com/search/all/?query=${encodeURIComponent(query)}`;
      const html = await getHtml(searchUrl, 20);
      const initialState = extractInitialState(html);
      const appState = pickSearchAppState(initialState);
      const records = appState?.records ?? [];

      return records
        .map((record) => toCandidate(record, input, expansion))
        .filter((candidate): candidate is SourceCandidate => Boolean(candidate));
    }),
    "nowcoder"
  );

  const rankedCandidates = [...candidateGroups].sort(compareCandidatePriority);

  const strictCandidates = rankedCandidates.filter((candidate) => candidate.relevanceScore >= 8);
  const candidates = dedupeCandidates((strictCandidates.length > 0 ? strictCandidates : rankedCandidates).slice(0, 6));

  await writeCache(cacheKey, candidates);
  return candidates;
}

function pickDetailPayload(initialState: Record<string, unknown>) {
  const prefetch = initialState.prefetchData;

  if (!prefetch || typeof prefetch !== "object") {
    return null;
  }

  return Object.values(prefetch).find(
    (value) =>
      value &&
      typeof value === "object" &&
      "ssrCommonData" in value &&
      typeof (value as { ssrCommonData?: unknown }).ssrCommonData === "object"
  ) as { ssrCommonData: { contentData?: Record<string, unknown> } } | null;
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

export async function fetchNowcoderDocument(candidate: SourceCandidate): Promise<SourceDocument> {
  const cacheKey = `nowcoder:detail:${candidate.sourceUrl}`;
  const cached = await readCache<SourceDocument>(cacheKey, DETAIL_CACHE_MS);

  if (cached) {
    return cached;
  }

  try {
    const html = await getHtml(candidate.sourceUrl, 20);
    const initialState = extractInitialState(html);
    const payload = pickDetailPayload(initialState);
    const contentData = payload?.ssrCommonData?.contentData;

    if (!contentData) {
      const previewDocument = buildPreviewDocument(candidate);
      await writeCache(cacheKey, previewDocument);
      return previewDocument;
    }

    const rawText =
      (typeof contentData.richText === "string" ? htmlToPlainText(contentData.richText) : "") ||
      (typeof contentData.content === "string" ? contentData.content : "") ||
      textFromStructuredParts((contentData.newContent as { data?: unknown[] } | undefined)?.data) ||
      candidate.previewText;
    const document: SourceDocument = {
      candidate,
      title:
        (typeof contentData.title === "string" ? contentData.title : "") ||
        candidate.title,
      publishedAt: formatDateFromTimestamp(contentData.showTime ?? contentData.createTime) || candidate.publishedAt,
      authorLabel: candidate.authorLabel,
      plainText: rawText,
      usedPreviewFallback: rawText === candidate.previewText
    };

    await writeCache(cacheKey, document);
    return document;
  } catch {
    const previewDocument = buildPreviewDocument(candidate);
    await writeCache(cacheKey, previewDocument);
    return previewDocument;
  }
}
