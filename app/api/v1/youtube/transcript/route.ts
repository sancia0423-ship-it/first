import { NextRequest } from "next/server";
import { badRequest, handleV1, readJson } from "@/lib/api/v1";
import { YouTubeTranslationRequestSchema } from "@/lib/youtube-agent/contracts";
import { fetchYouTubeTranscript } from "@/lib/youtube-agent";

export const dynamic = "force-dynamic";

/**
 * 只取字幕，不翻译。
 *
 * 存在的意义：抓字幕要服务端的 yt-dlp，但不需要任何 AI key。拆开之后，
 * 自带 key 的访客可以拿走原文，在自己浏览器里完成翻译，key 不经过服务器。
 */
export async function POST(request: NextRequest) {
  const body = await readJson(request);
  if (!body.ok) {
    return badRequest("Request body must be JSON.");
  }

  const parsed = YouTubeTranslationRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten());
  }

  return handleV1(request, () => fetchYouTubeTranscript(parsed.data), "字幕读取失败，请稍后再试。");
}
