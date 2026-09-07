import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/lib/api/auth";
import { hasOpenAIKey } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "sancia-api",
    version: "1",
    authRequired: isAuthEnabled(),
    // Tells a client which quality tier to expect before it spends a call.
    aiEnhanced: hasOpenAIKey(),
    timestamp: new Date().toISOString()
  });
}
