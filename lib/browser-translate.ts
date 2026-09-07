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
/**
 * 预设只是帮你把地址和模型名填好，不是限制。
 * 任何提供 OpenAI 兼容 chat completions 接口的服务都能用 —— 选「自定义」填地址即可，
 * 包括 Moonshot、Groq、OpenRouter，以及本机跑的 Ollama。
 *
 * 按任务分模型：翻译是机械转换，便宜模型足够；章节划分和选中解释是判断题，
 * 值得用中档模型。两者单价能差十倍，而质量差异只体现在后者。
 */
export const PRESETS = {
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    // 翻译走最便宜的一档就够（一部 1.5 小时访谈约 3 美分）；想更省可以改成
    // gpt-5-nano，约 2 美分。分析是判断题，值得用中档，而且每部只调一次，
    // 输出量很小，实际约 9 美分。
    translateModel: "gpt-4o-mini",
    analyzeModel: "gpt-5.6-terra",
    keysUrl: "https://platform.openai.com/api-keys",
    /** 鉴权失败时响应是否带 CORS 头，决定浏览器能否读到真实错误。 */
    readableAuthError: false
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    // deepseek-chat 已废弃，现在是 v4-flash / v4-pro。
    // 注意它按时段计价，高峰期翻倍，而高峰正是北京时间的工作日白天。
    translateModel: "deepseek-v4-flash",
    analyzeModel: "deepseek-v4-pro",
    keysUrl: "https://platform.deepseek.com/api_keys",
    readableAuthError: true
  },
  custom: {
    label: "自定义",
    baseUrl: "",
    translateModel: "",
    analyzeModel: "",
    keysUrl: "",
    readableAuthError: true
  }
} as const;

export type PresetId = keyof typeof PRESETS;

export function isPresetId(value: string): value is PresetId {
  return value in PRESETS;
}

export type AiSettings = {
  apiKey: string;
  preset: PresetId;
  baseUrl: string;
  translateModel: string;
  analyzeModel: string;
};

export const DEFAULT_PRESET: PresetId = "openai";

export function defaultSettings(preset: PresetId = DEFAULT_PRESET): AiSettings {
  const config = PRESETS[preset];
  return {
    apiKey: "",
    preset,
    baseUrl: config.baseUrl,
    translateModel: config.translateModel,
    analyzeModel: config.analyzeModel
  };
}

const SETTINGS_STORAGE_KEY = "ai-settings";

export function readSettings(): AiSettings {
  const fallback = defaultSettings();
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return fallback;

    const stored = JSON.parse(raw) as Partial<AiSettings>;
    const preset = isPresetId(stored.preset ?? "") ? (stored.preset as PresetId) : DEFAULT_PRESET;
    const presetDefaults = defaultSettings(preset);

    return {
      apiKey: typeof stored.apiKey === "string" ? stored.apiKey : "",
      preset,
      baseUrl: stored.baseUrl || presetDefaults.baseUrl,
      translateModel: stored.translateModel || presetDefaults.translateModel,
      analyzeModel: stored.analyzeModel || presetDefaults.analyzeModel
    };
  } catch {
    return fallback;
  }
}

export function storeSettings(settings: AiSettings) {
  try {
    if (settings.apiKey) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } else {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  } catch {
    // 无痕窗口等场景下存不住，本次会话内仍然可用。
  }
}

/**
 * 一次请求塞多少条字幕。
 * 一部 1.5 小时访谈约 1500 条：每批 20 条要发 77 次，每批 40 条只要 39 次。
 * 当前模型的上下文窗口远大于此，大批次不会有问题。
 */
const BATCH_SIZE = 40;
/**
 * 同时在飞的请求数。
 * 实测一批 40 条约 9-10 秒，一部 1300 条的访谈按并发 4 要跑 9 轮、约一分半。
 * 提到 8 之后约五轮。再高就要看服务商的速率限制了。
 */
const CONCURRENCY = 8;

export type TranslatableSegment = {
  id: string;
  sourceText: string;
};

export class BrowserTranslateError extends Error {}

/**
 * 记住哪些模型拒绝 temperature。
 *
 * 较新的模型只接受默认温度，传 0 会直接 400。但确定性对翻译是有价值的，
 * 所以不一刀切地不传 —— 先带上，被拒绝后记下来并重试一次，之后对这个模型
 * 就不再带。这样支持的模型保留确定性，不支持的也能用。
 */
const modelsRejectingTemperature = new Set<string>();

function isTemperatureRejection(message: string) {
  return message.includes("temperature") && message.includes("does not support");
}

