import "server-only";

import { NextResponse } from "next/server";
import { apiKeyGuard } from "@/lib/api/auth";
import { rateLimitGuard, toPublicErrorMessage } from "@/lib/api/guards";

/**
 * Shared entry sequence for every `/api/v1` handler: rate limit, then key
 * check, then run. Returning the guard response short-circuits the handler.
 */
export async function handleV1<T>(
  request: { headers: Headers },
  run: () => Promise<T>,
  fallbackMessage: string
): Promise<NextResponse> {
  const limited = rateLimitGuard(request);
  if (limited) {
    return limited;
  }

  const unauthorized = apiKeyGuard(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    return NextResponse.json(await run());
  } catch (error) {
    console.error("[api/v1] handler failed", error);
    return NextResponse.json(
      { error: "upstream_failed", message: toPublicErrorMessage(error, fallbackMessage) },
      { status: 502 }
    );
  }
}

export function badRequest(details: unknown) {
  return NextResponse.json({ error: "invalid_request", details }, { status: 400 });
}

export async function readJson(request: Request) {
  try {
    return { ok: true as const, value: (await request.json()) as unknown };
  } catch {
    return { ok: false as const };
  }
}
