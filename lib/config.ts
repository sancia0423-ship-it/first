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

/**
 * 服务端默认模型。这里跑的是模拟面试出题、点评和面经抽取 —— 都是判断题，
 * 值得用中档模型；旗舰档在这些任务上买不到对应的价值。
 */
export const DEFAULT_OPENAI_MODEL = "gpt-5.6-terra";

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
}

/**
 * 字幕翻译单独一个模型。
 *
 * 翻译是机械转换且调用量最大，跟出题、抽取这些判断任务共用一个中档模型，
 * 等于每条字幕都多付二十倍的钱。
 */
export const DEFAULT_TRANSLATE_MODEL = "gpt-4o-mini";

export function getTranslateModel() {
  return process.env.OPENAI_TRANSLATE_MODEL || DEFAULT_TRANSLATE_MODEL;
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

/**
 * 单个视频最多处理多少条字幕。
 *
 * 实测密度约每分钟 16 条，所以 3000 条覆盖到三小时左右。原来的 900 是按短视频
 * 定的，会把一部 1.5 小时访谈截掉四成 —— 而访谈正是这个工具的主要用途。
 */
export const MAX_CAPTION_SEGMENTS = readNumber("MAX_CAPTION_SEGMENTS", 3000);

export const RATE_LIMIT_WINDOW_MS = readNumber("RATE_LIMIT_WINDOW_MS", 60_000);
export const RATE_LIMIT_MAX_HITS = readNumber("RATE_LIMIT_MAX_HITS", 10);
