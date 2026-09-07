import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";
import { promptLibrary } from "@/lib/prompt-library";

export function AiLearningPage() {
  const { hero, lectures, overviewCards, practice, referenceShelf } = personalSiteContent.learning;

  return (
    <main className="page-shell portfolio-page">
      <SiteHeader />

      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">{hero.kicker}</span>
            <h1 className="page-title">{hero.title}</h1>
            <p className="hero-copy">{hero.lead}</p>
          </div>

          <div className="showcase-grid">
            {overviewCards.map((item) => (
              <article className="candy-card prompt-card" key={item.title}>
                <span className="mini-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-section section" id="lectures">
        <div className="section-header portfolio-section-header">
          <div>
            <h2 className="section-title">AI 学习文件</h2>
            <p className="section-lede">课程 lecture 与基础入门资料，按顺序看即可。</p>
          </div>
        </div>

        <div className="project-grid">
          {lectures.map((item) => (
            <article className="candy-card project-card resource-card" key={item.badge}>
              <span className="story-badge">{item.badge}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="metric-chip-row">
                {item.metrics.map((metric) => (
                  <span className="metric-chip" key={metric}>
                    {metric}
                  </span>
                ))}
              </div>
              <div className="button-row section portfolio-link-row">
                <a className="ghost-button" href={item.href} rel="noreferrer" target="_blank">
                  打开 PDF
                </a>
                <a className="ghost-button" download href={item.href}>
                  下载
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-section section" id="prompts">
        <div className="section-header portfolio-section-header">
          <div>
            <h2 className="section-title">Prompt 合集</h2>
            <p className="section-lede">
              我自己在用的提示词，每一条都能直接复制走。比起收藏一堆链接，我更想把真正反复用到的几条整理清楚。
            </p>
          </div>
        </div>

        <ul className="stack-list">
          {promptLibrary.map((item) => (
            <li key={item.slug}>
              <span className="story-badge">{item.label}</span>
              <h3 className="entry-title">{item.title}</h3>
              <p className="muted">{item.summary}</p>
              <Link className="ghost-button" href={`/prompts/${item.slug}`}>
                打开
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="portfolio-section section" id="practice">
        <div className="section-header portfolio-section-header">
          <div>
            <h2 className="section-title">{practice.title}</h2>
          </div>
          <p className="section-copy">{practice.summary}</p>
        </div>

        <div className="article-grid">
          <article className="article-card">
            <h3>{practice.emptyTitle}</h3>
            <p>{practice.emptyBody}</p>
          </article>
        </div>
      </section>

      <section className="portfolio-section section" id="references">
        <div className="section-header portfolio-section-header">
          <div>
            <h2 className="section-title">{referenceShelf.title}</h2>
          </div>
          <div>
            <p className="section-copy">{referenceShelf.summary}</p>
            <div className="button-row section portfolio-link-row">
              <a className="ghost-button" download href={referenceShelf.fileHref}>
                下载 Articles.docx
              </a>
            </div>
          </div>
        </div>

        <div className="article-grid">
          {referenceShelf.items.map((item) => (
            <article className="article-card" key={item.title}>
              <span className="story-badge">{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
