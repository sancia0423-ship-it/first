import "server-only";

import { z } from "zod";
import { PublicError } from "@/lib/api/guards";

/**
 * 字幕来源：Supadata 官方 API。
 *
 * 这里原本先用 yt-dlp 抓，失败再退到这里。yt-dlp 是非官方抓取，从机房 IP 会被
 * YouTube 的机器人检测持续拦截 —— 实测几乎每个视频都要先失败一轮、白等十几秒，
 * 而且失败时的报错还会盖住真正的原因。已整条移除。
 *
 * 代价是每次转录消耗 1 个 Supadata credit（免费档 100 次/月）。换来的是可预期的
 * 成功率、少十几秒延迟，以及不再依赖非官方抓取。
 */

const TRANSCRIPT_ENDPOINT = "https://api.supadata.ai/v1/transcript";
const OEMBED_ENDPOINT = "https://www.youtube.com/oembed";

/** 严格校验：结构对不上就当失败，宁可报错也不要给出半截结果。 */
const TranscriptSchema = z.object({
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

export function hasTranscriptKey() {
  return Boolean(process.env.SUPADATA_API_KEY);
}

export type FetchedTranscript = {
  title: string;
  languageCode: string;
  availableLanguages: string[];
  segments: Array<{ startMs: number; durationMs: number; sourceText: string }>;
};

/**
 * 取视频标题。走 YouTube 官方 oEmbed —— 免费、不需要 key，也不消耗 Supadata 额度。
 * 拿不到就返回空字符串：标题只是显示用，不该因此让整个请求失败。
 */
async function fetchTitle(videoId: string) {
  try {
    const query = new URLSearchParams({
      url: `https://www.youtube.com/watch?v=${videoId}`,
      format: "json"
    });
    const response = await fetch(`${OEMBED_ENDPOINT}?${query}`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store"
    });

    if (!response.ok) {
      return "";
    }

    const payload = (await response.json()) as { title?: string };
    return typeof payload.title === "string" ? payload.title : "";
  } catch {
    return "";
  }
}

export async function fetchTranscript(
  videoId: string,
  preferredLanguage: string
): Promise<FetchedTranscript> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new PublicError("这个站点还没有配置字幕服务，暂时无法读取字幕。");
  }

  const query = new URLSearchParams({
    url: `https://www.youtube.com/watch?v=${videoId}`,
    text: "false",
    // 只取视频已有的字幕。默认的 auto 会在没有字幕时转而调用 AI 转录，
    // 那是按分钟计费的（每分钟 2 credits）—— 一部 90 分钟的访谈要 180 credits，
    // 一次就超过整月免费额度。宁可明确告诉用户「这个视频没有字幕」。
    mode: "native"
  });

  if (preferredLanguage) {
    query.set("lang", preferredLanguage);
  }

  // 标题和字幕互不依赖，并行发出省一个往返。
  // fetchTitle 自身不会 reject，所以提前发出也不会留下未处理的 rejection。
  const titlePromise = fetchTitle(videoId);

  let response: Response;
  try {
    response = await fetch(`${TRANSCRIPT_ENDPOINT}?${query}`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(60_000),
      cache: "no-store"
    });
  } catch (error) {
    console.error("[transcript] request failed", error);
    throw new PublicError("字幕服务连接失败，请稍后再试。");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // key 与额度问题是运维要看的，不该原样丢给访客。
    console.error(`[transcript] HTTP ${response.status}`, body.slice(0, 300));

    if (response.status === 401 || response.status === 403) {
      throw new PublicError("字幕服务鉴权失败，站点配置需要检查。");
    }
    if (response.status === 404) {
      throw new PublicError(
        "这个视频没有现成的字幕。当前只支持作者已经上传或 YouTube 自动生成了字幕的视频。"
      );
    }
    if (response.status === 429) {
      throw new PublicError("字幕服务本月额度已用完，请稍后再试。");
    }

    throw new PublicError("读取字幕失败，请换一个公开且带字幕的视频再试。");
  }

  // 202 表示服务端转成了异步任务。native 模式下不该发生，真发生了说明参数没生效，
  // 直接报错比让 schema 校验抛出一句看不懂的话要好。
  if (response.status === 202) {
    console.error("[transcript] unexpected async job in native mode");
    throw new PublicError("字幕服务返回了异步任务，当前不支持。请换一个视频再试。");
  }

  const parsed = TranscriptSchema.safeParse(await response.json());
  if (!parsed.success) {
    console.error("[transcript] unexpected response shape", parsed.error.flatten());
    throw new PublicError("字幕服务返回结构异常，请稍后再试。");
  }

  return {
    // fetchTitle 内部已吞掉所有异常，拿不到标题不会影响主流程。
    title: await titlePromise,
    languageCode: parsed.data.lang ?? preferredLanguage ?? "",
    availableLanguages: parsed.data.availableLangs ?? [],
    segments: parsed.data.content.map((item) => ({
      startMs: Math.max(0, Math.round(item.offset)),
      durationMs: Math.max(0, Math.round(item.duration)),
      sourceText: item.text
    }))
  };
}
