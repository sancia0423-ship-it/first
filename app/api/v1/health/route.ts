import { NextRequest, NextResponse } from "next/server";
import { isAuthEnabled } from "@/lib/api/auth";
import { hasOpenAIKey } from "@/lib/config";
import { getTrialStatus } from "@/lib/api/trial";
import { hasTranscriptKey } from "@/lib/youtube-agent/transcript-source";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const trial = getTrialStatus(request);

  return NextResponse.json({
    ok: true,
    service: "sancia-api",
    version: "1",
    authRequired: isAuthEnabled(),
    // Tells a client which quality tier to expect before it spends a call.
    aiEnhanced: hasOpenAIKey(),
    // 字幕服务是否已配置。没有它就读不到任何字幕。
    transcriptReady: hasTranscriptKey(),
    // 没有自带 key 的访客今天还能免费试用几次。
    trial,
    timestamp: new Date().toISOString()
  });
}
