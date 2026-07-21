import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

export function AiLearningPage() {
  const { assignments, hero, lectures, overviewCards, referenceShelf } = personalSiteContent.learning;

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
            <span className="section-kicker">课程讲义</span>
            <h2 className="panel-title">课程讲义</h2>
          </div>
          <p className="section-copy">目前收录 lecture 1 到 10，以及 12、13 讲。Lecture 11 是展示周，所以这里没有单独 slide。</p>
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

      <section className="portfolio-section section" id="assignments">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">作业资料</span>
            <h2 className="panel-title">作业资料</h2>
          </div>
          <p className="section-copy">这里保留三份 assignment PDF，方便直接下载或回看作业要求。</p>
        </div>

        <div className="article-grid">
          {assignments.map((item) => (
            <article className="article-card" key={item.title}>
              <span className="story-badge">{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
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

      <section className="portfolio-section section" id="references">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{referenceShelf.kicker}</span>
            <h2 className="panel-title">{referenceShelf.title}</h2>
          </div>
          <p className="section-copy">{referenceShelf.summary}</p>
        </div>

        <div className="article-grid">
          {referenceShelf.items.map((item) => (
            <article className="article-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
