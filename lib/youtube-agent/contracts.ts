import { z } from "zod";

export const YouTubeTranslationRequestSchema = z.object({
  url: z.string().trim().min(1, "url is required"),
  sourceLanguage: z.string().trim().max(16).default("")
});

export const YouTubeCaptionTrackSchema = z.object({
  languageCode: z.string(),
  label: z.string(),
  kind: z.enum(["manual", "auto"]),
  isTranslatable: z.boolean()
});

export const YouTubeTranslatedSegmentSchema = z.object({
  id: z.string(),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  sourceText: z.string(),
  translatedText: z.string()
});

export const YouTubeTranslationResultSchema = z.object({
  videoId: z.string(),
  videoUrl: z.string().url(),
  title: z.string(),
  description: z.string(),
  sourceLanguage: z.string(),
  sourceTrackLabel: z.string(),
  translationMode: z.enum(["openai", "google_fallback"]),
  warnings: z.array(z.string()),
  summary: z.string().optional(),
  takeaways: z.array(z.string()),
  availableTracks: z.array(YouTubeCaptionTrackSchema),
  segments: z.array(YouTubeTranslatedSegmentSchema),
  srt: z.string()
});

/** 只取字幕、不翻译的结果。供浏览器自带 key 时在本地完成翻译。 */
export const YouTubeTranscriptResultSchema = z.object({
  videoId: z.string(),
  videoUrl: z.string().url(),
  title: z.string(),
  description: z.string(),
  sourceLanguage: z.string(),
  sourceTrackLabel: z.string(),
  warnings: z.array(z.string()),
  availableTracks: z.array(YouTubeCaptionTrackSchema),
  segments: z.array(
    z.object({
      id: z.string(),
      startMs: z.number().int().nonnegative(),
      endMs: z.number().int().nonnegative(),
      durationMs: z.number().int().nonnegative(),
      sourceText: z.string()
    })
  )
});

export type YouTubeTranscriptResult = z.infer<typeof YouTubeTranscriptResultSchema>;
export type YouTubeTranslationRequest = z.infer<typeof YouTubeTranslationRequestSchema>;
export type YouTubeCaptionTrack = z.infer<typeof YouTubeCaptionTrackSchema>;
export type YouTubeTranslatedSegment = z.infer<typeof YouTubeTranslatedSegmentSchema>;
export type YouTubeTranslationResult = z.infer<typeof YouTubeTranslationResultSchema>;
