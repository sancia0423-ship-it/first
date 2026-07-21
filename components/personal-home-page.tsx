import Link from "next/link";
import { ExpressiveHomeHero } from "@/components/expressive-home-hero";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

export function PersonalHomePage() {
  const { about, contact, hero, learningPreview, photos, projects, resume, toolsPreview } = personalSiteContent.home;

  return (
    <main className="page-shell portfolio-page home-expressive-page">
      <SiteHeader />

      <ExpressiveHomeHero hero={hero} resumeHref={resume.viewHref} />

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
