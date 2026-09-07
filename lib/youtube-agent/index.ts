import "server-only";

import he from "he";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { PublicError } from "@/lib/api/guards";
import {
  MAX_CAPTION_SEGMENTS,
  OPENAI_MAX_RETRIES,
  OPENAI_REQUEST_TIMEOUT_MS,
  getOpenAIModel,
  hasOpenAIKey
} from "@/lib/config";
import { mapWithConcurrency } from "@/lib/concurrency";
import { runPythonScript } from "@/lib/youtube-agent/python";
import { buildSrt } from "@/lib/srt";
import {
  YouTubeCaptionTrackSchema,
  type YouTubeTranscriptResult,
  type YouTubeTranslatedSegment,
  type YouTubeTranslationRequest,
  type YouTubeTranslationResult
} from "@/lib/youtube-agent/contracts";

const TranslationBatchSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      translatedText: z.string().min(1)
    })
  )
});

const VideoSummarySchema = z.object({
  summary: z.string(),
  takeaways: z.array(z.string()).min(2).max(4)
});

const TranscriptFetchResultSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
  availableTracks: z.array(YouTubeCaptionTrackSchema).default([]),
  selectedTrack: z.object({
    languageCode: z.string(),
    label: z.string(),
    kind: z.enum(["manual", "auto"]),
    isTranslatable: z.boolean()
  }),
  warnings: z.array(z.string()).default([]),
  segments: z
    .array(
      z.object({
        startMs: z.number().int().nonnegative(),
        durationMs: z.number().int().nonnegative(),
        sourceText: z.string()
      })
    )
    .min(1)
});

/** Chunks are independent, so a few can be in flight without risking rate limits. */
const TRANSLATION_CONCURRENCY = 4;

type RawCaptionSegment = {
  startMs: number;
  endMs: number;
  durationMs: number;
  sourceText: string;
};

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

/** YouTube video ids are exactly 11 url-safe base64 characters. */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function asVideoId(value: string | null | undefined) {
  const candidate = (value ?? "").trim();
  return VIDEO_ID_PATTERN.test(candidate) ? candidate : null;
}

export function parseYouTubeVideoId(input: string) {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return asVideoId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") {
        return asVideoId(url.searchParams.get("v"));
      }

      const [section, id] = url.pathname.split("/").filter(Boolean);
      if (section === "embed" || section === "shorts" || section === "live" || section === "v") {
        return asVideoId(id);
      }
    }
  } catch {
    return null;
  }

  return null;
}

function stripMarkup(text: string) {
  return text.replace(/<[^>]+>/g, " ");
}

function normalizeCaptionText(text: string) {
  return he
    .decode(stripMarkup(text))
    .replace(/\s+/g, " ")
    .trim();
}

