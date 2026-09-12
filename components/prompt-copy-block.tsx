"use client";

import { useEffect, useRef, useState } from "react";

type PromptCopyBlockProps = {
  text: string;
  label?: string;
  /** 块上方的小标题。提示词以外的正文（比如配置片段）传自己的说法。 */
  kicker?: string;
};

export function PromptCopyBlock({
  text,
  label = "复制全文",
  kicker = "提示词正文"
}: PromptCopyBlockProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function copy() {
    clearTimeout(timerRef.current);

    try {
      // execCommand is the fallback for browsers that withhold the async
      // clipboard API outside a secure context.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }

      setStatus("copied");
    } catch {
      setStatus("failed");
    }

    timerRef.current = setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <div className="prompt-block">
      <div className="prompt-block-head">
        <span className="section-kicker">{kicker}</span>
        <button className="primary-button" onClick={copy} type="button">
          {status === "copied" ? "已复制" : status === "failed" ? "复制失败，请手动选取" : label}
        </button>
      </div>
      <pre className="code-block prompt-body">{text}</pre>
    </div>
  );
}
