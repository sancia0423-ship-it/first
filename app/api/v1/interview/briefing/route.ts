import { NextRequest } from "next/server";
import { badRequest, handleV1 } from "@/lib/api/v1";
import { runSearchPipeline } from "@/lib/pipeline/orchestrator";
import { SearchInputSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const parsed = SearchInputSchema.safeParse({
    company: query.get("company") ?? "",
    role: query.get("role") ?? "",
    direction: query.get("direction") ?? ""
  });

  if (!parsed.success) {
    return badRequest(parsed.error.flatten());
  }

  return handleV1(request, () => runSearchPipeline(parsed.data), "检索失败，请稍后再试。");
}
