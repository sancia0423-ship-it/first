import "server-only";

import { z } from "zod";
import { PublicError } from "@/lib/api/guards";

/**
 * Supadata 字幕源，作为 yt-dlp 的兜底。
 *
 * 为什么需要它：YouTube 会对数据中心 IP 触发机器人检测，yt-dlp 从云服务器抓
 * 字幕是间歇失败的。切换 player client 能提高成功率，但不是保证。配置
 * SUPADATA_API_KEY 之后，yt-dlp 失败时会自动改走这条付费通道。
 *
 * 不配也能跑，只是失去这层兜底。
 */

const SUPADATA_ENDPOINT = "https://api.supadata.ai/v1/transcript";

/** 严格校验：结构对不上就当失败，宁可报错也不要给出半截结果。 */
const SupadataTranscriptSchema = z.object({
  lang: z.string().optional(),
  availableLangs: z.array(z.string()).optional(),
  content: z
    .array(
      z.object({
        text: z.string(),
        /** 毫秒。 */
        offset: z.number(),
        duration: z.number()
      })
    )
    .min(1)
});

export function hasSupadataKey() {
  return Boolean(process.env.SUPADATA_API_KEY);
}

/* --------------------------------------------------------------------------
   主源熔断
   --------------------------------------------------------------------------
   YouTube 一旦开始拦这台服务器，通常会持续一段时间。这期间每个请求都先把
   yt-dlp 的五个 player client 全试一遍再失败，白白多花十几秒。
   连续失败若干次后直接走备用源，冷却期过了再试一次主源，以便及时恢复。
   -------------------------------------------------------------------------- */

const FAILURES_BEFORE_SKIP = 3;
const COOLDOWN_MS = 10 * 60 * 1000;

let consecutiveFailures = 0;
let skipUntil = 0;

/** yt-dlp 当前是否值得一试。 */
export function shouldTryPrimarySource() {
  if (!hasSupadataKey()) {
    // 没有备用源时永远要试主源，否则就彻底没得用了。
    return true;
  }

  return Date.now() >= skipUntil;
}

export function recordPrimarySuccess() {
  consecutiveFailures = 0;
  skipUntil = 0;
}

export function recordPrimaryFailure() {
  consecutiveFailures += 1;

  if (consecutiveFailures >= FAILURES_BEFORE_SKIP) {
    skipUntil = Date.now() + COOLDOWN_MS;
    consecutiveFailures = 0;
  }
}

export type SupadataTranscript = {
  languageCode: string;
  segments: Array<{ startMs: number; durationMs: number; sourceText: string }>;
};

export async function fetchTranscriptFromSupadata(
  videoId: string,
  preferredLanguage: string
): Promise<SupadataTranscript> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new Error("SUPADATA_API_KEY is not configured");
  }

  const query = new URLSearchParams({
    url: `https://www.youtube.com/watch?v=${videoId}`,
    text: "false"
  });

  if (preferredLanguage) {
    query.set("lang", preferredLanguage);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);

  let response: Response;
  try {
    response = await fetch(`${SUPADATA_ENDPOINT}?${query}`, {
      headers: { "x-api-key": apiKey },
      signal: controller.signal,
      cache: "no-store"
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // key 和额度问题是运维要看的，不该原样丢给访客。
    console.error(`[supadata] HTTP ${response.status}`, body.slice(0, 300));

    if (response.status === 401 || response.status === 403) {
      throw new Error("supadata rejected the API key");
    }
    throw new Error(`supadata returned HTTP ${response.status}`);
  }

  const parsed = SupadataTranscriptSchema.safeParse(await response.json());
  if (!parsed.success) {
    console.error("[supadata] unexpected response shape", parsed.error.flatten());
    throw new PublicError("备用字幕服务返回结构异常，请稍后再试。");
  }

  return {
    languageCode: parsed.data.lang ?? preferredLanguage ?? "",
    segments: parsed.data.content.map((item) => ({
      startMs: Math.max(0, Math.round(item.offset)),
      durationMs: Math.max(0, Math.round(item.duration)),
      sourceText: item.text
    }))
  };
}
