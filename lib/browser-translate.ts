/**
 * 浏览器端字幕翻译：用访客自己的 OpenAI key，直接从浏览器调用 OpenAI。
 *
 * 为什么放在浏览器而不是服务端：
 * 这样 key 可以被证明没有经过站点服务器 —— 它只出现在访客自己的浏览器里，
 * 只发往 api.openai.com。服务端因此也不承担任何调用成本。
 *
 * 这个文件不能引入任何服务端代码。
 */

/**
 * 两家服务商都提供 OpenAI 兼容的 chat completions 接口，所以只有端点和默认
 * 模型不同，请求体完全一致。
 *
 * 一个实测差异：DeepSeek 在鉴权失败的响应里也带 CORS 头，浏览器能读到真实
 * 错误；OpenAI 由边缘直接拒绝，浏览器只能看到一个笼统的网络错误。
 */
export const PROVIDERS = {
  openai: {
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    keysUrl: "https://platform.openai.com/api-keys",
    readableAuthError: false
  },
  deepseek: {
    label: "DeepSeek",
    endpoint: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
    keysUrl: "https://platform.deepseek.com/api_keys",
    readableAuthError: true
  }
} as const;

export type ProviderId = keyof typeof PROVIDERS;

export function isProviderId(value: string): value is ProviderId {
  return value in PROVIDERS;
}

export const BYOK_STORAGE_KEY = "byok-api-key";
export const BYOK_MODEL_STORAGE_KEY = "byok-model";
export const BYOK_PROVIDER_STORAGE_KEY = "byok-provider";
export const DEFAULT_PROVIDER: ProviderId = "openai";
export const DEFAULT_BYOK_MODEL = PROVIDERS[DEFAULT_PROVIDER].defaultModel;

/** 一次请求塞多少条字幕。太多会超时，太少会浪费往返。 */
const BATCH_SIZE = 20;
/** 同时在飞的请求数，避免触发速率限制。 */
const CONCURRENCY = 3;

export type TranslatableSegment = {
  id: string;
  sourceText: string;
};

export class BrowserTranslateError extends Error {}

