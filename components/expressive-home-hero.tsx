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
};

const initialStyle = {
  "--spot-x": "72%",
  "--spot-y": "24%",
  "--tilt-x": "0",
  "--tilt-y": "0"
} as CSSProperties;

export function ExpressiveHomeHero({ hero, resumeHref }: ExpressiveHomeHeroProps) {
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
          <h1 className="expressive-display">{hero.titleIntro}</h1>
          <p className="expressive-body">{hero.lead}</p>

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
        </div>

        <div className="expressive-hero-scene">
          <div className="expressive-scene-panel">
            <div className="expressive-paint expressive-paint-one" aria-hidden="true" />
            <div className="expressive-paint expressive-paint-two" aria-hidden="true" />
            <div className="expressive-paint expressive-paint-three" aria-hidden="true" />
            <div className="expressive-character-wrap">
              <ArtistCharacterCluster />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
