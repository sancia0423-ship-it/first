import { NextRequest, NextResponse } from "next/server";
import { rateLimitGuard, toPublicErrorMessage } from "@/lib/api/guards";
import { TRIAL_MAX_SEGMENTS, consumeTrial, isTrialAvailable } from "@/lib/api/trial";
import { YouTubeTranslationRequestSchema } from "@/lib/youtube-agent/contracts";
import { runYouTubeTranslation } from "@/lib/youtube-agent";

export const dynamic = "force-dynamic";

/**
 * 站点自己的翻译入口，跑在试用额度下。
 *
 * 自带 key 的访客不会走到这里 —— 他们直接从浏览器请求服务商。这条路径是给
 * 第一次来、还没有 key 的人用的，让他们零配置就能看到完整效果。
 */
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
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const EXHAUSTED = "今天的免费试用次数已经用完了。填入你自己的 API key 就可以继续使用，而且没有长度限制。";

  // 「本站没开试用」和「今天用完了」是两回事：说成用完，用户会以为等一天就好。
  if (!isTrialAvailable()) {
    return NextResponse.json(
      {
        error: "trial_disabled",
        message: "这个站点没有开放免费试用。填入你自己的 API key 即可使用，长度不限。"
      },
      { status: 402 }
    );
  }

  // 先占额度再执行：并发时宁可浪费一次，也不要超支。
  if (!consumeTrial(request)) {
    return NextResponse.json({ error: "trial_exhausted", message: EXHAUSTED }, { status: 429 });
  }

  try {
    return NextResponse.json(
      await runYouTubeTranslation(parsed.data, { maxSegments: TRIAL_MAX_SEGMENTS })
    );
  } catch (error) {
    console.error("[api/youtube-translate] failed", error);
    return NextResponse.json(
      { error: toPublicErrorMessage(error, "字幕翻译失败，请稍后再试。") },
      { status: 502 }
    );
  }
}
