import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";
import he from "he";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type {
  YouTubeCaptionTrack,
  YouTubeTranslatedSegment,
  YouTubeTranslationRequest,
  YouTubeTranslationResult
} from "@/lib/youtube-agent/contracts";

const INNERTUBE_ENDPOINT = "https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false";

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

type CaptionTrackPayload = {
  baseUrl?: string;
  name?: {
    simpleText?: string;
  };
  languageCode?: string;
  kind?: string;
  isTranslatable?: boolean;
  vssId?: string;
};

type PlayerPayload = {
  playabilityStatus?: {
    status?: string;
    reason?: string;
  };
  videoDetails?: {
    title?: string;
    shortDescription?: string;
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrackPayload[];
    };
  };
};

type ClientProfile = {
  name: string;
  clientName: string;
  clientVersion: string;
  clientNameHeader: string;
  userAgent: string;
  context: Record<string, number | string>;
};

type RawCaptionSegment = {
  startMs: number;
  endMs: number;
  durationMs: number;
  sourceText: string;
};

const CLIENT_PROFILES: ClientProfile[] = [
  {
    name: "ios",
    clientName: "IOS",
    clientVersion: "20.10.4",
    clientNameHeader: "5",
    userAgent: "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
    context: {
      deviceMake: "Apple",
      deviceModel: "iPhone16,2",
      platform: "MOBILE",
      osName: "iOS",
      osVersion: "18.3.2.22D82"
    }
  },
  {
    name: "mweb",
    clientName: "MWEB",
    clientVersion: "2.20251209.01.00",
    clientNameHeader: "2",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    context: {
      platform: "MOBILE",
      osName: "iOS",
      osVersion: "17.5.1"
    }
  }
];

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

async function fetchPlayerWithClient(videoId: string, client: ClientProfile) {
  const response = await fetch(INNERTUBE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      "User-Agent": client.userAgent,
      "X-YouTube-Client-Name": client.clientNameHeader,
      "X-YouTube-Client-Version": client.clientVersion,
      Origin: "https://www.youtube.com"
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: client.clientName,
          clientVersion: client.clientVersion,
          hl: "en",
          gl: "US",
          ...client.context
        },
        user: { lockedSafetyMode: false },
        request: { useSsl: true }
      },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true
    })
  });

  if (!response.ok) {
    throw new Error(`InnerTube /player failed (${client.name}): ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as PlayerPayload;
}

async function fetchPlayer(videoId: string) {
  let firstPlayable: { payload: PlayerPayload; client: ClientProfile } | null = null;
  const failures: string[] = [];

  for (const client of CLIENT_PROFILES) {
    try {
      const payload = await fetchPlayerWithClient(videoId, client);
      const status = payload.playabilityStatus?.status;

      if (status && status !== "OK") {
        failures.push(`${client.name}: ${status}${payload.playabilityStatus?.reason ? ` - ${payload.playabilityStatus.reason}` : ""}`);
        continue;
      }

      if (!firstPlayable) {
        firstPlayable = { payload, client };
      }

      const captionTracks = payload.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (captionTracks.length > 0) {
        return { payload, client };
      }

      failures.push(`${client.name}: OK but no caption tracks`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${client.name}: ${message}`);
    }
  }

  if (firstPlayable) {
    return firstPlayable;
  }

  throw new Error(`Video not playable on any supported client.\n${failures.join("\n")}`);
}

function buildAvailableTracks(tracks: CaptionTrackPayload[]): YouTubeCaptionTrack[] {
  return tracks.map((track) => ({
    languageCode: track.languageCode || "unknown",
    label: track.name?.simpleText || track.languageCode || "Unknown track",
    kind: track.kind === "asr" ? "auto" : "manual",
    isTranslatable: Boolean(track.isTranslatable)
  }));
}

