import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateInterviewAnswer, createInterviewSession, summarizeInterview } from "@/lib/mock-interview";
import { isRateLimited } from "@/lib/pipeline/rate-limit";
import {
  MockInterviewAnswerRecordSchema,
  MockInterviewQuestionSchema,
  MockInterviewSetupSchema
} from "@/lib/schemas";

export const dynamic = "force-dynamic";

const StartInterviewSchema = z.object({
  action: z.literal("start"),
  setup: MockInterviewSetupSchema
});

const EvaluateInterviewSchema = z.object({
  action: z.literal("evaluate"),
  setup: MockInterviewSetupSchema,
  question: MockInterviewQuestionSchema,
  answer: z.string().trim().min(20, "answer is too short").max(4000)
});

const SummaryInterviewSchema = z.object({
  action: z.literal("summary"),
  records: z.array(MockInterviewAnswerRecordSchema).min(1)
});

const MockInterviewActionSchema = z.discriminatedUnion("action", [
  StartInterviewSchema,
  EvaluateInterviewSchema,
  SummaryInterviewSchema
]);

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试。" },
      { status: 429 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON。" }, { status: 400 });
  }

  const parsed = MockInterviewActionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  switch (parsed.data.action) {
    case "start":
      return NextResponse.json(await createInterviewSession(parsed.data.setup));
    case "evaluate":
      return NextResponse.json(
        await evaluateInterviewAnswer({
          setup: parsed.data.setup,
          question: parsed.data.question,
          answer: parsed.data.answer
        })
      );
    case "summary":
      return NextResponse.json(summarizeInterview(parsed.data.records));
  }
}
