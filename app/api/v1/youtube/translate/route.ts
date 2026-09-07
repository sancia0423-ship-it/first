import { NextRequest } from "next/server";
import { badRequest, handleV1, readJson } from "@/lib/api/v1";
import { YouTubeTranslationRequestSchema } from "@/lib/youtube-agent/contracts";
import { runYouTubeTranslation } from "@/lib/youtube-agent";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  if (!body.ok) {
    return badRequest("Request body must be JSON.");
  }

  const parsed = YouTubeTranslationRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten());
  }

  return handleV1(request, () => runYouTubeTranslation(parsed.data), "字幕翻译失败，请稍后再试。");
}
