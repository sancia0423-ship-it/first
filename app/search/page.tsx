import Link from "next/link";
import { Suspense } from "react";
import { ResultsView } from "@/components/results-view";
import { SearchForm } from "@/components/search-form";
import { SiteHeader } from "@/components/site-header";
import { runSearchPipeline } from "@/lib/pipeline/orchestrator";
import { SearchInputSchema, type SearchInput } from "@/lib/schemas";

export const dynamic = "force-dynamic";

async function loadPipelineResult(input: SearchInput) {
  try {
    return { result: await runSearchPipeline(input) } as const;
  } catch (error) {
    // Upstream messages can leak internal detail, so log them and show a
    // generic recovery hint instead.
    console.error("[search] pipeline failed", error);
    return { result: null } as const;
  }
}

async function PipelineResult({ input }: { input: SearchInput }) {
  const { result } = await loadPipelineResult(input);

  if (!result) {
    return (
      <div className="panel empty-state">
        <h2 className="panel-title">分析过程出错</h2>
        <p className="muted">这次分析没有跑通，可能是来源站点暂时不可用。</p>
        <p className="muted">你可以稍后重试，或者换一组关键词再搜。</p>
        <Link className="ghost-button" href="/">返回首页</Link>
      </div>
    );
  }

  return <ResultsView result={result} />;
}

function ResultsSkeleton() {
  return (
    <div className="section-grid">
      <div className="panel span-8">
        <div className="skeleton-block" style={{ height: 28, width: "40%", marginBottom: 12 }} />
        <div className="skeleton-block" style={{ height: 16, width: "70%", marginBottom: 24 }} />
        <div className="stats-grid">
          {[1, 2, 3].map((i) => (
            <div className="stat-card" key={i}>
              <div className="skeleton-block" style={{ height: 14, width: "50%", marginBottom: 8 }} />
              <div className="skeleton-block" style={{ height: 28, width: "60%" }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div className="skeleton-block" key={i} style={{ height: 48, borderRadius: 14 }} />
          ))}
        </div>
      </div>
      <div className="span-4">
        <div className="panel">
          <div className="skeleton-block" style={{ height: 20, width: "50%", marginBottom: 16 }} />
          {[1, 2, 3].map((i) => (
            <div className="skeleton-block" key={i} style={{ height: 40, marginBottom: 10, borderRadius: 14 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

type SearchPageProps = {
  searchParams?: Promise<{
    company?: string | string[];
    role?: string | string[];
    direction?: string | string[];
  }>;
};

function pickValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const parsedInput = SearchInputSchema.safeParse({
    company: pickValue(resolvedSearchParams.company) ?? "",
    role: pickValue(resolvedSearchParams.role) ?? "",
    direction: pickValue(resolvedSearchParams.direction) ?? ""
  });

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Professional Briefing</span>
            <h1 className="hero-title hero-title-compact">快速准备页</h1>
            <p className="hero-copy">
              这一页会优先走真实来源，把牛客和掘金的公开内容压缩成更适合面前速览的结构化总结。页面、API 和抽取逻辑仍然共用同一套 pipeline，所以后面扩来源时不需要重做 UI。
            </p>
            <div className="hero-metrics hero-metrics-compact">
              <div className="metric-tile">
                <p className="metric-label">结果定位</p>
                <p className="metric-value">Briefing</p>
                <p className="metric-note">优先服务 5 分钟速览</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">输出方式</p>
                <p className="metric-value">结构化</p>
                <p className="metric-note">轮次 / 题型 / 重点 / 证据</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">当前来源</p>
                <p className="metric-value">2+</p>
                <p className="metric-note">牛客 + 掘金</p>
              </div>
            </div>
            <div className="button-row section">
              <Link className="ghost-button" href="/">
                返回首页
              </Link>
            </div>
          </div>

          <div className="panel search-panel">
            <h2 className="panel-title">修改查询</h2>
            <SearchForm
              initialValues={{
                company: pickValue(resolvedSearchParams.company) ?? "",
                role: pickValue(resolvedSearchParams.role) ?? "",
                direction: pickValue(resolvedSearchParams.direction) ?? ""
              }}
            />
          </div>
        </div>
      </section>

      <section className="section">
        {parsedInput.success ? (
          <Suspense fallback={<ResultsSkeleton />}>
            <PipelineResult input={parsedInput.data} />
          </Suspense>
        ) : (
          <div className="panel empty-state">
            <h2 className="panel-title">先输入完整查询</h2>
            <p className="muted">公司和岗位是必填项。方向可以先留空，但建议填上，这样结果会更聚焦。</p>
            <Link className="ghost-button" href="/">
              回到首页重新输入
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
