import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

export default function PortfolioPage() {
  const { about, assignments, contact, coursework, demos, experiences, hero, resume } = personalSiteContent;

  return (
    <main className="page-shell portfolio-page">
      <SiteHeader />

      <section className="portfolio-hero" id="top">
        <div className="portfolio-spark portfolio-spark-left" aria-hidden="true" />
        <div className="portfolio-spark portfolio-spark-right" aria-hidden="true" />

        <div className="portfolio-hero-grid">
          <div className="portfolio-hero-copy">
            <span className="portfolio-kicker">{hero.kicker}</span>
            <h1 className="portfolio-title">
              {hero.titleIntro} <span className="word-patch patch-peach">{hero.highlightWords.first}</span>
              {hero.titleMiddle}
              <span className="word-patch patch-mint">{hero.highlightWords.second}</span> {hero.titleConnector}
              <span className="word-patch patch-sky">{hero.highlightWords.third}</span>
              {hero.titleOutro}
            </h1>
            <p className="portfolio-lead">{hero.lead}</p>

            <div className="portfolio-badge-row">
              {hero.featureBadges.map((item) => (
                <span className="sticker-pill" key={item}>
                  {item}
                </span>
              ))}
            </div>

            <div className="button-row section">
              <a className="primary-button portfolio-button" href={resume.viewHref} rel="noreferrer" target="_blank">
                看简历 PDF
              </a>
              <a className="ghost-button portfolio-button" href="#coursework">
                看 AI 课程资料
              </a>
              <Link className="ghost-button portfolio-button" href="/">
                试用翻译工具
              </Link>
            </div>
          </div>

          <div className="candy-card showcase-card">
            <div className="showcase-window">
              <div className="window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="showcase-gradient" aria-hidden="true" />
              <div className="showcase-script">
                <span className="mini-label">Portfolio Snapshot</span>
                <strong>{hero.showcaseTitle}</strong>
              </div>
            </div>

            <div className="showcase-grid">
              {hero.showcaseCards.map((item) => (
                <article className={item.className} key={item.label}>
                  <span className="mini-label">{item.label}</span>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio-section section" id="about">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{about.kicker}</span>
            <h2 className="panel-title">{about.title}</h2>
          </div>
          <p className="section-copy">{about.summary}</p>
        </div>

        <div className="portfolio-grid about-grid">
          <article className="candy-card story-card">
            <span className="story-badge">{about.storyBadge}</span>
            <h3>{about.storyTitle}</h3>
            {about.storyParagraphs.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </article>

          <div className="about-stack">
            {about.prompts.map((item) => (
              <article className="candy-card prompt-card" key={item.title}>
                <span className="mini-label">{item.title}</span>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-section section" id="demos">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{demos.kicker}</span>
            <h2 className="panel-title">{demos.title}</h2>
          </div>
          <p className="section-copy">{demos.summary}</p>
        </div>

        <div className="portfolio-grid video-grid">
          <article className="candy-card video-feature-card">
            <div className="fake-player">
              <div className="fake-player-screen">
                <span className="mini-label">{demos.featuredLabel}</span>
                <strong>{demos.featuredTitle}</strong>
                <p>{demos.featuredBody}</p>
                <div className="button-row section">
                  <Link className="ghost-button" href="/">
                    立即打开
                  </Link>
                </div>
              </div>
            </div>

            <div className="playlist-grid">
              {demos.cards.map((item) => (
                <article className="playlist-card" key={item.title}>
                  <span className="mini-label">{item.title}</span>
                  <p>{item.body}</p>
                  <div className="button-row section portfolio-link-row">
                    <Link className="ghost-button" href={item.href}>
                      {item.action}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="candy-card intro-video-card">
            <span className="story-badge">{demos.sideBadge}</span>
            <h3>{demos.sideTitle}</h3>
            <p>{demos.sideBody}</p>
            <ul className="portfolio-list">
              {demos.sideList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="portfolio-section section" id="resume">
        <div className="portfolio-grid resume-grid">
          <article className="candy-card resume-card">
            <div className="section-header portfolio-section-header tight-section-header">
              <div>
                <span className="section-kicker">{resume.kicker}</span>
                <h2 className="panel-title">{resume.title}</h2>
              </div>
            </div>

            <div className="resume-sheet">
              <div className="resume-sheet-header">
                <strong>{resume.previewTitle}</strong>
                <span>{resume.previewHint}</span>
              </div>
              <div className="resume-lines">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="button-row section portfolio-link-row">
              <a className="primary-button" href={resume.viewHref} rel="noreferrer" target="_blank">
                查看简历
              </a>
              <a className="ghost-button" download href={resume.viewHref}>
                下载 PDF
              </a>
            </div>

            <ul className="portfolio-list">
              {resume.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="metric-chip-row">
              {resume.skills.map((item) => (
                <span className="metric-chip" key={item}>
                  {item}
                </span>
              ))}
            </div>

            <ul className="portfolio-list section">
              {resume.publicNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="candy-card articles-card">
            <div className="section-header portfolio-section-header tight-section-header">
              <div>
                <span className="section-kicker">Assignments</span>
                <h2 className="panel-title">COMP9208 作业资料</h2>
              </div>
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
          </article>
        </div>
      </section>

      <section className="portfolio-section section" id="projects">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{experiences.kicker}</span>
            <h2 className="panel-title">{experiences.title}</h2>
          </div>
          <p className="section-copy">{experiences.summary}</p>
        </div>

        <div className="project-grid">
          {experiences.cards.map((item) => (
            <article className="candy-card project-card" key={item.title}>
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
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-section section" id="coursework">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{coursework.kicker}</span>
            <h2 className="panel-title">{coursework.title}</h2>
          </div>
          <p className="section-copy">{coursework.summary}</p>
        </div>

        <div className="project-grid">
          {coursework.lectures.map((item) => (
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

      <section className="portfolio-section section" id="contact">
        <article className="candy-card contact-card">
          <div>
            <span className="section-kicker">{contact.kicker}</span>
            <h2 className="panel-title">{contact.title}</h2>
            <p className="section-copy contact-copy">{contact.summary}</p>
          </div>

          <div className="contact-pill-row">
            {contact.links.map((item) => (
              <a className="contact-pill contact-link-pill" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
