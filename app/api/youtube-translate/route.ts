import { NextRequest, NextResponse } from "next/server";
import { YouTubeTranslationRequestSchema } from "@/lib/youtube-agent/contracts";
import { runYouTubeTranslation } from "@/lib/youtube-agent";
import { isRateLimited } from "@/lib/pipeline/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试。" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = YouTubeTranslationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(await runYouTubeTranslation(parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
