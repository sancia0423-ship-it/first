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
 * 项目展示。原来并在自我介绍页下半屏，现在拆成独立一页 —— 从自我介绍点进来才看到。
 */
export default function ProjectsPage() {
  const { projects } = personalSiteContent.home;

  return (
    <main className="page-shell">
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

              {/*
                标题槽始终渲染：有两张卡没有标题，不占位的话它们的正文会顶上去一行，
                四张卡的正文基线就对不齐了。空标题对读屏软件不可见。
              */}
              <div className="project-card-body">
                <h2 className="project-card-title">{card.title}</h2>
                <div>
                  {card.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
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
