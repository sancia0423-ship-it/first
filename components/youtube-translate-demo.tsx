"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  YouTubeTranslationResultSchema,
  type YouTubeTranslationResult
} from "@/lib/youtube-agent/contracts";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
};

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
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const lastSpokenSegmentRef = useRef<string | null>(null);

  async function submit(nextUrl = url, nextSourceLanguage = sourceLanguage) {
    setIsSubmitting(true);
    setError("");
    setActiveSegmentIndex(-1);
    lastSpokenSegmentRef.current = null;

    try {
      const response = await fetch("/api/youtube-translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: nextUrl,
          sourceLanguage: nextSourceLanguage
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "翻译请求失败");
      }

      const parsed = YouTubeTranslationResultSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("服务端返回结构异常，请稍后再试。");
      }

      setResult(parsed.data);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "未知错误";
      setResult(null);
      setError(message);
    } finally {
      setIsSubmitting(false);
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

  const canSubmit = url.trim().length > 0;

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
              没有 OpenAI key 也能用；如果已经配置，翻译会更自然，还会补一段中文速览。
            </span>
          </div>

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

        {!result ? (
          <div className="panel empty-state">
            <h2 className="panel-title">翻译结果会显示在这里</h2>
            <p className="muted">
              这里会出现播放器、中文字幕、原文对照、SRT 下载按钮，以及中文朗读开关。
            </p>
          </div>
        ) : (
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

            <div className="panel">
              <div className="section-header section-header-inline">
                <div>
                  <span className="section-kicker">Captions</span>
                  <h2 className="panel-title">同步双语字幕</h2>
                </div>
              </div>

              <div className="caption-scroller">
                {result.segments.map((segment, index) => (
                  <article
                    className={`caption-card ${index === activeSegmentIndex ? "caption-card-active" : ""}`}
                    id={segment.id}
                    key={segment.id}
                  >
                    <div className="caption-time">
                      {Math.floor(segment.startMs / 1000)}s - {Math.floor(segment.endMs / 1000)}s
                    </div>
                    <p className="caption-zh">{segment.translatedText}</p>
                    <p className="caption-source">{segment.sourceText}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
