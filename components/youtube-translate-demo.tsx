"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  YouTubeTranscriptResultSchema,
  YouTubeTranslationResultSchema,
  type YouTubeTranslationResult
} from "@/lib/youtube-agent/contracts";
import {
  BrowserTranslateError,
  PRESETS,
  analyzeConfig,
  askAboutContent,
  buildQuiz,
  buildVideoOverview,
  defaultSettings,
  explainSelection,
  maskKey,
  readSettings,
  storeSettings,
  translateConfig,
  translateSegmentsInBrowser,
  type AiSettings,
  type ContentAnswer,
  type Explanation,
  type QuizQuestion,
  type PresetId,
  type TranslateProgress,
  type VideoOverview
} from "@/lib/browser-translate";
import { buildSrt } from "@/lib/srt";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
};

/** 字幕区的三种阅读方式。 */
type CaptionView = "both" | "zh" | "source";

type SavedNote = {
  id: string;
  startMs: number;
  zh: string;
  source: string;
};

const NOTES_STORAGE_PREFIX = "caption-notes:";

/** 读取某个视频已保存的笔记。localStorage 在无痕窗口或禁用站点数据时会抛错。 */
function readStoredNotes(key: string): SavedNote[] {
  if (!key || typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedNote[]) : [];
  } catch {
    return [];
  }
}

/** 把毫秒格式化成 mm:ss，超过一小时补上小时位。 */
function formatTimestamp(ms: number) {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

type YouTubeNamespace = {
  Player: new (
    target: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number>;
    }
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const demoExamples = [
  {
    label: "Rick Astley 官方 MV",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    sourceLanguage: "en"
  },
  {
    label: "OpenAI DevDay 示例",
    url: "https://www.youtube.com/watch?v=U9mJuUkhUzk",
    sourceLanguage: "en"
  }
];

let youTubeApiLoader: Promise<void> | null = null;

function formatTranslationMode(mode: YouTubeTranslationResult["translationMode"]) {
  return mode === "openai" ? "增强翻译" : "标准翻译";
}

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youTubeApiLoader) {
    return youTubeApiLoader;
  }

  youTubeApiLoader = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("YouTube iframe API failed to load"));
    document.head.appendChild(script);
  });

  return youTubeApiLoader;
}

