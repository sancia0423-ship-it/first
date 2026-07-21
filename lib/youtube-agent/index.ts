import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";
import he from "he";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  YouTubeCaptionTrackSchema,
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

type RawCaptionSegment = {
  startMs: number;
  endMs: number;
  durationMs: number;
  sourceText: string;
};

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 0,
    timeout: 15_000
  });
}

export function parseYouTubeVideoId(input: string) {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const [section, id] = url.pathname.split("/").filter(Boolean);
      if (section === "embed" || section === "shorts" || section === "live") {
        return id ?? null;
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
  const scriptPath = path.join(process.cwd(), "scripts", "youtube_fetch_transcript.py");
  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn("python3", [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdoutText = "";
    let stderrText = "";

    child.stdout.on("data", (chunk) => {
      stdoutText += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderrText += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdoutText);
        return;
      }

      try {
        const payload = JSON.parse(stderrText) as { error?: string };
        reject(new Error(payload.error || "读取字幕失败"));
      } catch {
        reject(new Error(stderrText || `Transcript fetcher exited with code ${code}`));
      }
    });

    child.stdin.write(
      JSON.stringify({
        videoId,
        sourceLanguage
      })
    );
    child.stdin.end();
  });

  const parsed = TranscriptFetchResultSchema.safeParse(JSON.parse(stdout));
  if (!parsed.success) {
    throw new Error("字幕服务返回结构异常，请稍后再试。");
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

  for (const chunk of chunks) {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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
  }

  return segments.map((segment) => translated.get(`${segment.startMs}:${segment.endMs}`) || segment.sourceText);
}

async function translateSegmentsWithPython(segments: RawCaptionSegment[]) {
  const scriptPath = path.join(process.cwd(), "scripts", "youtube_translate_fallback.py");
  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn("python3", [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdoutText = "";
    let stderrText = "";

    child.stdout.on("data", (chunk) => {
      stdoutText += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderrText += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdoutText);
        return;
      }

      reject(new Error(stderrText || `Fallback translator exited with code ${code}`));
    });

    child.stdin.write(
      JSON.stringify({
        texts: segments.map((segment) => segment.sourceText)
      })
    );
    child.stdin.end();
  });

  const payload = JSON.parse(stdout) as { translations?: Array<string | null> };
  const translations = payload.translations ?? [];

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
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    instructions:
      "你是一个视频速览助手。基于用户给你的中文字幕，输出一段 2 句内的中文摘要，以及 2 到 4 条适合快速扫读的重点结论。",
    input: text.slice(0, 7000),
    text: {
      format: zodTextFormat(VideoSummarySchema, "youtube_video_summary")
    }
  });

  return response.output_parsed ?? null;
}

function formatSrtTimestamp(ms: number) {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const milliseconds = ms % 1000;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":") + `,${String(milliseconds).padStart(3, "0")}`;
}

export function buildSrt(segments: Array<Pick<YouTubeTranslatedSegment, "startMs" | "endMs" | "translatedText">>) {
  return segments
    .map((segment, index) => {
      return `${index + 1}\n${formatSrtTimestamp(segment.startMs)} --> ${formatSrtTimestamp(segment.endMs)}\n${segment.translatedText}`;
    })
    .join("\n\n");
}

export async function runYouTubeTranslation(params: YouTubeTranslationRequest): Promise<YouTubeTranslationResult> {
  const videoId = parseYouTubeVideoId(params.url);
  if (!videoId) {
    throw new Error("请输入有效的 YouTube 链接。当前支持 watch、shorts、embed 和 youtu.be。");
  }

  const transcriptPayload = await fetchTranscriptWithPython(videoId, params.sourceLanguage);
  const rawSegments = coalesceSegments(
    transcriptPayload.segments
      .map((segment) => {
        const sourceText = normalizeCaptionText(segment.sourceText);
        if (!sourceText) {
          return null;
        }

        const startMs = segment.startMs;
        const durationMs = segment.durationMs;

        return {
          startMs,
          endMs: startMs + durationMs,
          durationMs,
          sourceText
        };
      })
      .filter((segment): segment is RawCaptionSegment => Boolean(segment))
  );

  if (rawSegments.length === 0) {
    throw new Error("字幕轨道存在，但没有成功读取到正文。请换一个视频再试。");
  }

  const warnings = [...transcriptPayload.warnings];
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
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
