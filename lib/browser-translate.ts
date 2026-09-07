/**
 * 浏览器端字幕翻译：用访客自己的 OpenAI key，直接从浏览器调用 OpenAI。
 *
 * 为什么放在浏览器而不是服务端：
 * 这样 key 可以被证明没有经过站点服务器 —— 它只出现在访客自己的浏览器里，
 * 只发往 api.openai.com。服务端因此也不承担任何调用成本。
 *
 * 这个文件不能引入任何服务端代码。
 */

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

export const BYOK_STORAGE_KEY = "openai-api-key";
export const BYOK_MODEL_STORAGE_KEY = "openai-model";
export const DEFAULT_BYOK_MODEL = "gpt-4o-mini";

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

export function readStoredModel() {
  if (typeof window === "undefined") return DEFAULT_BYOK_MODEL;
  try {
    return window.localStorage.getItem(BYOK_MODEL_STORAGE_KEY) || DEFAULT_BYOK_MODEL;
  } catch {
    return DEFAULT_BYOK_MODEL;
  }
}

export function storeKey(key: string, model: string) {
  try {
    if (key) {
      window.localStorage.setItem(BYOK_STORAGE_KEY, key);
    } else {
      window.localStorage.removeItem(BYOK_STORAGE_KEY);
    }

    if (model && model !== DEFAULT_BYOK_MODEL) {
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

const SYSTEM_PROMPT =
  "你是一个视频字幕翻译器。把每条字幕自然地翻译成简体中文，保留原始顺序和 id，" +
  "不要合并或拆分条目，不要添加解释。只返回 JSON。";

async function translateBatch(
  batch: TranslatableSegment[],
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<Map<string, string>> {
  let response: Response;

  try {
    response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              instruction: '返回 {"items":[{"id":"<原 id>","text":"<中文译文>"}]}',
              items: batch.map((segment) => ({ id: segment.id, text: segment.sourceText }))
            })
          }
        ]
      })
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    // OpenAI 在 key 无效时由边缘直接拒绝，响应里没有 CORS 头，浏览器只会抛出
    // 一个笼统的网络错误。这里把它翻译成用户真正需要知道的信息。
    throw new BrowserTranslateError(
      "无法连接 OpenAI。通常是 API key 不正确，也可能是网络或浏览器插件拦截了请求。"
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new BrowserTranslateError("API key 无效，请检查后重新填写。");
    }
    if (response.status === 429) {
      throw new BrowserTranslateError("触发了 OpenAI 的速率限制或余额不足，请稍后再试。");
    }

    throw new BrowserTranslateError(`OpenAI 返回错误（HTTP ${response.status}）。`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new BrowserTranslateError("OpenAI 没有返回可用内容。");
  }

  let parsed: { items?: Array<{ id?: string; text?: string }> };
  try {
    parsed = JSON.parse(content) as typeof parsed;
  } catch {
    throw new BrowserTranslateError("OpenAI 返回的内容不是合法 JSON。");
  }

  const result = new Map<string, string>();
  for (const item of parsed.items ?? []) {
    if (item.id && typeof item.text === "string" && item.text.trim()) {
      result.set(item.id, item.text.trim());
    }
  }

  return result;
}

export type TranslateProgress = {
  done: number;
  total: number;
};

/**
 * 翻译全部字幕。返回按输入顺序对应的译文数组，翻译失败的条目保留原文。
 */
export async function translateSegmentsInBrowser(
  segments: TranslatableSegment[],
  options: {
    apiKey: string;
    model?: string;
    signal?: AbortSignal;
    onProgress?: (progress: TranslateProgress) => void;
  }
): Promise<{ translations: string[]; translatedCount: number }> {
  const { apiKey, model = DEFAULT_BYOK_MODEL, signal, onProgress } = options;

  if (!apiKey) {
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
        const result = await translateBatch(batch, apiKey, model, signal);

        for (const [id, text] of result) {
          merged.set(id, text);
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
