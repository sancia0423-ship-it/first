import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { portfolioContent } from "@/lib/portfolio-content";

export default function HomePage() {
  const { about, articles, contact, hero, projects, resume, videos } = portfolioContent;

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
              {hero.titleIntro} <span className="word-patch patch-peach">{hero.highlightWords.first}</span>、
              <span className="word-patch patch-mint">{hero.highlightWords.second}</span> {hero.titleMiddle}
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
              {hero.ctas.map((item) => (
                <Link className={`${item.kind === "primary" ? "primary-button" : "ghost-button"} portfolio-button`} href={item.href} key={item.label}>
                  {item.label}
                </Link>
              ))}
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
                <span className="mini-label">Homepage Mood</span>
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

      <section className="portfolio-section section" id="videos">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{videos.kicker}</span>
            <h2 className="panel-title">{videos.title}</h2>
          </div>
          <p className="section-copy">{videos.summary}</p>
        </div>

        <div className="portfolio-grid video-grid">
          <article className="candy-card video-feature-card">
            <div className="fake-player">
              <div className="fake-player-screen">
                <span className="mini-label">{videos.youtubeLabel}</span>
                <strong>{videos.youtubeTitle}</strong>
                <p>{videos.youtubeBody}</p>
              </div>
            </div>

            <div className="playlist-grid">
              {videos.playlistCards.map((item) => (
                <article className="playlist-card" key={item.title}>
                  <span className="mini-label">{item.title}</span>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="candy-card intro-video-card">
            <span className="story-badge">{videos.introBadge}</span>
            <h3>{videos.introTitle}</h3>
            <p>{videos.introBody}</p>
            <ul className="portfolio-list">
              {videos.introOutline.map((item) => (
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

            <ul className="portfolio-list">
              {resume.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="candy-card articles-card" id="articles">
            <div className="section-header portfolio-section-header tight-section-header">
              <div>
                <span className="section-kicker">{articles.kicker}</span>
                <h2 className="panel-title">{articles.title}</h2>
              </div>
            </div>

            <div className="article-grid">
              {articles.cards.map((item) => (
                <article className="article-card" key={item.title}>
                  <span className="story-badge">{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="portfolio-section section" id="projects">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{projects.kicker}</span>
            <h2 className="panel-title">{projects.title}</h2>
          </div>
          <p className="section-copy">{projects.summary}</p>
        </div>

        <div className="project-grid">
          {projects.cards.map((item) => (
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

      <section className="portfolio-section section" id="contact">
        <article className="candy-card contact-card">
          <div>
            <span className="section-kicker">{contact.kicker}</span>
            <h2 className="panel-title">{contact.title}</h2>
            <p className="section-copy contact-copy">{contact.summary}</p>
          </div>

          <div className="contact-pill-row">
            {contact.pills.map((item) => (
              <span className="contact-pill" key={item}>
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
