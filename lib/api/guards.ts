import { NextResponse } from "next/server";
import { getClientKey, isRateLimited } from "@/lib/pipeline/rate-limit";

/**
 * Returns a 429 response when the caller is over budget, otherwise null.
 * Every route handler used to repeat this block verbatim.
 */
export function rateLimitGuard(request: { headers: Headers }): NextResponse | null {
  if (!isRateLimited(getClientKey(request))) {
    return null;
  }

  return NextResponse.json({ error: "请求过于频繁，请稍后再试。" }, { status: 429 });
}

/**
 * Upstream failures (yt-dlp, OpenAI, a parse error) can carry file paths and
 * stack detail. Only messages we authored are safe to hand back to a browser.
 */
export function toPublicErrorMessage(error: unknown, fallback: string) {
  if (error instanceof PublicError) {
    return error.message;
  }

  return fallback;
}

/** An error whose message is written for end users and safe to return verbatim. */
export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicError";
  }
}
