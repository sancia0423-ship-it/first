"use client";

import type { CSSProperties, PointerEvent } from "react";
import Link from "next/link";
import { useRef } from "react";
import { ArtistCharacterCluster } from "@/components/artist-character-cluster";

type HeroContent = {
  kicker: string;
  titleIntro: string;
  highlightWords: {
    first: string;
    second: string;
    third: string;
  };
  titleMiddle: string;
  titleConnector: string;
  titleOutro: string;
  lead: string;
  badges: readonly string[];
};

type ExpressiveHomeHeroProps = {
  hero: HeroContent;
  resumeHref: string;
  aboutTitle: string;
  aboutSnippet: string;
  learningTitle: string;
  learningSnippet: string;
  toolsTitle: string;
  toolsSnippet: string;
};

const initialStyle = {
  "--spot-x": "72%",
  "--spot-y": "24%",
  "--tilt-x": "0",
  "--tilt-y": "0"
} as CSSProperties;

export function ExpressiveHomeHero({
  aboutSnippet,
  aboutTitle,
  hero,
  learningSnippet,
  learningTitle,
  resumeHref,
  toolsSnippet,
  toolsTitle
}: ExpressiveHomeHeroProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  const setMotionVars = (xRatio: number, yRatio: number) => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    root.style.setProperty("--spot-x", `${(xRatio * 100).toFixed(1)}%`);
    root.style.setProperty("--spot-y", `${(yRatio * 100).toFixed(1)}%`);
    root.style.setProperty("--tilt-x", `${(0.5 - yRatio).toFixed(3)}`);
    root.style.setProperty("--tilt-y", `${(xRatio - 0.5).toFixed(3)}`);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const rect = root.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

    setMotionVars(x, y);
  };

  const resetMotion = () => {
    setMotionVars(0.72, 0.24);
  };

  return (
    <section
      ref={rootRef}
      className="expressive-hero"
      id="top"
      onPointerLeave={resetMotion}
      onPointerMove={handlePointerMove}
      style={initialStyle}
    >
      <div className="expressive-hero-spotlight" aria-hidden="true" />
      <div className="expressive-hero-grid">
        <div className="expressive-hero-copy">
          <span className="expressive-overline">{hero.kicker}</span>
          <h1 className="expressive-display">
            {hero.titleIntro}
            <span className="expressive-highlight expressive-highlight-peach">{hero.highlightWords.first}</span>
            {hero.titleMiddle}
            <span className="expressive-highlight expressive-highlight-violet">{hero.highlightWords.second}</span>
            {hero.titleConnector}
            <span className="expressive-highlight expressive-highlight-mint">{hero.highlightWords.third}</span>
            {hero.titleOutro}
          </h1>
          <p className="expressive-body">{hero.lead}</p>

          <div className="expressive-chip-row">
            {hero.badges.map((item) => (
              <span className="expressive-chip" key={item}>
                {item}
              </span>
            ))}
          </div>

          <div className="expressive-button-row">
            <a className="expressive-button expressive-button-primary" href={resumeHref} rel="noreferrer" target="_blank">
              查看简历
            </a>
            <Link className="expressive-button expressive-button-secondary" href="/ai-learning">
              学习资料
            </Link>
            <Link className="expressive-button expressive-button-secondary" href="/tools">
              小工具
            </Link>
          </div>

          <div className="expressive-anchor-row">
            <a className="expressive-anchor-chip" href="#about">
              自我介绍
            </a>
            <a className="expressive-anchor-chip" href="#projects">
              项目经历
            </a>
            <a className="expressive-anchor-chip" href="#resume">
              简历入口
            </a>
          </div>
        </div>

        <div className="expressive-hero-scene">
          <div className="expressive-scene-panel">
            <div className="expressive-paint expressive-paint-one" aria-hidden="true" />
            <div className="expressive-paint expressive-paint-two" aria-hidden="true" />
            <div className="expressive-paint expressive-paint-three" aria-hidden="true" />
            <div className="expressive-scene-tag expressive-scene-tag-left">欢迎来逛</div>
            <div className="expressive-scene-tag expressive-scene-tag-right">可爱但认真</div>
            <div className="expressive-character-wrap">
              <ArtistCharacterCluster />
            </div>
            <div className="expressive-scene-note">
              <span className="expressive-note-label">主页氛围</span>
              <strong>像精心做过的个人作品集，不像 AI 自动拼出来的模板。</strong>
            </div>
          </div>

          <article className="expressive-floating-card expressive-floating-card-about">
            <span className="expressive-floating-kicker">正在做什么</span>
            <h3>{aboutTitle}</h3>
            <p>{aboutSnippet}</p>
          </article>

          <article className="expressive-floating-card expressive-floating-card-learning">
            <span className="expressive-floating-kicker">学习收藏</span>
            <h3>{learningTitle}</h3>
            <p>{learningSnippet}</p>
          </article>

          <article className="expressive-floating-card expressive-floating-card-tools">
            <span className="expressive-floating-kicker">最近做的小东西</span>
            <h3>{toolsTitle}</h3>
            <p>{toolsSnippet}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
