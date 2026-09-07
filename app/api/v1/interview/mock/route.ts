import { NextRequest } from "next/server";
import { MockActionSchema } from "@/lib/api/contracts";
import { consumeTrial } from "@/lib/api/trial";
import { badRequest, handleV1, readJson } from "@/lib/api/v1";
import {
  createInterviewSession,
  evaluateInterviewAnswer,
  summarizeInterview
} from "@/lib/mock-interview";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  if (!body.ok) {
    return badRequest("Request body must be JSON.");
  }

  const parsed = MockActionSchema.safeParse(body.value);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten());
  }

  const payload = parsed.data;
  // 额度用尽不拦人，改走本地题库与规则评分 —— 这条链路本来就为无 key 场景设计。
  const allowAi = payload.action === "summary" ? false : consumeTrial(request);

  return handleV1(
    request,
    async () => {
      switch (payload.action) {
        case "start":
          return createInterviewSession(payload.setup, allowAi);
        case "evaluate":
          return evaluateInterviewAnswer(
            {
              setup: payload.setup,
              question: payload.question,
              answer: payload.answer
            },
            allowAi
          );
        case "summary":
          return summarizeInterview(payload.records);
      }
    },
    "面试服务暂时不可用，请稍后再试。"
  );
}
