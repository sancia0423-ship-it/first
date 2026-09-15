import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 自我介绍。首页改成落地页之后，这些正文搬到这里。
 *
 * 顺带把 resume.highlights 和 resume.skills 接上 —— 它们原本写在内容文件里，
 * 但页面上没有任何地方渲染，等于写了没人看得到。
 */
export function AboutPage() {
  const { about, resume } = personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <span className="eyebrow">{about.kicker}</span>
        <h1 className="page-title">{about.title}</h1>
      </section>

      <section id="story">
        <ul className="stack-list">
          {about.storyParagraphs.map((paragraph) => (
            <li key={paragraph}>
              <p>{paragraph}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="now">
        <div className="article-grid">
          {about.prompts.map((item) => (
            <article key={item.title}>
              <h2>{item.title}</h2>
              <p className="muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="highlights">
        <div className="section-header">
          <h2 className="section-title">几个具体结果</h2>
        </div>

        <ul className="stack-list">
          {resume.highlights.map((item) => (
            <li key={item}>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="skills">
        <div className="section-header">
          <h2 className="section-title">常用工具</h2>
        </div>

        <p className="metric-chip-row">
          {resume.skills.map((skill) => (
            <span className="metric-chip" key={skill}>
              {skill}
            </span>
          ))}
        </p>
      </section>

      <section id="resume">
        <div className="button-row">
          <a className="ghost-button" href={resume.viewHref} rel="noreferrer" target="_blank">
            查看简历
          </a>
          <a className="ghost-button" download href={resume.viewHref}>
            下载 PDF
          </a>
          <Link className="ghost-button" href="/projects">
            项目经历
          </Link>
        </div>
      </section>
    </main>
  );
}
