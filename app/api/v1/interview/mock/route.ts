import { NextRequest } from "next/server";
import { MockActionSchema } from "@/lib/api/contracts";
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

  return handleV1(
    request,
    async () => {
      switch (payload.action) {
        case "start":
          return createInterviewSession(payload.setup);
        case "evaluate":
          return evaluateInterviewAnswer({
            setup: payload.setup,
            question: payload.question,
            answer: payload.answer
          });
        case "summary":
          return summarizeInterview(payload.records);
      }
    },
    "面试服务暂时不可用，请稍后再试。"
  );
}
