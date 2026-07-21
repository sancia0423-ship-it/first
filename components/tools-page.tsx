import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { YouTubeTranslateDemo } from "@/components/youtube-translate-demo";
import { personalSiteContent } from "@/lib/personal-site-content";

export function ToolsPage() {
  const { cards, hero, noteBody, noteTitle } = personalSiteContent.tools;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">{hero.kicker}</span>
            <h1 className="hero-title hero-title-compact">{hero.title}</h1>
            <p className="hero-copy">{hero.lead}</p>
          </div>

          <div className="panel search-panel">
            <h2 className="panel-title">{noteTitle}</h2>
            <p className="muted search-panel-copy">{noteBody}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="article-grid">
          {cards.map((item) => (
            <article className="article-card tool-preview-card" key={item.title}>
              <span className="story-badge">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="button-row section portfolio-link-row">
                {item.href.startsWith("#") ? (
                  <a className="ghost-button" href={item.href}>
                    {item.action}
                  </a>
                ) : (
                  <Link className="ghost-button" href={item.href}>
                    {item.action}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="youtube-tool">
        <YouTubeTranslateDemo />
      </section>
    </main>
  );
}
