import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/api/openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildOpenApiDocument(process.env.NEXT_PUBLIC_SITE_URL), {
    headers: { "Cache-Control": "public, max-age=300" }
  });
}
