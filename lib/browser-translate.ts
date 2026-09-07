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
