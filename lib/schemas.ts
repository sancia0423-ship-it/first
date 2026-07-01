import { z } from "zod";

export const SearchInputSchema = z.object({
  company: z.string().trim().min(1, "company is required"),
  role: z.string().trim().min(1, "role is required"),
  direction: z.string().trim().default("")
});

export const QueryExpansionSchema = z.object({
  companyAliases: z.array(z.string()),
  roleAliases: z.array(z.string()),
  directionTerms: z.array(z.string()),
  queries: z.array(z.string())
});

export const SourceCandidateSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().url(),
  publishedAt: z.string(),
  authorLabel: z.string(),
  summarySnippet: z.string(),
  previewText: z.string(),
  relevanceScore: z.number(),
  retrievalReason: z.string(),
  tags: z.array(z.string())
});

export const QuestionEvidenceSchema = z.object({
  question: z.string(),
  normalizedQuestion: z.string(),
  topicTag: z.string(),
  roundLabel: z.string(),
  evidenceSnippet: z.string()
});

export const InterviewSignalSchema = z.object({
  sourceId: z.string(),
  title: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().url(),
  publishedAt: z.string(),
  authorLabel: z.string(),
  company: z.string(),
  role: z.string(),
  direction: z.string(),
  process: z.array(z.string()),
  totalCycleDays: z.number().nullable(),
  questions: z.array(QuestionEvidenceSchema),
  notes: z.array(z.string()),
  summarySnippet: z.string(),
  extractionMethod: z.enum(["openai", "heuristic", "preview"])
});

export const SearchResultSchema = z.object({
  mode: z.enum(["mock", "live", "mixed"]),
  stageSummary: z.string(),
  sourceScope: z.string(),
  warnings: z.array(z.string()),
  query: SearchInputSchema,
  expandedQueries: z.array(z.string()),
  sampleSize: z.number(),
  confidenceLabel: z.enum(["低", "中", "中高", "高"]),
  lastUpdated: z.string(),
  pipeline: z.object({
    retrievalSource: z.string(),
    extractionMode: z.string(),
    retrievedCount: z.number(),
    extractedCount: z.number()
  }),
  overview: z.object({
    typicalProcess: z.array(z.string()),
    medianCycleDays: z.number().nullable(),
    hotTopics: z.array(z.string()),
    cycleSampleCount: z.number(),
    cycleRange: z.object({
      min: z.number().nullable(),
      max: z.number().nullable()
    }),
    repeatedQuestionCount: z.number()
  }),
  timelineHighlights: z.array(z.string()),
  topQuestions: z.array(
    z.object({
      question: z.string(),
      count: z.number(),
      topicTag: z.string(),
      roundLabels: z.array(z.string()),
      evidenceSnippet: z.string()
    })
  ),
  prepSuggestions: z.array(z.string()),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      sourceName: z.string(),
      sourceUrl: z.string().url(),
      publishedAt: z.string(),
      relevanceLabel: z.string(),
      summarySnippet: z.string(),
      extractionMethod: z.string(),
      authorLabel: z.string()
    })
  )
});

export const MockInterviewTargetRoleSchema = z.enum([
  "ai-product-general",
  "ai-growth",
  "ai-agent",
  "ai-platform"
]);

export const MockInterviewSenioritySchema = z.enum(["intern", "junior", "mid"]);

export const MockInterviewCompanyStageSchema = z.enum(["startup", "growth", "bigtech"]);

export const MockInterviewSetupSchema = z.object({
  targetRole: MockInterviewTargetRoleSchema,
  seniority: MockInterviewSenioritySchema,
  companyStage: MockInterviewCompanyStageSchema,
  focusArea: z.string().trim().min(1, "focusArea is required").max(40),
  candidateBackground: z.string().trim().max(400).default("")
});

export const MockInterviewDimensionSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string()
});

export const MockInterviewQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  intent: z.string(),
  dimensionTags: z.array(z.string()).min(2).max(4),
  excellentSignals: z.array(z.string()).min(3).max(5),
  timebox: z.string()
});

export const MockInterviewSessionSchema = z.object({
  interviewId: z.string(),
  interviewerName: z.string(),
  intro: z.string(),
  mode: z.enum(["heuristic", "openai"]),
  setup: MockInterviewSetupSchema,
  dimensions: z.array(MockInterviewDimensionSchema).min(4).max(6),
  questions: z.array(MockInterviewQuestionSchema).min(3).max(5)
});

export const MockInterviewDimensionScoreSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number().min(1).max(5),
  reason: z.string()
});

export const MockInterviewEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  verdict: z.string(),
  strengths: z.array(z.string()).max(4),
  gaps: z.array(z.string()).max(4),
  followUpQuestion: z.string(),
  dimensionScores: z.array(MockInterviewDimensionScoreSchema).min(4).max(6),
  suggestedAnswerOutline: z.array(z.string()).min(3).max(5)
});

export const MockInterviewAnswerRecordSchema = z.object({
  questionId: z.string(),
  prompt: z.string(),
  answer: z.string(),
  evaluation: MockInterviewEvaluationSchema
});

export const MockInterviewSummarySchema = z.object({
  overallScore: z.number().min(0).max(100),
  readinessLabel: z.enum(["继续打磨", "可进入一面", "具备竞争力", "有亮点"]),
  headline: z.string(),
  strengths: z.array(z.string()).max(5),
  risks: z.array(z.string()).max(5),
  nextSteps: z.array(z.string()).max(5),
  dimensionAverages: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      score: z.number().min(1).max(5)
    })
  ).min(4).max(6)
});

export type SearchInput = z.infer<typeof SearchInputSchema>;
export type QueryExpansion = z.infer<typeof QueryExpansionSchema>;
export type SourceCandidate = z.infer<typeof SourceCandidateSchema>;
export type QuestionEvidence = z.infer<typeof QuestionEvidenceSchema>;
export type InterviewSignal = z.infer<typeof InterviewSignalSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type MockInterviewTargetRole = z.infer<typeof MockInterviewTargetRoleSchema>;
export type MockInterviewSeniority = z.infer<typeof MockInterviewSenioritySchema>;
export type MockInterviewCompanyStage = z.infer<typeof MockInterviewCompanyStageSchema>;
export type MockInterviewSetup = z.infer<typeof MockInterviewSetupSchema>;
export type MockInterviewDimension = z.infer<typeof MockInterviewDimensionSchema>;
export type MockInterviewQuestion = z.infer<typeof MockInterviewQuestionSchema>;
export type MockInterviewSession = z.infer<typeof MockInterviewSessionSchema>;
export type MockInterviewDimensionScore = z.infer<typeof MockInterviewDimensionScoreSchema>;
export type MockInterviewEvaluation = z.infer<typeof MockInterviewEvaluationSchema>;
export type MockInterviewAnswerRecord = z.infer<typeof MockInterviewAnswerRecordSchema>;
export type MockInterviewSummary = z.infer<typeof MockInterviewSummarySchema>;
