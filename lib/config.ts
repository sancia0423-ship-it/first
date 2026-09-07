/**
 * Central runtime configuration.
 *
 * Every AI call used to inline its own model name and timeout, which is how the
 * repo ended up with three different defaults (`gpt-5.2`, `gpt-4o-mini`) and a
 * 5s budget that no question-generation call could ever meet. Keep them here.
 */

function readNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULT_OPENAI_MODEL = "gpt-5.2";

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
}

export function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Per-request budget for a single OpenAI call. */
export const OPENAI_REQUEST_TIMEOUT_MS = readNumber("OPENAI_TIMEOUT_MS", 30_000);

/** Retries are handled by our own fallbacks, so keep the SDK from doubling latency. */
export const OPENAI_MAX_RETRIES = 1;

/** Budget for a python helper (yt-dlp / deep-translator) invocation. */
export const PYTHON_SCRIPT_TIMEOUT_MS = readNumber("PYTHON_SCRIPT_TIMEOUT_MS", 90_000);

/** Upper bound on caption segments we will translate for one video. */
export const MAX_CAPTION_SEGMENTS = readNumber("MAX_CAPTION_SEGMENTS", 900);

export const RATE_LIMIT_WINDOW_MS = readNumber("RATE_LIMIT_WINDOW_MS", 60_000);
export const RATE_LIMIT_MAX_HITS = readNumber("RATE_LIMIT_MAX_HITS", 10);
