import { NextRequest, NextResponse } from "next/server";
import { TRIAL_MAX_SEGMENTS, consumeTrial, isTrialAvailable } from "@/lib/api/trial";
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

  // 这个端点会花站长的钱，所以和站内路径受同一套配额约束。
  // 没有它，任何人都能用公开接口按限流上限持续消耗额度。
  if (!isTrialAvailable()) {
    return NextResponse.json(
      {
        error: "trial_disabled",
        message:
          "这个端点需要服务端配置额度才能使用。若只需要原文字幕，请改用 /api/v1/youtube/transcript，它不消耗额度。"
      },
      { status: 402 }
    );
  }

  if (!consumeTrial(request)) {
    return NextResponse.json(
      {
        error: "trial_exhausted",
        message:
          "今天的免费额度已用完。/api/v1/youtube/transcript 仍然可用，取回原文后可自行翻译。"
      },
      { status: 429 }
    );
  }

  return handleV1(
    request,
    () => runYouTubeTranslation(parsed.data, { maxSegments: TRIAL_MAX_SEGMENTS }),
    "字幕翻译失败，请稍后再试。"
  );
}