/** 只显示首尾，中间打码，避免在界面上完整暴露 key。 */
export function maskKey(key: string) {
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 7)}••••${key.slice(-4)}`;
}

/** 一次调用需要的最小配置：地址、key、这个任务用哪个模型。 */
export type CallConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** 只用于错误文案，让提示能说清是哪家出的问题。 */
  label?: string;
  readableAuthError?: boolean;
};

/** 从设置里取出「翻译」这个任务要用的调用配置。 */
export function translateConfig(settings: AiSettings): CallConfig {
  return {
    apiKey: settings.apiKey,
    baseUrl: settings.baseUrl,
    model: settings.translateModel,
    label: PRESETS[settings.preset].label,
    readableAuthError: PRESETS[settings.preset].readableAuthError
  };
}

/** 章节划分与选中解释共用「分析」模型。 */
export function analyzeConfig(settings: AiSettings): CallConfig {
  return {
    apiKey: settings.apiKey,
    baseUrl: settings.baseUrl,
    model: settings.analyzeModel,
    label: PRESETS[settings.preset].label,
    readableAuthError: PRESETS[settings.preset].readableAuthError
  };
}

/**
 * 调用一次 chat completion，要求返回 JSON 对象。
 * 翻译、章节划分、选中解释都走这里，只是 prompt 不同。
 */
async function callChatJson<T>(
  config: CallConfig,
  systemPrompt: string,
  userPayload: unknown,
  signal?: AbortSignal
): Promise<T> {
  const label = config.label || "AI 服务";
  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  let response: Response;

  if (!config.model) {
    throw new BrowserTranslateError("还没有填写模型名。");
  }

  const buildBody = (withTemperature: boolean) =>
    JSON.stringify({
      model: config.model,
      ...(withTemperature ? { temperature: 0 } : {}),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: typeof userPayload === "string" ? userPayload : JSON.stringify(userPayload)
        }
      ]
    });

  const send = (withTemperature: boolean) =>
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      signal,
      body: buildBody(withTemperature)
    });

  try {
    response = await send(!modelsRejectingTemperature.has(config.model));

    // 模型拒绝 temperature 时记下来并立刻重试，用户不会看到这次失败。
    if (response.status === 400 && !modelsRejectingTemperature.has(config.model)) {
      const detail = await response.clone().text();
      if (isTemperatureRejection(detail)) {
        modelsRejectingTemperature.add(config.model);
        response = await send(false);
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    // OpenAI 在鉴权失败时由边缘直接拒绝，响应里没有 CORS 头，浏览器只能抛出一个
    // 笼统的网络错误。DeepSeek 会带 CORS 头，所以那边能读到真实原因。
    throw new BrowserTranslateError(
      config.readableAuthError
        ? `无法连接 ${label}，请检查接口地址和网络后重试。`
        : `无法连接 ${label}。通常是 API key 不正确，也可能是接口地址填错或被浏览器插件拦截。`
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
        detail || `${label} 的 API key 无效，请检查后重新填写。`
      );
    }
    if (response.status === 429) {
      throw new BrowserTranslateError(
        detail || `触发了 ${label} 的速率限制或余额不足，请稍后再试。`
      );
    }

    throw new BrowserTranslateError(
      detail || `${label} 返回错误（HTTP ${response.status}）。`
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new BrowserTranslateError(`${label} 没有返回可用内容。`);
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new BrowserTranslateError(`${label} 返回的内容不是合法 JSON。`);
  }
}

const TRANSLATE_PROMPT =
  "你是一个视频字幕翻译器。把每条字幕自然地翻译成简体中文，保留原始顺序和 id，" +
  "不要合并或拆分条目，不要添加解释。只返回 JSON。";

export type TranslateProgress = {
  done: number;
  total: number;
};

/** 每批完成后回传的新译文，key 是字幕 id。 */
export type PartialTranslations = Record<string, string>;

/**
 * 翻译全部字幕。返回按输入顺序对应的译文数组，翻译失败的条目保留原文。
 */
export async function translateSegmentsInBrowser(
  segments: TranslatableSegment[],
  options: CallConfig & {
    signal?: AbortSignal;
    onProgress?: (progress: TranslateProgress) => void;
    /** 每批完成就回传，让界面可以边翻边显示，而不是全部翻完才出现。 */
    onPartial?: (partial: PartialTranslations) => void;
  }
): Promise<{ translations: string[]; translatedCount: number }> {
  const { signal, onProgress, onPartial, ...config } = options;

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

        const fresh: PartialTranslations = {};
        for (const item of result.items ?? []) {
          if (item.id && typeof item.text === "string" && item.text.trim()) {
            const text = item.text.trim();
            merged.set(item.id, text);
            fresh[item.id] = text;
          }
        }

        if (Object.keys(fresh).length > 0) {
          onPartial?.(fresh);
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

/**
 * 章节划分一次能读多少字符。
 * 一部 1.5 小时访谈约 14 万字符（约 3.6 万 token），当前模型的上下文窗口装得下，
 * 所以预算给足 —— 抽样太稀会让章节分界判断得很粗。超过预算才按比例抽样。
 */
const OVERVIEW_CHAR_BUDGET = 80000;

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
  options: CallConfig & { signal?: AbortSignal }
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

/* ==========================================================================
   选中文本解释
   ========================================================================== */

export type Explanation = {
  meaning: string;
  notes: string[];
};

const EXPLAIN_PROMPT =
  "你是一个语言学习助手。用户会给你一小段视频字幕，以及它在视频里的上下文。" +
  "解释这段话在这个语境下的意思，指出其中的固定搭配、俚语、文化梗或语法难点。" +
  "简明扼要，不要复述原文，不要长篇大论。全部使用简体中文。只返回 JSON。";

/**
 * 解释选中的字幕片段。
 *
 * 一定要带上下文：脱离语境时 "get it" 这类短语可以有十几种解释，模型只能猜。
 */
export async function explainSelection(
  params: { selection: string; context: string },
  options: CallConfig & { signal?: AbortSignal }
): Promise<Explanation> {
  const { signal, ...config } = options;

  if (!config.apiKey) {
    throw new BrowserTranslateError("还没有填写 API key。");
  }

  if (!params.selection.trim()) {
    throw new BrowserTranslateError("请先选中一段字幕。");
  }

  const result = await callChatJson<{ meaning?: string; notes?: unknown }>(
    config,
    EXPLAIN_PROMPT,
    {
      instruction:
        '返回 {"meaning":"这句话在此语境下的意思","notes":["值得注意的用法或文化背景"]}。' +
        "notes 最多 4 条，没有可写的就返回空数组。",
      selection: params.selection,
      context: params.context
    },
    signal
  );

  return {
    meaning: typeof result.meaning === "string" ? result.meaning : "",
    notes: Array.isArray(result.notes)
      ? result.notes.filter((note): note is string => typeof note === "string" && note.trim() !== "").slice(0, 4)
      : []
  };
}
