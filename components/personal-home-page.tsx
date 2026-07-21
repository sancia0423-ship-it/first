import Link from "next/link";
import { ExpressiveHomeHero } from "@/components/expressive-home-hero";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

export function PersonalHomePage() {
  const { contact, hero, learningPreview, resume, toolsPreview } = personalSiteContent.home;

  return (
    <main className="page-shell portfolio-page home-expressive-page">
      <SiteHeader />

      <ExpressiveHomeHero hero={hero} resumeHref={resume.viewHref} />

      <section className="portfolio-section section" id="resume">
        <div className="portfolio-grid resume-grid">
          <article className="candy-card resume-card">
            <div className="section-header portfolio-section-header tight-section-header">
              <div>
                <span className="section-kicker">{resume.kicker}</span>
                <h2 className="panel-title">{resume.title}</h2>
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
