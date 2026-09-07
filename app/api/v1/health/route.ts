import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/lib/api/auth";
import { hasOpenAIKey } from "@/lib/config";
import { hasSupadataKey } from "@/lib/youtube-agent/supadata";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "sancia-api",
    version: "1",
    authRequired: isAuthEnabled(),
    // Tells a client which quality tier to expect before it spends a call.
    aiEnhanced: hasOpenAIKey(),
    // 主字幕源被 YouTube 拦截时是否有备用通道。
    transcriptFallback: hasSupadataKey(),
    timestamp: new Date().toISOString()
  });
}
