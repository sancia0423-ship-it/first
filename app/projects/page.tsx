import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { publicFileExists } from "@/lib/media";
import { personalSiteContent } from "@/lib/personal-site-content";

export const metadata: Metadata = {
  title: "项目经历",
  description: "做过的数据分析与 AI 产品项目。"
};

export default function ProjectsPage() {
  const { projects } = personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <h1 className="page-title">{projects.kicker}</h1>
        <p className="hero-copy section">{projects.title}</p>
      </section>

      {projects.cards.map((item) => (
        <section key={item.title}>
          <div className="section-header">
            <span className="section-kicker">{item.badge}</span>
            <h2 className="section-title">{item.title}</h2>
          </div>

          <p className="section-copy">{item.body}</p>

          <p className="metric-chip-row section">
            {item.metrics.map((metric) => (
              <span className="metric-chip" key={metric}>
                {metric}
              </span>
            ))}
          </p>

          {"image" in item && publicFileExists(item.image) ? (
            <figure className="project-figure">
              <Image
                alt={item.imageAlt}
                height={item.imageHeight}
                sizes="(max-width: 860px) 100vw, 620px"
                src={item.image}
                width={item.imageWidth}
              />
            </figure>
          ) : null}
        </section>
      ))}

      <section>
        <Link className="ghost-button" href="/">
          返回首页
        </Link>
      </section>
    </main>
  );
}
