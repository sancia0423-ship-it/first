import Link from "next/link";
import { ArtistCharacterCluster } from "@/components/artist-character-cluster";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

export function PersonalHomePage() {
  const { about, contact, hero, learningPreview, photos, projects, resume, toolsPreview } = personalSiteContent.home;

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
              {hero.badges.map((item) => (
                <span className="sticker-pill" key={item}>
                  {item}
                </span>
              ))}
            </div>

            <div className="button-row section">
              <a className="primary-button portfolio-button" href={resume.viewHref} rel="noreferrer" target="_blank">
                看简历
              </a>
              <Link className="ghost-button portfolio-button" href="/ai-learning">
                AI 学习资料
              </Link>
              <Link className="ghost-button portfolio-button" href="/tools">
                看小工具
              </Link>
            </div>
          </div>

          <div className="candy-card showcase-card art-showcase-card">
            <div className="showcase-window art-showcase-window">
              <div className="window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="paint-splash paint-splash-peach" aria-hidden="true" />
              <div className="paint-splash paint-splash-gold" aria-hidden="true" />
              <div className="paint-splash paint-splash-teal" aria-hidden="true" />
              <div className="floating-sticker sticker-left">AI x Art</div>
              <div className="floating-sticker sticker-right">Portfolio Mood</div>

              <div className="character-stage">
                <ArtistCharacterCluster />
              </div>

              <div className="showcase-script art-script">
                <span className="mini-label">网站气质</span>
                <strong>像艺术作品集一样介绍自己，同时保留资料、简历和工具的实用性。</strong>
              </div>
            </div>

            <div className="showcase-grid">
              <article className="mini-card mini-card-sun">
                <span className="mini-label">自我介绍</span>
                <p>先让别人快速认识我是谁、在做什么、擅长什么。</p>
              </article>
              <article className="mini-card mini-card-mint">
                <span className="mini-label">学习资料</span>
                <p>课程讲义、assignment 和 AI 学习资料集中管理，方便下载。</p>
              </article>
              <article className="mini-card mini-card-sky">
                <span className="mini-label">小工具</span>
                <p>把我做的小工具放到同一个入口，不只是展示，也可以直接试用。</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio-section section" id="photos">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{photos.kicker}</span>
            <h2 className="panel-title">{photos.title}</h2>
          </div>
          <p className="section-copy">{photos.summary}</p>
        </div>

        <div className="photo-grid">
          {photos.cards.map((item) => (
            <article className={`candy-card ${item.className}`} key={item.label}>
              <span className="story-badge">{item.label}</span>
              <div className="photo-placeholder">
                <span>照片位置</span>
              </div>
              <p className="photo-caption">{item.caption}</p>
            </article>
          ))}
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
          </article>

          <article className="candy-card articles-card">
            <div className="section-header portfolio-section-header tight-section-header">
              <div>
                <span className="section-kicker">{learningPreview.kicker}</span>
                <h2 className="panel-title">{learningPreview.title}</h2>
              </div>
            </div>

            <p className="section-copy">{learningPreview.summary}</p>

            <div className="article-grid">
              {learningPreview.items.map((item) => (
                <article className="article-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <div className="button-row section portfolio-link-row">
                    <Link className="ghost-button" href={item.href}>
                      打开页面
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="portfolio-section section" id="tools-preview">
        <div className="section-header portfolio-section-header">
          <div>
            <span className="section-kicker">{toolsPreview.kicker}</span>
            <h2 className="panel-title">{toolsPreview.title}</h2>
          </div>
          <p className="section-copy">{toolsPreview.summary}</p>
        </div>

        <div className="article-grid">
          {toolsPreview.cards.map((item) => (
            <article className="article-card tool-preview-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="button-row section portfolio-link-row">
                <Link className="ghost-button" href={item.href}>
                  打开
                </Link>
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
