import Image from "next/image";
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
        <h1 className="page-title">{hero.titleIntro}</h1>
        <p className="hero-copy section">{hero.lead}</p>

        <figure className="site-figure">
          <Image
            alt="白墙上悬挂的一只灰色喇叭"
            height={826}
            priority
            sizes="(max-width: 640px) 100vw, 300px"
            src="/images/site/speaker.jpg"
            width={1240}
          />
          <figcaption>摄影：Will Handley，经作者授权使用。</figcaption>
        </figure>
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
        </div>

        <ul className="stack-list">
          {projects.cards.map((item) => (
            <li key={item.title}>
              <span className="story-badge">{item.badge}</span>
              <h3 className="entry-title">{item.title}</h3>
            </li>
          ))}
        </ul>

        <div className="button-row section portfolio-link-row">
          <Link className="ghost-button" href="/projects">
            查看项目详情
          </Link>
        </div>
      </section>

      <section id="resume">
        <div className="section-header">
          <h2 className="section-title">{resume.kicker}</h2>
          <p className="section-lede">{resume.title}</p>
        </div>

        <div className="button-row portfolio-link-row">
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