function joinCaptionText(left: string, right: string) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  if (/[\s([{'"-]$/.test(left) || /^[\s)\]}'",.!?:;]/.test(right)) {
    return `${left}${right}`;
  }

  return `${left} ${right}`;
}

function coalesceSegments(segments: RawCaptionSegment[]) {
  const merged: RawCaptionSegment[] = [];

  for (const segment of segments) {
    const previous = merged[merged.length - 1];

    if (
      previous &&
      segment.startMs - previous.endMs <= 350 &&
      previous.sourceText.length + segment.sourceText.length <= 120
    ) {
      previous.sourceText = joinCaptionText(previous.sourceText, segment.sourceText);
      previous.endMs = segment.endMs;
      previous.durationMs = previous.endMs - previous.startMs;
      continue;
    }

    merged.push({ ...segment });
  }

  return merged;
}

async function fetchTranscriptWithPython(videoId: string, sourceLanguage: string) {
  const raw = await runPythonScript<unknown>("youtube_fetch_transcript.py", {
    videoId,
    sourceLanguage
  });

  const parsed = TranscriptFetchResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new PublicError("字幕服务返回结构异常，请稍后再试。");
  }

  return parsed.data;
}

function chunkSegments(segments: RawCaptionSegment[], maxItems: number, maxChars: number) {
  const chunks: RawCaptionSegment[][] = [];
  let current: RawCaptionSegment[] = [];
  let currentChars = 0;

  for (const segment of segments) {
    const nextChars = currentChars + segment.sourceText.length;

    if (current.length > 0 && (current.length >= maxItems || nextChars > maxChars)) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(segment);
    currentChars += segment.sourceText.length;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

async function translateSegmentsWithOpenAI(segments: RawCaptionSegment[]) {
  const client = getClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const translated = new Map<string, string>();
  const chunks = chunkSegments(segments, 18, 2200);

  await mapWithConcurrency(chunks, TRANSLATION_CONCURRENCY, async (chunk) => {
    const response = await client.responses.parse({
      model: getOpenAIModel(),
      instructions:
        "你是一个视频字幕翻译器。把每条字幕自然地翻译成简体中文，保留原始顺序和 id，不要总结，不要合并条目，不要补充解释。",
      input: JSON.stringify(
        chunk.map((segment, index) => ({
          id: String(index),
          text: segment.sourceText
        })),
        null,
        2
      ),
      text: {
        format: zodTextFormat(TranslationBatchSchema, "youtube_translation_batch")
      }
    });

    const parsed = response.output_parsed;
    if (!parsed) {
      throw new Error("OpenAI translation returned no structured output");
    }

    if (parsed.items.length !== chunk.length) {
      throw new Error("OpenAI translation returned an unexpected segment count");
    }

    for (const item of parsed.items) {
      const index = Number(item.id);
      if (!Number.isInteger(index) || index < 0 || index >= chunk.length) {
        throw new Error("OpenAI translation returned an unexpected segment id");
      }

      translated.set(`${chunk[index].startMs}:${chunk[index].endMs}`, item.translatedText.trim());
    }
  });

  return segments.map((segment) => translated.get(`${segment.startMs}:${segment.endMs}`) || segment.sourceText);
}

async function translateSegmentsWithPython(segments: RawCaptionSegment[]) {
  const payload = await runPythonScript<{
    translations?: Array<string | null>;
    translatedCount?: number;
    totalCount?: number;
  }>("youtube_translate_fallback.py", {
    texts: segments.map((segment) => segment.sourceText)
  });

  const translations = payload.translations ?? [];

  // The helper returns the source text for anything it could not translate. If
  // it could not translate a single segment, the upstream service is down and
  // handing back the original subtitles would look like a successful result.
  if (!payload.translatedCount) {
    throw new PublicError("字幕翻译服务暂时不可用，请稍后再试。");
  }

  return segments.map((segment, index) => {
    const translated = translations[index];
    return typeof translated === "string" && translated.trim() ? translated.trim() : segment.sourceText;
  });
}

async function buildSummaryIfPossible(text: string) {
  const client = getClient();
  if (!client || !text.trim()) {
    return null;
  }

  const response = await client.responses.parse({
    model: getOpenAIModel(),
    instructions:
      "你是一个视频速览助手。基于用户给你的中文字幕，输出一段 2 句内的中文摘要，以及 2 到 4 条适合快速扫读的重点结论。",
    input: text.slice(0, 7000),
    text: {
      format: zodTextFormat(VideoSummarySchema, "youtube_video_summary")
    }
  });

  return response.output_parsed ?? null;
}

/**
 * 取字幕并清洗，不做翻译。
 *
 * 翻译流程和「浏览器自带 key」流程共用这一步：抓字幕需要服务端的 yt-dlp，
 * 但不需要任何 AI key，所以它可以独立对外提供。
 */
async function loadTranscript(params: YouTubeTranslationRequest) {
  const videoId = parseYouTubeVideoId(params.url);
  if (!videoId) {
    throw new PublicError("请输入有效的 YouTube 链接。当前支持 watch、shorts、embed 和 youtu.be。");
  }

  const transcriptPayload = await fetchTranscriptWithPython(videoId, params.sourceLanguage);
  const allSegments = coalesceSegments(
    transcriptPayload.segments
      .map((segment) => {
        const sourceText = normalizeCaptionText(segment.sourceText);
        if (!sourceText) {
          return null;
        }

        return {
          startMs: segment.startMs,
          endMs: segment.startMs + segment.durationMs,
          durationMs: segment.durationMs,
          sourceText
        };
      })
      .filter((segment): segment is RawCaptionSegment => Boolean(segment))
  );

  if (allSegments.length === 0) {
    throw new PublicError("字幕轨道存在，但没有成功读取到正文。请换一个视频再试。");
  }

  return { videoId, transcriptPayload, allSegments };
}

/** 只返回原文字幕，交给调用方自己翻译。 */
export async function fetchYouTubeTranscript(
  params: YouTubeTranslationRequest
): Promise<YouTubeTranscriptResult> {
  const { videoId, transcriptPayload, allSegments } = await loadTranscript(params);
  const warnings = [...transcriptPayload.warnings];
  const segments = allSegments.slice(0, MAX_CAPTION_SEGMENTS);

  if (allSegments.length > segments.length) {
    warnings.push(
      `这个视频字幕较长，本次只返回了前 ${segments.length} 条（共 ${allSegments.length} 条）。`
    );
  }

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: transcriptPayload.title || "Untitled video",
    description: transcriptPayload.description || "",
    sourceLanguage: transcriptPayload.selectedTrack.languageCode,
    sourceTrackLabel: transcriptPayload.selectedTrack.label,
    warnings,
    availableTracks: transcriptPayload.availableTracks,
    segments: segments.map((segment, index) => ({
      id: `seg-${index + 1}`,
      startMs: segment.startMs,
      endMs: segment.endMs,
      durationMs: segment.durationMs,
      sourceText: segment.sourceText
    }))
  };
}

export async function runYouTubeTranslation(params: YouTubeTranslationRequest): Promise<YouTubeTranslationResult> {
  const { videoId, transcriptPayload, allSegments } = await loadTranscript(params);

  const warnings = [...transcriptPayload.warnings];

  // A three-hour video would otherwise mean hundreds of upstream calls and a
  // response payload measured in megabytes.
  const rawSegments = allSegments.slice(0, MAX_CAPTION_SEGMENTS);
  if (allSegments.length > rawSegments.length) {
    warnings.push(
      `这个视频字幕较长，本次只翻译了前 ${rawSegments.length} 条（共 ${allSegments.length} 条）。`
    );
  }

  const hasOpenAI = hasOpenAIKey();
  let translatedTexts: string[];
  let translationMode: YouTubeTranslationResult["translationMode"] = "google_fallback";

  if (hasOpenAI) {
    try {
      translatedTexts = await translateSegmentsWithOpenAI(rawSegments);
      translationMode = "openai";
    } catch {
      warnings.push("增强翻译暂时不可用，已自动切换到标准翻译模式。");
      translatedTexts = await translateSegmentsWithPython(rawSegments);
    }
  } else {
    translatedTexts = await translateSegmentsWithPython(rawSegments);
  }

  const untranslated = rawSegments.filter(
    (segment, index) => translatedTexts[index].trim() === segment.sourceText.trim()
  ).length;

  if (untranslated > 0) {
    warnings.push(`有 ${untranslated} 条字幕未能翻译，已保留原文。`);
  }

  const segments: YouTubeTranslatedSegment[] = rawSegments.map((segment, index) => ({
    id: `seg-${index + 1}`,
    startMs: segment.startMs,
    endMs: segment.endMs,
    durationMs: segment.durationMs,
    sourceText: segment.sourceText,
    translatedText: translatedTexts[index] || segment.sourceText
  }));

  let summaryPayload: z.infer<typeof VideoSummarySchema> | null = null;

  if (translationMode === "openai") {
    try {
      summaryPayload = await buildSummaryIfPossible(segments.map((segment) => segment.translatedText).join(" "));
    } catch {
      summaryPayload = null;
    }
  }

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: transcriptPayload.title || "Untitled video",
    description: transcriptPayload.description || "",
    sourceLanguage: transcriptPayload.selectedTrack.languageCode,
    sourceTrackLabel: transcriptPayload.selectedTrack.label,
    translationMode,
    warnings,
    summary: summaryPayload?.summary,
    takeaways: summaryPayload?.takeaways ?? [],
    availableTracks: transcriptPayload.availableTracks,
    segments,
    srt: buildSrt(segments)
  };
}

export { buildSrt };
