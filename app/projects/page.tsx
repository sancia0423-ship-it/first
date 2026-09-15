import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { publicFileExists } from "@/lib/media";
import { personalSiteContent } from "@/lib/personal-site-content";

export const metadata: Metadata = {
  title: "项目展示",
  description: "夏琪做过的 AI 产品与数据分析项目。"
};

/**
 * 项目展示。版式照夏琪的设计：墨绿整页、标题居中、四张浅蓝卡片横排，
 * 每张卡上图下文。文案逐字用她写的。
 */
export default function ProjectsPage() {
  const { projects } = personalSiteContent.home;

  return (
    <main className="page-shell page-dark">
      <SiteHeader />

      <section id="top">
        <h1 className="projects-title">{projects.title}</h1>

        <div className="project-cards">
          {projects.cards.map((card) => (
            <article className="project-card" key={card.lines[0]}>
              {publicFileExists(card.image) ? (
                <div className="project-card-media">
                  <Image
                    alt={card.imageAlt}
                    height={card.imageHeight}
                    sizes="(max-width: 900px) 45vw, 240px"
                    src={card.image}
                    width={card.imageWidth}
                  />
                </div>
              ) : null}

              <div className="project-card-body">
                {card.title ? <h2>{card.title}</h2> : null}
                {card.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="about-links">
          <Link href="/about">返回自我介绍</Link>
        </div>
      </section>
    </main>
  );
}