function pickCaptionTrack(tracks: CaptionTrackPayload[], preferredLanguage: string) {
  if (tracks.length === 0) {
    return null;
  }

  const normalizedLanguage = preferredLanguage.trim().toLowerCase();

  if (normalizedLanguage) {
    return (
      tracks.find((track) => track.vssId === `.${normalizedLanguage}`) ||
      tracks.find((track) => track.vssId === `a.${normalizedLanguage}`) ||
      tracks.find((track) => track.languageCode === normalizedLanguage) ||
      tracks.find((track) => track.vssId?.includes(`.${normalizedLanguage}`)) ||
      tracks[0]
    );
  }

  return (
    tracks.find((track) => track.vssId === ".en") ||
    tracks.find((track) => track.vssId === "a.en") ||
    tracks.find((track) => track.languageCode === "en" && track.kind !== "asr") ||
    tracks.find((track) => track.kind !== "asr") ||
    tracks[0]
  );
}

async function fetchCaptionSegments(track: CaptionTrackPayload, userAgent: string) {
  if (!track.baseUrl) {
    return [];
  }

  const url = new URL(track.baseUrl);
  url.searchParams.set("fmt", "json3");

  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent
    }
  });

  if (!response.ok) {
    throw new Error(`Caption fetch failed: ${response.status}`);
  }

  const text = await response.text();
  if (!text.trim()) {
    return [];
  }

  const payload = JSON.parse(text) as {
    events?: Array<{
      segs?: Array<{ utf8?: string }>;
      tStartMs?: number;
      dDurationMs?: number;
      aAppend?: number;
    }>;
  };

  const segments: RawCaptionSegment[] = [];

  for (const event of payload.events ?? []) {
    if (!event.segs || event.aAppend === 1) {
      continue;
    }

    const sourceText = normalizeCaptionText(event.segs.map((part) => part.utf8 ?? "").join(""));
    if (!sourceText) {
      continue;
    }

    const startMs = event.tStartMs ?? 0;
    const durationMs = event.dDurationMs ?? 0;
    segments.push({
      startMs,
      endMs: startMs + durationMs,
      durationMs,
      sourceText
    });
  }

  return coalesceSegments(segments);
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

  const { payload, client } = await fetchPlayer(videoId);
  const captionTracks = payload.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const availableTracks = buildAvailableTracks(captionTracks);

  if (captionTracks.length === 0) {
    throw new Error("这个视频没有可用字幕，当前原型暂时无法翻译。建议先换一个带字幕或自动字幕的视频。");
  }

  const selectedTrack = pickCaptionTrack(captionTracks, params.sourceLanguage);
  if (!selectedTrack?.baseUrl) {
    throw new Error("没有找到可读取的字幕轨道。你可以尝试手动指定原字幕语言代码，例如 en、ja 或 ko。");
  }

  const rawSegments = await fetchCaptionSegments(selectedTrack, client.userAgent);
  if (rawSegments.length === 0) {
    throw new Error("字幕轨道存在，但没有成功解析到正文。你可以换一个视频，或者稍后再试。");
  }

  const warnings: string[] = [];
  let translatedTexts: string[];
  let translationMode: YouTubeTranslationResult["translationMode"] = "google_fallback";

  try {
    translatedTexts = await translateSegmentsWithOpenAI(rawSegments);
    translationMode = "openai";
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    warnings.push(`OpenAI 翻译不可用，已自动切换到 Google 回退翻译。原因：${message}`);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      warnings.push(`视频重点摘要生成失败，已跳过该步骤。原因：${message}`);
    }
  }

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: payload.videoDetails?.title || "Untitled video",
    description: payload.videoDetails?.shortDescription || "",
    sourceLanguage: selectedTrack.languageCode || "unknown",
    sourceTrackLabel: selectedTrack.name?.simpleText || selectedTrack.languageCode || "Unknown track",
    translationMode,
    warnings,
    summary: summaryPayload?.summary,
    takeaways: summaryPayload?.takeaways ?? [],
    availableTracks,
    segments,
    srt: buildSrt(segments)
  };
}
