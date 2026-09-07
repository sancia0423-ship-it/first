import { NextRequest, NextResponse } from "next/server";
import { rateLimitGuard } from "@/lib/api/guards";
import { runSearchPipeline } from "@/lib/pipeline/orchestrator";
import { SearchInputSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limited = rateLimitGuard(request);
  if (limited) {
    return limited;
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

  try {
    return NextResponse.json(await runSearchPipeline(parsed.data));
  } catch (error) {
    console.error("[api/search] pipeline failed", error);
    return NextResponse.json({ error: "分析失败，请稍后再试。" }, { status: 500 });
  }
}