/** key 只在浏览器里读写，服务端渲染时直接返回空。 */
export function readStoredKey() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(BYOK_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function readStoredProvider(): ProviderId {
  if (typeof window === "undefined") return DEFAULT_PROVIDER;
  try {
    const stored = window.localStorage.getItem(BYOK_PROVIDER_STORAGE_KEY) ?? "";
    return isProviderId(stored) ? stored : DEFAULT_PROVIDER;
  } catch {
    return DEFAULT_PROVIDER;
  }
}

export function readStoredModel(provider: ProviderId = DEFAULT_PROVIDER) {
  const fallback = PROVIDERS[provider].defaultModel;
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(BYOK_MODEL_STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function storeKey(key: string, provider: ProviderId, model: string) {
  try {
    if (key) {
      window.localStorage.setItem(BYOK_STORAGE_KEY, key);
      window.localStorage.setItem(BYOK_PROVIDER_STORAGE_KEY, provider);
    } else {
      window.localStorage.removeItem(BYOK_STORAGE_KEY);
      window.localStorage.removeItem(BYOK_PROVIDER_STORAGE_KEY);
    }

    if (model && model !== PROVIDERS[provider].defaultModel) {
      window.localStorage.setItem(BYOK_MODEL_STORAGE_KEY, model);
    } else {
      window.localStorage.removeItem(BYOK_MODEL_STORAGE_KEY);
    }
  } catch {
    // 无痕窗口等场景下存不住，本次会话内仍然可用。
  }
}

/** 只显示首尾，中间打码，避免在界面上完整暴露 key。 */
export function maskKey(key: string) {
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 7)}••••${key.slice(-4)}`;
}

export type ProviderConfig = {
  apiKey: string;
  provider: ProviderId;
  model: string;
};

/**
 * 调用一次 chat completion，要求返回 JSON 对象。
 * 翻译、章节划分、选中解释都走这里，只是 prompt 不同。
 */
async function callChatJson<T>(
  config: ProviderConfig,
  systemPrompt: string,
  userPayload: unknown,
  signal?: AbortSignal
): Promise<T> {
  const provider = PROVIDERS[config.provider];
  let response: Response;

  try {
    response = await fetch(provider.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      signal,
      body: JSON.stringify({
        model: config.model || provider.defaultModel,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              typeof userPayload === "string" ? userPayload : JSON.stringify(userPayload)
          }
        ]
      })
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    // OpenAI 在鉴权失败时由边缘直接拒绝，响应里没有 CORS 头，浏览器只能抛出一个
    // 笼统的网络错误。DeepSeek 会带 CORS 头，所以那边能读到真实原因。
    throw new BrowserTranslateError(
      provider.readableAuthError
        ? `无法连接 ${provider.label}，请检查网络后重试。`
        : `无法连接 ${provider.label}。通常是 API key 不正确，也可能是网络或浏览器插件拦截了请求。`
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      detail = body.error?.message ?? "";
    } catch {
      // 读不到就用状态码说明。
    }

    if (response.status === 401) {
      throw new BrowserTranslateError(
        detail || `${provider.label} 的 API key 无效，请检查后重新填写。`
      );
    }
    if (response.status === 429) {
      throw new BrowserTranslateError(
        detail || `触发了 ${provider.label} 的速率限制或余额不足，请稍后再试。`
      );
    }

    throw new BrowserTranslateError(
      detail || `${provider.label} 返回错误（HTTP ${response.status}）。`
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new BrowserTranslateError(`${provider.label} 没有返回可用内容。`);
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new BrowserTranslateError(`${provider.label} 返回的内容不是合法 JSON。`);
  }
}

const TRANSLATE_PROMPT =
  "你是一个视频字幕翻译器。把每条字幕自然地翻译成简体中文，保留原始顺序和 id，" +
  "不要合并或拆分条目，不要添加解释。只返回 JSON。";

export type TranslateProgress = {
  done: number;
  total: number;
};

/**
 * 翻译全部字幕。返回按输入顺序对应的译文数组，翻译失败的条目保留原文。
 */
export async function translateSegmentsInBrowser(
  segments: TranslatableSegment[],
  options: ProviderConfig & {
    signal?: AbortSignal;
    onProgress?: (progress: TranslateProgress) => void;
  }
): Promise<{ translations: string[]; translatedCount: number }> {
  const { signal, onProgress, ...config } = options;

  if (!config.apiKey) {
    throw new BrowserTranslateError("还没有填写 API key。");
  }

  const batches: TranslatableSegment[][] = [];
  for (let index = 0; index < segments.length; index += BATCH_SIZE) {
    batches.push(segments.slice(index, index + BATCH_SIZE));
  }

  const merged = new Map<string, string>();
  let completed = 0;
  let cursor = 0;

  const workers = Array.from(
    { length: Math.max(1, Math.min(CONCURRENCY, batches.length)) },
    async () => {
      while (cursor < batches.length) {
        const batch = batches[cursor++];
        const result = await callChatJson<{ items?: Array<{ id?: string; text?: string }> }>(
          config,
          TRANSLATE_PROMPT,
          {
            instruction: '返回 {"items":[{"id":"<原 id>","text":"<中文译文>"}]}',
            items: batch.map((segment) => ({ id: segment.id, text: segment.sourceText }))
          },
          signal
        );

        for (const item of result.items ?? []) {
          if (item.id && typeof item.text === "string" && item.text.trim()) {
            merged.set(item.id, item.text.trim());
          }
        }

        completed += batch.length;
        onProgress?.({ done: Math.min(completed, segments.length), total: segments.length });
      }
    }
  );

  await Promise.all(workers);

  const translations = segments.map((segment) => merged.get(segment.id) ?? segment.sourceText);
  return { translations, translatedCount: merged.size };
}

/* ==========================================================================
   章节划分与关键引用
   ========================================================================== */

export type VideoChapter = {
  startMs: number;
  title: string;
  summary: string;
};

export type KeyQuote = {
  startMs: number;
  text: string;
  why: string;
};

export type VideoOverview = {
  summary: string;
  chapters: VideoChapter[];
  quotes: KeyQuote[];
};

const OVERVIEW_PROMPT =
  "你是一个视频速览助手。基于带时间戳的字幕，把视频划分成若干章节，并挑出最值得看的几句话。" +
  "章节必须覆盖整个视频、按时间顺序、不重叠。startMs 必须是给定字幕中真实出现过的时间戳。" +
  "全部使用简体中文。只返回 JSON。";

/** 字幕可能很长，超过这个字符数就按比例抽样，保证覆盖整段而不是只看开头。 */
const OVERVIEW_CHAR_BUDGET = 12000;

function sampleForOverview(segments: Array<{ startMs: number; text: string }>) {
  const total = segments.reduce((sum, item) => sum + item.text.length, 0);
  if (total <= OVERVIEW_CHAR_BUDGET) {
    return segments;
  }

  // 均匀抽样而不是截断：截断会让 AI 只看到开头，划出的章节覆盖不到后半段。
  const step = Math.ceil(total / OVERVIEW_CHAR_BUDGET);
  return segments.filter((_, index) => index % step === 0);
}

export async function buildVideoOverview(
  segments: Array<{ startMs: number; text: string }>,
  options: ProviderConfig & { signal?: AbortSignal }
): Promise<VideoOverview> {
  const { signal, ...config } = options;

  if (!config.apiKey) {
    throw new BrowserTranslateError("还没有填写 API key。");
  }

  const sampled = sampleForOverview(segments);

  const result = await callChatJson<{
    summary?: string;
    chapters?: Array<{ startMs?: number; title?: string; summary?: string }>;
    quotes?: Array<{ startMs?: number; text?: string; why?: string }>;
  }>(
    config,
    OVERVIEW_PROMPT,
    {
      instruction:
        '返回 {"summary":"两句话的整体速览",' +
        '"chapters":[{"startMs":<数字>,"title":"章节标题","summary":"一句话说明"}],' +
        '"quotes":[{"startMs":<数字>,"text":"原话","why":"为什么值得看"}]}。' +
        "章节 3 到 8 个，引用 3 到 5 条。",
      captions: sampled.map((item) => ({ startMs: item.startMs, text: item.text }))
    },
    signal
  );

  const valid = new Set(segments.map((item) => item.startMs));
  /** AI 可能给出不存在的时间戳，吸附到最近的真实字幕，避免点了跳到空白处。 */
  const snap = (value: unknown) => {
    const raw = typeof value === "number" && Number.isFinite(value) ? value : 0;
    if (valid.has(raw)) return raw;

    let best = segments[0]?.startMs ?? 0;
    let bestGap = Math.abs(best - raw);
    for (const item of segments) {
      const gap = Math.abs(item.startMs - raw);
      if (gap < bestGap) {
        best = item.startMs;
        bestGap = gap;
      }
    }
    return best;
  };

  return {
    summary: typeof result.summary === "string" ? result.summary : "",
    chapters: (result.chapters ?? [])
      .filter((item) => item.title)
      .map((item) => ({
        startMs: snap(item.startMs),
        title: String(item.title),
        summary: String(item.summary ?? "")
      }))
      .sort((left, right) => left.startMs - right.startMs),
    quotes: (result.quotes ?? [])
      .filter((item) => item.text)
      .map((item) => ({
        startMs: snap(item.startMs),
        text: String(item.text),
        why: String(item.why ?? "")
      }))
      .sort((left, right) => left.startMs - right.startMs)
  };
}
