import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Public-API key check.
 *
 * Keys come from `API_KEYS` (comma separated). When it is unset the public API
 * stays open, which keeps local development and the no-key demo path working —
 * `/api-docs` says so plainly rather than implying the endpoints are protected.
 */
function configuredKeys() {
  return (process.env.API_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

export function isAuthEnabled() {
  return configuredKeys().length > 0;
}

function matchesAnyKey(presented: string, keys: string[]) {
  const presentedBuffer = Buffer.from(presented);

  // Compare against every key even after a hit, so the reply time does not
  // depend on which key matched.
  return keys.reduce((matched, key) => {
    const keyBuffer = Buffer.from(key);
    if (keyBuffer.length !== presentedBuffer.length) {
      return matched;
    }

    return timingSafeEqual(keyBuffer, presentedBuffer) || matched;
  }, false);
}

function presentedKey(request: { headers: Headers }) {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return request.headers.get("x-api-key")?.trim() ?? "";
}

/** Returns a 401 response when the caller is missing a valid key, else null. */
export function apiKeyGuard(request: { headers: Headers }): NextResponse | null {
  const keys = configuredKeys();

  if (keys.length === 0) {
    return null;
  }

  const presented = presentedKey(request);

  if (presented && matchesAnyKey(presented, keys)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "unauthorized",
      message: "Missing or invalid API key. Send it as `Authorization: Bearer <key>`."
    },
    { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="api"' } }
  );
}
