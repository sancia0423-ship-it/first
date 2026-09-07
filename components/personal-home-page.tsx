import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { publicFileExists } from "@/lib/media";
import { personalSiteContent } from "@/lib/personal-site-content";

export function PersonalHomePage() {
  const { about, contact, hero, learningPreview, projects, resume, toolsPreview } =
    personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <h1 className="page-title page-title-brush">{hero.titleIntro}</h1>
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
          <h2 className="section-title">{about.kicker}</h2>
          <p className="section-lede">{about.title}</p>
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
          <h2 className="section-title">{projects.kicker}</h2>
          <p className="section-lede">{projects.title}</p>
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
              {"image" in item && publicFileExists(item.image) ? (
                <figure className="project-figure">
                  <Image
                    alt={item.imageAlt}
                    height={900}
                    sizes="(max-width: 860px) 100vw, 620px"
                    src={item.image}
                    width={1600}
                  />
                </figure>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section id="resume">
        <div className="section-header">
          <h2 className="section-title">{resume.kicker}</h2>
          <p className="section-lede">{resume.title}</p>
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
          <h2 className="section-title">{learningPreview.kicker}</h2>
          <p className="section-lede">{learningPreview.title}</p>
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
          <h2 className="section-title">{toolsPreview.kicker}</h2>
          <p className="section-lede">{toolsPreview.title}</p>
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
          <h2 className="section-title">{contact.kicker}</h2>
          <p className="section-lede">{contact.title}</p>
          <p className="section-copy muted">{contact.summary}</p>
        </div>

        <div className="contact-pill-row">
          {contact.links.map((item) => (
            <a
              className="contact-pill"
              href={item.href}
              key={item.label}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              target={item.href.startsWith("http") ? "_blank" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
