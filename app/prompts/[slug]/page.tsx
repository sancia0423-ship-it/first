import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PromptCopyBlock } from "@/components/prompt-copy-block";
import { SiteHeader } from "@/components/site-header";
import {
  contrastExamples,
  findPrompt,
  projectMaterialTemplate,
  promptLibrary
} from "@/lib/prompt-library";

type PromptPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return promptLibrary.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: PromptPageProps): Promise<Metadata> {
  const entry = findPrompt((await params).slug);

  if (!entry) {
    return { title: "Prompt" };
  }

  return { title: entry.title, description: entry.summary };
}

export default async function PromptPage({ params }: PromptPageProps) {
  const entry = findPrompt((await params).slug);

  if (!entry) {
    notFound();
  }

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <span className="eyebrow">{entry.label}</span>
        <h1 className="page-title">{entry.title}</h1>
        <p className="hero-copy section">{entry.summary}</p>
        {entry.source ? <p className="muted section">{entry.source}</p> : null}
      </section>

      <section id="why">
        <h2 className="section-title">它解决什么</h2>
        <ul className="stack-list">
          {entry.notes.map((note) => (
            <li key={note}>
              <p>{note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="prompt">
        <h2 className="section-title">提示词全文</h2>
        <PromptCopyBlock text={entry.body} />
      </section>

      <section id="how">
        <h2 className="section-title">怎么用</h2>
        <ol className="stack-list numbered-list">
          {entry.steps.map((step) => (
            <li key={step}>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {entry.slug === "ai-project-rewrite" ? (
        <>
          <section id="template">
            <h2 className="section-title">素材采集模板</h2>
            <p className="section-copy muted">
              发给模型之前先自己填。填不上的直接留空 —— 留空本身就是信号，说明这块是你面试的薄弱项。
            </p>
            <PromptCopyBlock text={projectMaterialTemplate} label="复制模板" />
          </section>

          <section id="contrast">
            <h2 className="section-title">正反例对照</h2>
            <ul className="stack-list">
              {contrastExamples.map((item) => (
                <li key={item.dimension}>
                  <h3 className="entry-title">{item.dimension}</h3>
                  <p className="muted">✕ {item.bad}</p>
                  <p>✓ {item.good}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <section id="more">
        <h2 className="section-title">其他提示词</h2>
        <ul className="stack-list">
          {promptLibrary
            .filter((item) => item.slug !== entry.slug)
            .map((item) => (
              <li key={item.slug}>
                <span className="story-badge">{item.label}</span>
                <h3 className="entry-title">{item.title}</h3>
                <p className="muted">{item.summary}</p>
                <Link className="ghost-button" href={`/prompts/${item.slug}`}>
                  打开
                </Link>
              </li>
            ))}
          <li>
            <Link className="ghost-button" href="/ai-learning">
              返回学习资料
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
