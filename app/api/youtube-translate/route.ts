import { NextRequest, NextResponse } from "next/server";
import { rateLimitGuard, toPublicErrorMessage } from "@/lib/api/guards";
import { YouTubeTranslationRequestSchema } from "@/lib/youtube-agent/contracts";
import { runYouTubeTranslation } from "@/lib/youtube-agent";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limited = rateLimitGuard(request);
  if (limited) {
    return limited;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON。" }, { status: 400 });
  }

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

  try {
    return NextResponse.json(await runYouTubeTranslation(parsed.data));
  } catch (error) {
    console.error("[api/youtube-translate] failed", error);
    return NextResponse.json(
      { error: toPublicErrorMessage(error, "字幕翻译失败，请稍后再试。") },
      { status: 502 }
    );
  }
}
