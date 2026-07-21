import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

export function AiLearningPage() {
  const { hero, lectures, overviewCards, practice, referenceShelf } = personalSiteContent.learning;

  return (
    <main className="page-shell portfolio-page">
      <SiteHeader />

      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">{hero.kicker}</span>
            <h1 className="hero-title hero-title-compact">{hero.title}</h1>
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
            <span className="section-kicker">文件</span>
            <h2 className="panel-title">AI 学习文件</h2>
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

      <section className="portfolio-section section" id="practice">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{practice.kicker}</span>
            <h2 className="panel-title">{practice.title}</h2>
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
            <span className="section-kicker">{referenceShelf.kicker}</span>
            <h2 className="panel-title">{referenceShelf.title}</h2>
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
