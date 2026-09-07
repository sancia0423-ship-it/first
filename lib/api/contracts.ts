import { z } from "zod";
import {
  MockInterviewAnswerRecordSchema,
  MockInterviewQuestionSchema,
  MockInterviewSetupSchema
} from "@/lib/schemas";

/**
 * Request contract for `POST /api/v1/interview/mock`.
 * Shared by the route handler and the generated OpenAPI document so the spec
 * can never drift from what the endpoint actually validates.
 */
export const MockActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), setup: MockInterviewSetupSchema }),
  z.object({
    action: z.literal("evaluate"),
    setup: MockInterviewSetupSchema,
    question: MockInterviewQuestionSchema,
    answer: z.string().trim().min(20, "answer is too short").max(4000)
  }),
  z.object({
    action: z.literal("summary"),
    records: z.array(MockInterviewAnswerRecordSchema).min(1)
  })
]);

export type MockAction = z.infer<typeof MockActionSchema>;
