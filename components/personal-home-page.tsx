import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

export function PersonalHomePage() {
  const { about, contact, hero, learningPreview, projects, resume, toolsPreview } =
    personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <span className="eyebrow">{hero.kicker}</span>
        <h1 className="hero-title">{hero.titleIntro}</h1>
        <p className="hero-copy section">{hero.lead}</p>

        <div className="button-row section">
          <a className="ghost-button" href={resume.viewHref} rel="noreferrer" target="_blank">
            简历 PDF
          </a>
          <Link className="ghost-button" href="/ai-learning">
            学习资料
          </Link>
          <Link className="ghost-button" href="/tools">
            小工具
          </Link>
          <a className="ghost-button" href={contact.links[0].href}>
            邮件联系
          </a>
        </div>
      </section>

      <section id="about">
        <div className="section-header">
          <span className="section-kicker">{about.kicker}</span>
          <h2 className="panel-title">{about.title}</h2>
          <p className="section-copy muted">{about.summary}</p>
        </div>

        <ul className="stack-list">
          {about.storyParagraphs.map((paragraph) => (
            <li key={paragraph}>
              <p>{paragraph}</p>
            </li>
          ))}
        </ul>

        <div className="article-grid section">
          {about.prompts.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="work">
        <div className="section-header">
          <span className="section-kicker">{projects.kicker}</span>
          <h2 className="panel-title">{projects.title}</h2>
          <p className="section-copy muted">{projects.summary}</p>
        </div>

        <ul className="stack-list">
          {projects.cards.map((item) => (
            <li key={item.title}>
              <span className="story-badge">{item.badge}</span>
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
              <div className="metric-chip-row">
                {item.metrics.map((metric) => (
                  <span className="metric-chip" key={metric}>
                    {metric}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="resume">
        <div className="section-header">
          <span className="section-kicker">{resume.kicker}</span>
          <h2 className="panel-title">{resume.title}</h2>
        </div>

        <ul className="portfolio-list">
          {resume.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="metric-chip-row section">
          {resume.skills.map((item) => (
            <span className="metric-chip" key={item}>
              {item}
            </span>
          ))}
        </p>

        <div className="button-row section portfolio-link-row">
          <a className="ghost-button" href={resume.viewHref} rel="noreferrer" target="_blank">
            查看简历
          </a>
          <a className="ghost-button" download href={resume.viewHref}>
            下载 PDF
          </a>
        </div>
      </section>

      <section id="learning">
        <div className="section-header">
          <span className="section-kicker">{learningPreview.kicker}</span>
          <h2 className="panel-title">{learningPreview.title}</h2>
          <p className="section-copy muted">{learningPreview.summary}</p>
        </div>

        <div className="article-grid">
          {learningPreview.items.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
              <Link className="ghost-button" href={item.href}>
                打开页面
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="tools-preview">
        <div className="section-header">
          <span className="section-kicker">{toolsPreview.kicker}</span>
          <h2 className="panel-title">{toolsPreview.title}</h2>
          <p className="section-copy muted">{toolsPreview.summary}</p>
        </div>

        <div className="article-grid">
          {toolsPreview.cards.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p className="muted">{item.body}</p>
              <Link className="ghost-button" href={item.href}>
                打开
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="contact">
        <div className="section-header">
          <span className="section-kicker">{contact.kicker}</span>
          <h2 className="panel-title">{contact.title}</h2>
          <p className="section-copy muted">{contact.summary}</p>
        </div>

        <div className="contact-pill-row">
          {contact.links.map((item) => (
            <a className="contact-pill" href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