export function YouTubeTranslateDemo() {
  const [url, setUrl] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [result, setResult] = useState<YouTubeTranslationResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [playerVersion, setPlayerVersion] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [captionView, setCaptionView] = useState<CaptionView>("both");
  const [query, setQuery] = useState("");
  const [matchCursor, setMatchCursor] = useState(0);
  const [notesState, setNotesState] = useState<{ key: string; items: SavedNote[] }>({
    key: "",
    items: []
  });
  // key 只存在浏览器里，首次渲染用惰性初始化读取，避免服务端渲染时访问 localStorage。
  // 设置只存在浏览器里，惰性初始化避免服务端渲染时访问 localStorage。
  const [settings, setSettings] = useState<AiSettings>(() => readSettings());
  const [draft, setDraft] = useState<AiSettings>(() => ({ ...readSettings(), apiKey: "" }));
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [progress, setProgress] = useState<TranslateProgress | null>(null);
  const [overview, setOverview] = useState<VideoOverview | null>(null);
  const [overviewState, setOverviewState] = useState<"idle" | "loading" | "error">("idle");
  const [overviewError, setOverviewError] = useState("");
  const [selection, setSelection] = useState("");
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [explainState, setExplainState] = useState<"idle" | "loading" | "error">("idle");
  const [explainError, setExplainError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ContentAnswer | null>(null);
  const [askState, setAskState] = useState<"idle" | "loading" | "error">("idle");
  const [askError, setAskError] = useState("");
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizPicks, setQuizPicks] = useState<Record<number, number>>({});
  const [quizState, setQuizState] = useState<"idle" | "loading" | "error">("idle");
  const [quizError, setQuizError] = useState("");
  const [trial, setTrial] = useState<{
    enabled: boolean;
    available: boolean;
    remaining: number;
    maxSegments: number;
  } | null>(null);
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const lastSpokenSegmentRef = useRef<string | null>(null);

  /**
   * 有自带 key 时：服务端只取原文，翻译在浏览器里用访客自己的 key 完成。
   *
   * 字幕一到就先渲染出来，译文逐批填进去。一部 1.5 小时的访谈要翻好几分钟，
   * 让人对着白屏等完是不可接受的。
   */
  async function translateWithOwnKey(nextUrl: string, nextSourceLanguage: string) {
    const response = await fetch("/api/v1/youtube/transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: nextUrl, sourceLanguage: nextSourceLanguage })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || payload.error || "字幕读取失败");
    }

    const parsed = YouTubeTranscriptResultSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error("服务端返回结构异常，请稍后再试。");
    }

    const transcript = parsed.data;

    // 先把原文摆出来，用户马上能看、能搜、能跳转。
    const base: YouTubeTranslationResult = YouTubeTranslationResultSchema.parse({
      videoId: transcript.videoId,
      videoUrl: transcript.videoUrl,
      title: transcript.title,
      description: transcript.description,
      sourceLanguage: transcript.sourceLanguage,
      sourceTrackLabel: transcript.sourceTrackLabel,
      translationMode: "openai",
      warnings: transcript.warnings,
      takeaways: [],
      availableTracks: transcript.availableTracks,
      segments: transcript.segments.map((segment) => ({
        ...segment,
        translatedText: segment.sourceText
      })),
      srt: ""
    });

    setResult(base);
    setProgress({ done: 0, total: transcript.segments.length });

    const { translations, translatedCount } = await translateSegmentsInBrowser(
      transcript.segments.map((segment) => ({ id: segment.id, sourceText: segment.sourceText })),
      {
        ...translateConfig(settings),
        onProgress: setProgress,
        onPartial: (partial) =>
          setResult((current) =>
            current
              ? {
                  ...current,
                  segments: current.segments.map((segment) =>
                    partial[segment.id]
                      ? { ...segment, translatedText: partial[segment.id] }
                      : segment
                  )
                }
              : current
          )
      }
    );

    if (translatedCount === 0) {
      throw new BrowserTranslateError("一条字幕都没有翻译成功，请检查 API key 或稍后再试。");
    }

    const segments = transcript.segments.map((segment, index) => ({
      ...segment,
      translatedText: translations[index] || segment.sourceText
    }));

    const untranslated = segments.filter(
      (segment) => segment.translatedText.trim() === segment.sourceText.trim()
    ).length;

    const warnings = [...transcript.warnings];
    if (untranslated > 0) {
      warnings.push(`有 ${untranslated} 条字幕未能翻译，已保留原文。`);
    }

    return YouTubeTranslationResultSchema.parse({
      ...base,
      warnings,
      segments,
      srt: buildSrt(segments)
    });
  }

  /** 没有自带 key 时走服务端整条链路。 */
  async function translateOnServer(nextUrl: string, nextSourceLanguage: string) {
    const response = await fetch("/api/youtube-translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: nextUrl, sourceLanguage: nextSourceLanguage })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || payload.error || "翻译请求失败");
    }

    const parsed = YouTubeTranslationResultSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error("服务端返回结构异常，请稍后再试。");
    }

    // 用掉一次试用，刷新剩余数。
    setTrial((current) =>
      current
        ? { ...current, remaining: Math.max(0, current.remaining - 1), available: current.remaining > 1 }
        : current
    );

    return parsed.data;
  }

  async function submit(nextUrl = url, nextSourceLanguage = sourceLanguage) {
    setIsSubmitting(true);
    setError("");
    setActiveSegmentIndex(-1);
    setProgress(null);
    setOverview(null);
    setOverviewState("idle");
    setOverviewError("");
    setSelection("");
    setExplanation(null);
    setExplainState("idle");
    setExplainError("");
    setAnswer(null);
    setAskState("idle");
    setAskError("");
    setQuiz(null);
    setQuizPicks({});
    setQuizState("idle");
    setQuizError("");
    lastSpokenSegmentRef.current = null;

    try {
      setResult(
        settings.apiKey
          ? await translateWithOwnKey(nextUrl, nextSourceLanguage)
          : await translateOnServer(nextUrl, nextSourceLanguage)
      );
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "未知错误";
      // 字幕已经渲染出来时不要清空：长视频翻到一半失败，用户至少还能看原文和已翻的部分。
      setResult((current) => current);
      setError(message);
    } finally {
      setIsSubmitting(false);
      setProgress(null);
    }
  }

  function downloadSrt() {
    if (!result) {
      return;
    }

    const blob = new Blob([result.srt], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${result.videoId}-zh.srt`;

    // Safari and Firefox need the anchor in the document, and revoking the URL
    // in the same tick can cancel a download that has not started yet.
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  const speakCurrentSegment = useCallback(() => {
    if (!result || activeSegmentIndex < 0 || !("speechSynthesis" in window)) {
      return;
    }

    const segment = result.segments[activeSegmentIndex];
    const utterance = new SpeechSynthesisUtterance(segment.translatedText);
    const selectedVoice = voices.find((voice) => voice.name === selectedVoiceName) ?? voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = "zh-CN";
    }

    utterance.rate = 1.02;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [activeSegmentIndex, result, selectedVoiceName, voices]);

  // 查一次试用额度，用来决定没有 key 时该显示什么。
  useEffect(() => {
    let cancelled = false;

    fetch("/api/v1/health")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && payload?.trial) {
          setTrial(payload.trial);
        }
      })
      .catch(() => {
        // 查不到就当没有试用额度，不影响自带 key 的使用。
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const syncVoices = () => {
      const nextVoices = window.speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.toLowerCase().startsWith("zh"));

      setVoices(nextVoices);
      setSelectedVoiceName((current) => current || nextVoices[0]?.name || "");
    };

    syncVoices();
    window.speechSynthesis.onvoiceschanged = syncVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const videoId = result?.videoId;

  useEffect(() => {
    if (!videoId || !playerHostRef.current) {
      return;
    }

    let cancelled = false;

    void loadYouTubeIframeApi()
      .then(() => {
        if (cancelled || !playerHostRef.current || !window.YT?.Player) {
          return;
        }

        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        playerHostRef.current.innerHTML = "";
        playerRef.current = new window.YT.Player(playerHostRef.current, {
          videoId,
          playerVars: {
            playsinline: 1,
            rel: 0
          }
        });
        setPlayerVersion((version) => version + 1);
      })
      .catch((iframeError) => {
        const message = iframeError instanceof Error ? iframeError.message : "播放器初始化失败";
        setError(message);
      });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!result || !playerRef.current || playerVersion === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      const currentTimeMs = Math.floor((playerRef.current?.getCurrentTime() ?? 0) * 1000);
      const nextIndex = result.segments.findIndex(
        (segment) => currentTimeMs >= segment.startMs && currentTimeMs <= segment.endMs + 250
      );

      setActiveSegmentIndex((current) => (current === nextIndex ? current : nextIndex));
    }, 300);

    return () => {
      window.clearInterval(timer);
    };
  }, [playerVersion, result]);

  useEffect(() => {
    if (!result || activeSegmentIndex < 0) {
      return;
    }

    document.getElementById(result.segments[activeSegmentIndex].id)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [activeSegmentIndex, result]);

  useEffect(() => {
    if (!autoSpeak || !result || activeSegmentIndex < 0 || !("speechSynthesis" in window)) {
      return;
    }

    const segment = result.segments[activeSegmentIndex];
    if (lastSpokenSegmentRef.current === segment.id) {
      return;
    }

    lastSpokenSegmentRef.current = segment.id;
    speakCurrentSegment();
  }, [activeSegmentIndex, autoSpeak, result, speakCurrentSegment]);

  useEffect(() => {
    if (!autoSpeak && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [autoSpeak]);

  // --- 字幕搜索 ---------------------------------------------------------
  const normalizedQuery = query.trim().toLowerCase();
  const matches = normalizedQuery
    ? (result?.segments ?? []).reduce<number[]>((acc, segment, index) => {
        const haystack = `${segment.translatedText} ${segment.sourceText}`.toLowerCase();
        if (haystack.includes(normalizedQuery)) {
          acc.push(index);
        }
        return acc;
      }, [])
    : [];

  function scrollToSegment(index: number) {
    const segment = result?.segments[index];
    if (!segment) {
      return;
    }

    document.getElementById(segment.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function stepMatch(delta: number) {
    if (matches.length === 0) {
      return;
    }

    const next = (matchCursor + delta + matches.length) % matches.length;
    setMatchCursor(next);
    scrollToSegment(matches[next]);
  }

  // --- 点击字幕跳转视频 --------------------------------------------------
  function seekToSegment(startMs: number) {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    player.seekTo(startMs / 1000, true);
    player.playVideo();
  }

  // --- 时间戳笔记 --------------------------------------------------------
  const notesKey = result ? `${NOTES_STORAGE_PREFIX}${result.videoId}` : "";

  // 换视频时在渲染期直接派生新状态，而不是用 effect 事后同步 —— 后者会多一次
  // 级联渲染，还会先闪一帧上一个视频的笔记。
  if (notesState.key !== notesKey) {
    setNotesState({ key: notesKey, items: readStoredNotes(notesKey) });
  }

  const notes = notesState.items;

  function persistNotes(next: SavedNote[]) {
    setNotesState({ key: notesKey, items: next });

    if (!notesKey) {
      return;
    }

    try {
      window.localStorage.setItem(notesKey, JSON.stringify(next));
    } catch {
      // 存不下就只保留在本次会话里，不打断使用。
    }
  }

  function toggleNote(segmentId: string) {
    const segment = result?.segments.find((item) => item.id === segmentId);
    if (!segment) {
      return;
    }

    const existing = notes.find((note) => note.id === segmentId);
    persistNotes(
      existing
        ? notes.filter((note) => note.id !== segmentId)
        : [
            ...notes,
            {
              id: segment.id,
              startMs: segment.startMs,
              zh: segment.translatedText,
              source: segment.sourceText
            }
          ].sort((left, right) => left.startMs - right.startMs)
    );
  }

  function exportNotes() {
    if (!result || notes.length === 0) {
      return;
    }

    const lines = [
      `# ${result.title}`,
      "",
      result.videoUrl,
      "",
      ...notes.flatMap((note) => [
        `## ${formatTimestamp(note.startMs)}`,
        "",
        note.zh,
        "",
        `> ${note.source}`,
        ""
      ])
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${result.videoId}-notes.md`;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  const captionAreaRef = useRef<HTMLDivElement | null>(null);

  /** 记录用户在字幕区选中的文本，供解释功能使用。 */
  function captureSelection() {
    const active = window.getSelection();
    const text = active?.toString().trim() ?? "";

    // 单个字符多半是误触，不值得提示可以解释。
    if (text.length <= 1) {
      return;
    }

    // getSelection 返回的是整个文档的选区，可能落在字幕区之外（比如旁边的
    // 说明文字）。只接受确实在字幕里的选择，否则会去解释无关的界面文案。
    const anchor = active?.anchorNode;
    if (!anchor || !captionAreaRef.current?.contains(anchor)) {
      return;
    }

    setSelection(text);
  }

  async function explainCurrentSelection() {
    if (!result || !settings.apiKey || !selection) {
      return;
    }

    setExplainState("loading");
    setExplainError("");
    setExplanation(null);

    // 带上前后各若干条字幕作为语境：脱离上下文时很多短语没法判断意思。
    const anchor = result.segments.findIndex(
      (segment) =>
        segment.sourceText.includes(selection) || segment.translatedText.includes(selection)
    );
    const from = anchor >= 0 ? Math.max(0, anchor - 3) : 0;
    const context = result.segments
      .slice(from, from + 7)
      .map((segment) => segment.sourceText)
      .join(" ");

    try {
      setExplanation(
        await explainSelection({ selection, context }, analyzeConfig(settings))
      );
      setExplainState("idle");
    } catch (error) {
      setExplainState("error");
      setExplainError(error instanceof Error ? error.message : "解释失败");
    }
  }

  /** 给 AI 的字幕：优先用译文，没翻到的退回原文。 */
  function captionsForAi() {
    return (result?.segments ?? []).map((segment) => ({
      startMs: segment.startMs,
      text: segment.translatedText || segment.sourceText
    }));
  }

  async function submitQuestion() {
    if (!result || !settings.apiKey || !question.trim()) {
      return;
    }

    setAskState("loading");
    setAskError("");

    try {
      setAnswer(
        await askAboutContent({ question, segments: captionsForAi() }, analyzeConfig(settings))
      );
      setAskState("idle");
    } catch (error) {
      setAskState("error");
      setAskError(error instanceof Error ? error.message : "提问失败");
    }
  }

  async function generateQuiz() {
    if (!result || !settings.apiKey) {
      return;
    }

    setQuizState("loading");
    setQuizError("");
    setQuizPicks({});

    try {
      setQuiz(await buildQuiz(captionsForAi(), analyzeConfig(settings)));
      setQuizState("idle");
    } catch (error) {
      setQuizState("error");
      setQuizError(error instanceof Error ? error.message : "出题失败");
    }
  }

  async function generateOverview() {
    if (!result || !settings.apiKey) {
      return;
    }

    setOverviewState("loading");
    setOverviewError("");

    try {
      setOverview(
        await buildVideoOverview(
          result.segments.map((segment) => ({
            startMs: segment.startMs,
            text: segment.translatedText || segment.sourceText
          })),
          analyzeConfig(settings)
        )
      );
      setOverviewState("idle");
    } catch (error) {
      setOverviewState("error");
      setOverviewError(error instanceof Error ? error.message : "生成失败");
    }
  }

  const canSubmit = url.trim().length > 0;
  const progressPercent = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  const progressNote = progress ? (
    <div className="section">
      <p className="muted form-helper">
        正在用你自己的 key 翻译：{progress.done} / {progress.total} 条（{progressPercent}%）
      </p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  ) : null;

  return (
    <div className="section-grid youtube-demo-grid">
      <div className="panel span-4">
        <div className="section-header section-header-inline">
          <div>
            <span className="section-kicker">Input</span>
            <h2 className="panel-title">粘贴 YouTube 链接</h2>
          </div>
        </div>
        <p className="muted search-panel-copy">
          支持大多数带公开字幕的公开视频。翻译完成后，你可以一边看视频，一边看中文字幕，也可以打开中文朗读。
        </p>

        <div className="byok-box">
          <div className="byok-head">
            <span className="section-kicker">
              {settings.apiKey
                ? `已连接 ${PRESETS[settings.preset].label} · ${maskKey(settings.apiKey)}`
                : trial?.available
                  ? `可以直接试用，今天还剩 ${trial.remaining} 次`
                  : trial?.enabled
                    ? "今天的免费试用已用完，填入自己的 key 可继续使用"
                    : "翻译与 AI 功能需要你自己的 API key"}
            </span>
            <button
              className="ghost-button"
              onClick={() => {
                setDraft({ ...settings, apiKey: "" });
                setShowKeyPanel((open) => !open);
              }}
              type="button"
            >
              {showKeyPanel ? "收起" : settings.apiKey ? "更改设置" : "填写 key"}
            </button>
          </div>

          {showKeyPanel ? (
            <div className="byok-panel">
              <p className="muted form-helper">
                这些设置只保存在你这台设备的浏览器里，请求由你的浏览器直接发给服务商，
                <strong>不会经过这个网站的服务器</strong>。你可以打开浏览器网络面板自己核实。
              </p>

              <label>
                服务商
                <select
                  onChange={(event) => {
                    const preset = event.target.value as PresetId;
                    // 换服务商时地址和模型一起换，否则会拿旧模型名请求新端点。
                    const presetDefaults = defaultSettings(preset);
                    setDraft((current) => ({
                      ...presetDefaults,
                      apiKey: current.apiKey
                    }));
                  }}
                  value={draft.preset}
                >
                  {Object.entries(PRESETS).map(([id, config]) => (
                    <option key={id} value={id}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                API key
                <input
                  autoComplete="off"
                  onChange={(event) => setDraft((c) => ({ ...c, apiKey: event.target.value }))}
                  placeholder={settings.apiKey ? "留空则保留现有 key" : "sk-..."}
                  spellCheck={false}
                  type="password"
                  value={draft.apiKey}
                />
              </label>

              <label>
                接口地址
                <input
                  onChange={(event) => setDraft((c) => ({ ...c, baseUrl: event.target.value }))}
                  placeholder="https://api.openai.com/v1"
                  spellCheck={false}
                  value={draft.baseUrl}
                />
              </label>

              <p className="muted form-helper">
                下面两个模型分开填是有意的：翻译是机械转换，便宜模型就够；章节和解释是判断题，
                值得用好一点的。两者单价可以差十倍，而质量差异只体现在后者。
              </p>

              <label>
                翻译模型（高频、便宜）
                <input
                  onChange={(event) =>
                    setDraft((c) => ({ ...c, translateModel: event.target.value }))
                  }
                  placeholder="gpt-5.6-luna"
                  spellCheck={false}
                  value={draft.translateModel}
                />
              </label>

              <label>
                分析模型（章节速览与选中解释）
                <input
                  onChange={(event) =>
                    setDraft((c) => ({ ...c, analyzeModel: event.target.value }))
                  }
                  placeholder="gpt-5.6-terra"
                  spellCheck={false}
                  value={draft.analyzeModel}
                />
              </label>

              <div className="button-row portfolio-link-row">
                <button
                  className="primary-button"
                  disabled={!draft.apiKey.trim() && !settings.apiKey}
                  onClick={() => {
                    // key 留空表示沿用已保存的那个，方便只改模型不重填 key。
                    const next: AiSettings = {
                      ...draft,
                      apiKey: draft.apiKey.trim() || settings.apiKey
                    };
                    setSettings(next);
                    storeSettings(next);
                    setDraft({ ...next, apiKey: "" });
                    setShowKeyPanel(false);
                  }}
                  type="button"
                >
                  保存
                </button>
                {settings.apiKey ? (
                  <button
                    className="ghost-button"
                    onClick={() => {
                      const cleared = defaultSettings();
                      setSettings(cleared);
                      storeSettings(cleared);
                      setDraft(cleared);
                      setShowKeyPanel(false);
                    }}
                    type="button"
                  >
                    清除已保存的设置
                  </button>
                ) : null}
                {PRESETS[draft.preset].keysUrl ? (
                  <a
                    className="ghost-button"
                    href={PRESETS[draft.preset].keysUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    去 {PRESETS[draft.preset].label} 创建 key
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="search-form">
          <div className="youtube-form-grid">
            <label>
              YouTube URL
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>

            <label>
              原字幕语言代码
              <input
                value={sourceLanguage}
                onChange={(event) => setSourceLanguage(event.target.value)}
                placeholder="留空自动，常用 en / ja / ko"
              />
            </label>
          </div>

          <div className="button-row">
            <button
              className="primary-button"
              disabled={!canSubmit || isSubmitting}
              onClick={() => void submit()}
              type="button"
            >
              {isSubmitting ? "翻译中..." : "开始翻译"}
            </button>
            <span className="muted form-helper">
              {settings.apiKey
                ? "翻译会用你自己的 key 在浏览器里完成，费用计入你的账户，长度不限。"
                : trial?.available
                  ? `免费试用会翻译前 ${trial.maxSegments} 条字幕（约 10 分钟）。想翻全片，填入自己的 API key 即可。`
                  : "字幕读取始终免费；翻译需要填写上方的 API key。"}
            </span>
          </div>

          {progressNote}

          <div className="example-block">
            <p className="example-label">快速试试</p>
            <div className="chip-row">
              {demoExamples.map((example) => (
                <button
                  className="chip"
                  key={example.label}
                  onClick={() => {
                    setUrl(example.url);
                    setSourceLanguage(example.sourceLanguage);
                    void submit(example.url, example.sourceLanguage);
                  }}
                  type="button"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="callout section">
          <strong>支持范围</strong>
          <p className="muted">
            当前适合带公开字幕的 YouTube 视频。翻译完成后可以下载中文字幕，也可以用浏览器自带中文语音跟着当前句子朗读。
          </p>
        </div>
      </div>

      <div className="span-8">
        {error ? (
          <div className="panel error-panel">
            <h2 className="panel-title">翻译失败</h2>
            <p className="muted">{error}</p>
            <ul className="stack-list section">
              <li>先试试公开视频或官方频道视频，成功率通常更高。</li>
              <li>如果视频本身没有公开字幕，当前还不能直接生成整段翻译。</li>
            </ul>
          </div>
        ) : null}

        {!result && !error ? (
          <div className="panel empty-state">
            <h2 className="panel-title">翻译结果会显示在这里</h2>
            <p className="muted">
              这里会出现播放器、中文字幕、原文对照、SRT 下载按钮，以及中文朗读开关。
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="youtube-results-stack">
            <div className="panel">
              <div className="result-header">
                <div className="result-intro">
                  <div className="meta-row">
                    <span className="meta-pill">字幕语言：{result.sourceLanguage}</span>
                    <span className="meta-pill">轨道：{result.sourceTrackLabel}</span>
                    <span className="meta-pill">翻译模式：{formatTranslationMode(result.translationMode)}</span>
                  </div>
                  <h2 className="panel-title">{result.title}</h2>
                  <p className="result-summary muted">
                    共有 {result.segments.length} 条对齐字幕。你可以一边播放原视频，一边看中文对照；如果想省力一点，再打开中文朗读。
                  </p>
                </div>

                <div className="button-row">
                  <a className="ghost-button" href={result.videoUrl} rel="noreferrer" target="_blank">
                    打开原视频
                  </a>
                  <button className="ghost-button" onClick={downloadSrt} type="button">
                    下载中文字幕 SRT
                  </button>
                  <button
                    className="ghost-button"
                    disabled={activeSegmentIndex < 0}
                    onClick={speakCurrentSegment}
                    type="button"
                  >
                    朗读当前句
                  </button>
                </div>
              </div>

              {result.summary ? (
                <div className="callout section">
                  <strong>中文重点速览</strong>
                  <p className="muted">{result.summary}</p>
                  {result.takeaways.length > 0 ? (
                    <ul className="stack-list section">
                      {result.takeaways.map((takeaway) => (
                        <li key={takeaway}>{takeaway}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {result.warnings.length > 0 ? (
                <div className="callout section">
                  <strong>系统提示</strong>
                  <ul className="stack-list section">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="youtube-layout section">
                <div className="video-shell">
                  <div className="video-frame" ref={playerHostRef} />
                </div>

                <div className="panel youtube-side-panel">
                  <div className="section-header section-header-inline">
                    <div>
                      <span className="section-kicker">Voice</span>
                      <h3 className="panel-title">中文朗读</h3>
                    </div>
                  </div>

                  <div className="voice-control-stack">
                    <label className="toggle-row">
                      <input
                        checked={autoSpeak}
                        onChange={(event) => {
                          setAutoSpeak(event.target.checked);
                          lastSpokenSegmentRef.current = null;
                        }}
                        type="checkbox"
                      />
                      <span>跟着当前字幕自动朗读中文</span>
                    </label>

                    <label>
                      中文语音
                      <select
                        className="voice-select"
                        disabled={voices.length === 0}
                        onChange={(event) => setSelectedVoiceName(event.target.value)}
                        value={selectedVoiceName}
                      >
                        {voices.length === 0 ? (
                          <option value="">当前浏览器没有可用中文语音</option>
                        ) : (
                          voices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))
                        )}
                      </select>
                    </label>

                    <div className="callout">
                      <strong>可选字幕语言</strong>
                      <div className="chip-row section">
                        {result.availableTracks.map((track) => (
                          <span className="chip static-chip" key={`${track.languageCode}-${track.label}`}>
                            {track.languageCode} · {track.kind === "auto" ? "auto" : "manual"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {settings.apiKey ? (
              <div className="panel">
                <div className="section-header section-header-inline">
                  <div>
                    <span className="section-kicker">Overview</span>
                    <h2 className="panel-title">章节速览</h2>
                  </div>
                </div>

                {overview ? (
                  <>
                    {overview.summary ? <p className="section-lede">{overview.summary}</p> : null}

                    {overview.chapters.length > 0 ? (
                      <ul className="stack-list section">
                        {overview.chapters.map((chapter) => (
                          <li key={`${chapter.startMs}-${chapter.title}`}>
                            <button
                              className="caption-seek"
                              onClick={() => seekToSegment(chapter.startMs)}
                              type="button"
                            >
                              <span className="caption-time">{formatTimestamp(chapter.startMs)}</span>
                              <span className="entry-title">{chapter.title}</span>
                              {chapter.summary ? (
                                <span className="caption-source">{chapter.summary}</span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {overview.quotes.length > 0 ? (
                      <div className="section">
                        <span className="section-kicker">值得看的几句</span>
                        <ul className="stack-list">
                          {overview.quotes.map((quote) => (
                            <li key={`${quote.startMs}-${quote.text.slice(0, 12)}`}>
                              <button
                                className="caption-seek"
                                onClick={() => seekToSegment(quote.startMs)}
                                type="button"
                              >
                                <span className="caption-time">{formatTimestamp(quote.startMs)}</span>
                                <span className="caption-zh">{quote.text}</span>
                                {quote.why ? (
                                  <span className="caption-source">{quote.why}</span>
                                ) : null}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="button-row section portfolio-link-row">
                      <button className="ghost-button" onClick={generateOverview} type="button">
                        重新生成
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="muted form-helper">
                      让 AI 通读整段字幕，划出章节并挑出值得看的几句。长视频尤其有用 —— 不必从头看。
                      这一步会消耗你自己的 API 额度。
                    </p>
                    {overviewState === "error" ? (
                      <p className="muted form-helper">生成失败：{overviewError}</p>
                    ) : null}
                    <div className="button-row section portfolio-link-row">
                      <button
                        className="primary-button"
                        disabled={overviewState === "loading"}
                        onClick={generateOverview}
                        type="button"
                      >
                        {overviewState === "loading" ? "生成中..." : "生成章节速览"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {settings.apiKey ? (
              <div className="panel">
                <div className="section-header section-header-inline">
                  <div>
                    <span className="section-kicker">Ask</span>
                    <h2 className="panel-title">就这个视频提问</h2>
                  </div>
                </div>

                <p className="muted form-helper">
                  只依据字幕回答，并给出可点击的原文依据。字幕里没讲到的会直说，不会替你编。
                </p>

                <div className="ask-row section">
                  <label className="visually-hidden" htmlFor="ask-input">
                    你的问题
                  </label>
                  <input
                    id="ask-input"
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && question.trim()) {
                        event.preventDefault();
                        void submitQuestion();
                      }
                    }}
                    placeholder="比如：他对开源模型的看法是什么？"
                    value={question}
                  />
                  <button
                    className="primary-button"
                    disabled={askState === "loading" || !question.trim()}
                    onClick={submitQuestion}
                    type="button"
                  >
                    {askState === "loading" ? "思考中..." : "提问"}
                  </button>
                </div>

                {askState === "error" ? (
                  <p className="muted form-helper">提问失败：{askError}</p>
                ) : null}

                {answer ? (
                  <div className="section">
                    <p>{answer.answer}</p>
                    {answer.citations.length > 0 ? (
                      <ul className="stack-list section">
                        {answer.citations.map((citation) => (
                          <li key={`${citation.startMs}-${citation.quote.slice(0, 10)}`}>
                            <button
                              className="caption-seek"
                              onClick={() => seekToSegment(citation.startMs)}
                              type="button"
                            >
                              <span className="caption-time">
                                {formatTimestamp(citation.startMs)}
                              </span>
                              <span className="caption-source">{citation.quote}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {settings.apiKey ? (
              <div className="panel">
                <div className="section-header section-header-inline">
                  <div>
                    <span className="section-kicker">Quiz</span>
                    <h2 className="panel-title">自测一下</h2>
                  </div>
                </div>

                {quiz && quiz.length > 0 ? (
                  <>
                    <ul className="stack-list">
                      {quiz.map((item, index) => {
                        const picked = quizPicks[index];
                        const answered = picked !== undefined;

                        return (
                          <li key={item.question}>
                            <h3 className="entry-title">
                              {index + 1}. {item.question}
                            </h3>

                            <ul className="quiz-options">
                              {item.options.map((option, optionIndex) => {
                                const isAnswer = optionIndex === item.answerIndex;
                                const isPicked = picked === optionIndex;

                                return (
                                  <li key={option}>
                                    <button
                                      className={[
                                        "quiz-option",
                                        answered && isAnswer ? "is-correct" : "",
                                        answered && isPicked && !isAnswer ? "is-wrong" : ""
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                      disabled={answered}
                                      onClick={() =>
                                        setQuizPicks((current) => ({
                                          ...current,
                                          [index]: optionIndex
                                        }))
                                      }
                                      type="button"
                                    >
                                      {option}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>

                            {answered ? (
                              <div className="section">
                                {item.explanation ? (
                                  <p className="muted">{item.explanation}</p>
                                ) : null}
                                <button
                                  className="caption-seek"
                                  onClick={() => seekToSegment(item.startMs)}
                                  type="button"
                                >
                                  <span className="caption-time">
                                    {formatTimestamp(item.startMs)}
                                  </span>
                                  <span className="caption-source">跳到讲这一段的地方</span>
                                </button>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>

                    <div className="button-row section portfolio-link-row">
                      <button className="ghost-button" onClick={generateQuiz} type="button">
                        换一组题
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="muted form-helper">
                      出 5 道选择题检验你是否真的看懂了。答完会给出解析，并可以跳到讲这一段的位置。
                    </p>
                    {quizState === "error" ? (
                      <p className="muted form-helper">出题失败：{quizError}</p>
                    ) : null}
                    <div className="button-row section portfolio-link-row">
                      <button
                        className="primary-button"
                        disabled={quizState === "loading"}
                        onClick={generateQuiz}
                        type="button"
                      >
                        {quizState === "loading" ? "出题中..." : "生成自测题"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            <div className="panel">
              <div className="section-header section-header-inline">
                <div>
                  <span className="section-kicker">Captions</span>
                  <h2 className="panel-title">字幕</h2>
                </div>
              </div>

              <div className="caption-toolbar">
                <div className="view-switch" role="group" aria-label="字幕显示方式">
                  {(
                    [
                      ["both", "双语"],
                      ["zh", "中文"],
                      ["source", "原文"]
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      aria-pressed={captionView === value}
                      className={`view-switch-option ${captionView === value ? "is-active" : ""}`}
                      key={value}
                      onClick={() => setCaptionView(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="caption-search">
                  <label className="visually-hidden" htmlFor="caption-search-input">
                    搜索字幕
                  </label>
                  <input
                    id="caption-search-input"
                    onChange={(event) => {
                      setQuery(event.target.value);
                      // 换了搜索词，游标必须回到第一条，否则会停在越界位置。
                      setMatchCursor(0);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        stepMatch(event.shiftKey ? -1 : 1);
                      }
                    }}
                    placeholder="搜索字幕内容"
                    type="search"
                    value={query}
                  />
                  {normalizedQuery ? (
                    <span className="caption-search-status muted">
                      {matches.length > 0 ? `${matchCursor + 1} / ${matches.length}` : "无匹配"}
                    </span>
                  ) : null}
                  <button
                    className="ghost-button"
                    disabled={matches.length === 0}
                    onClick={() => stepMatch(-1)}
                    type="button"
                  >
                    上一个
                  </button>
                  <button
                    className="ghost-button"
                    disabled={matches.length === 0}
                    onClick={() => stepMatch(1)}
                    type="button"
                  >
                    下一个
                  </button>
                </div>
              </div>

              <p className="muted form-helper">
                点击任意一条字幕可以跳到视频对应位置。
                {settings.apiKey ? "选中一段文字可以让 AI 解释。" : null}
              </p>

              <div
                className="caption-scroller"
                onMouseUp={captureSelection}
                onTouchEnd={captureSelection}
                ref={captionAreaRef}
              >
                {result.segments.map((segment, index) => {
                  const isMatch = matches.includes(index);
                  const isCurrentMatch = matches[matchCursor] === index;
                  const isSaved = notes.some((note) => note.id === segment.id);

                  return (
                    <article
                      className={[
                        "caption-card",
                        index === activeSegmentIndex ? "caption-card-active" : "",
                        isMatch ? "caption-card-match" : "",
                        isCurrentMatch ? "caption-card-current-match" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      id={segment.id}
                      key={segment.id}
                    >
                      <div className="caption-row">
                        <button
                          className="caption-seek"
                          onClick={() => seekToSegment(segment.startMs)}
                          title="跳到这一句"
                          type="button"
                        >
                          <span className="caption-time">{formatTimestamp(segment.startMs)}</span>
                          {captionView !== "source" ? (
                            <span className="caption-zh">{segment.translatedText}</span>
                          ) : null}
                          {captionView !== "zh" ? (
                            <span className="caption-source">{segment.sourceText}</span>
                          ) : null}
                        </button>

                        <button
                          aria-pressed={isSaved}
                          className="caption-note-toggle"
                          onClick={() => toggleNote(segment.id)}
                          title={isSaved ? "从笔记中移除" : "保存为笔记"}
                          type="button"
                        >
                          {isSaved ? "★" : "☆"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {settings.apiKey && selection ? (
              <div className="panel">
                <div className="section-header section-header-inline">
                  <div>
                    <span className="section-kicker">Explain</span>
                    <h2 className="panel-title">解释选中内容</h2>
                  </div>
                </div>

                <blockquote className="selection-quote">{selection}</blockquote>

                {explanation ? (
                  <div className="section">
                    <p>{explanation.meaning}</p>
                    {explanation.notes.length > 0 ? (
                      <ul className="stack-list section">
                        {explanation.notes.map((note) => (
                          <li key={note}>
                            <p className="muted">{note}</p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                {explainState === "error" ? (
                  <p className="muted form-helper">解释失败：{explainError}</p>
                ) : null}

                <div className="button-row section portfolio-link-row">
                  <button
                    className="primary-button"
                    disabled={explainState === "loading"}
                    onClick={explainCurrentSelection}
                    type="button"
                  >
                    {explainState === "loading"
                      ? "解释中..."
                      : explanation
                        ? "重新解释"
                        : "解释这段"}
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => {
                      setSelection("");
                      setExplanation(null);
                      setExplainState("idle");
                    }}
                    type="button"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : null}

            {notes.length > 0 ? (
              <div className="panel">
                <div className="section-header section-header-inline">
                  <div>
                    <span className="section-kicker">Notes</span>
                    <h2 className="panel-title">我的笔记（{notes.length}）</h2>
                  </div>
                </div>

                <p className="muted form-helper">
                  笔记只保存在这台设备的浏览器里，换设备或清除站点数据会丢失。
                </p>

                <div className="stack-list section">
                  {notes.map((note) => (
                    <div key={note.id}>
                      <button
                        className="caption-seek"
                        onClick={() => seekToSegment(note.startMs)}
                        type="button"
                      >
                        <span className="caption-time">{formatTimestamp(note.startMs)}</span>
                        <span className="caption-zh">{note.zh}</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="button-row section portfolio-link-row">
                  <button className="ghost-button" onClick={exportNotes} type="button">
                    导出 Markdown
                  </button>
                  <button className="ghost-button" onClick={() => persistNotes([])} type="button">
                    清空笔记
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
