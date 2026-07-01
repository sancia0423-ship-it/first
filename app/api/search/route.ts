import { NextRequest, NextResponse } from "next/server";
import { runSearchPipeline } from "@/lib/pipeline/orchestrator";
import { isRateLimited } from "@/lib/pipeline/rate-limit";
import { SearchInputSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试。" },
      { status: 429 }
    );
  }

  const query = request.nextUrl.searchParams;

  const parsed = SearchInputSchema.safeParse({
    company: query.get("company") ?? "",
    role: query.get("role") ?? "",
    direction: query.get("direction") ?? ""
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  return NextResponse.json(await runSearchPipeline(parsed.data));
}
