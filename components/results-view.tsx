import type { SearchResult } from "@/lib/schemas";

type ResultsViewProps = {
  result: SearchResult;
};

export function ResultsView({ result }: ResultsViewProps) {
  const sourceYears = result.sources
    .map((source) => Number(source.publishedAt.slice(0, 4)))
    .filter((year) => Number.isFinite(year) && year >= 2000)
    .sort((left, right) => left - right);
  const sourceYearLabel =
    sourceYears.length === 0
      ? "年份未知"
      : sourceYears[0] === sourceYears[sourceYears.length - 1]
        ? `${sourceYears[0]}`
        : `${sourceYears[0]}-${sourceYears[sourceYears.length - 1]}`;
  const processLabel = result.overview.typicalProcess.slice(0, 3).join(" / ") || "待补数据";

  if (result.sampleSize === 0) {
    return (
      <div className="panel empty-state">
        <h2 className="panel-title">暂时没有匹配样本</h2>
        <p className="muted">这次查询没有召回到足够可用的结果。你可以尝试放宽方向词，或者直接先只搜公司和岗位。</p>
      </div>
    );
  }

  return (
    <div className="section-grid">
      <section className="panel span-8">
        <div className="result-header">
          <div className="result-intro">
            <div className="meta-row">
              <span className="eyebrow">
                {result.mode === "live" ? "Live Pipeline" : result.mode === "mixed" ? "Live + Fallback" : "Mock Pipeline"}
              </span>
              <span className="meta-pill">置信度 {result.confidenceLabel}</span>
              <span className="meta-pill">最近更新 {result.lastUpdated}</span>
            </div>
            <h2 className="panel-title result-query">
              {[result.query.company, result.query.role, result.query.direction].filter(Boolean).join(" · ")}
            </h2>
            <p className="muted result-summary">
              这是一页偏“快速准备”的结构化总结。公开样本 {result.sampleSize} 篇，来源年份跨度 {sourceYearLabel}，精确时间不作为强结论。
            </p>
          </div>
          <div className="callout callout-strong">
            <strong>Briefing Scope</strong>
            <p className="muted">{result.stageSummary}</p>
          </div>
        </div>

        <div className="callout section">
          <strong>结果解释</strong>
          <p className="muted">{result.sourceScope}</p>
          <p className="muted">
            召回 {result.pipeline.retrievedCount} 条候选来源，成功处理 {result.pipeline.extractedCount} 条正文，当前抽取方式：
            {result.pipeline.extractionMode}。
          </p>
          <p className="muted">这一版更适合帮你快速把握轮次、题型和准备重点，不建议把具体日期和周期当成硬预测。</p>
        </div>

        {result.warnings.length > 0 ? (
          <div className="section">
            <div className="section-header section-header-inline">
              <div>
                <span className="section-kicker">Operational Notes</span>
                <h3 className="panel-title">注意事项</h3>
              </div>
            </div>
            <ul className="stack-list">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="stats-grid section">
          <div className="stat-card">
            <p className="stat-label">来源样本</p>
            <p className="stat-value">{result.sampleSize} 篇</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">稳定轮次</p>
            <p className="stat-value stat-value-compact">{processLabel}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">常见主题</p>
            <p className="stat-value stat-value-compact">{result.overview.hotTopics.slice(0, 2).join(" / ") || "待补数据"}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">重复问题</p>
            <p className="stat-value">{result.overview.repeatedQuestionCount} 组</p>
          </div>
        </div>

        <div className="section">
          <div className="section-header section-header-inline">
            <div>
              <span className="section-kicker">Executive Summary</span>
              <h3 className="panel-title">5 分钟速览</h3>
            </div>
          </div>
          <div className="insight-grid">
            {result.timelineHighlights.map((item) => (
              <div className="insight-card" key={item}>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-header section-header-inline">
            <div>
              <span className="section-kicker">Interview Flow</span>
              <h3 className="panel-title">流程参考</h3>
            </div>
          </div>
          {result.overview.typicalProcess.length > 0 ? (
            <ol className="result-list">
              {result.overview.typicalProcess.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <div className="callout">
              <p className="muted">当前还没有形成稳定重复的流程轮次，建议结合右侧来源原帖核对。</p>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-header section-header-inline">
            <div>
              <span className="section-kicker">Repeated Questions</span>
              <h3 className="panel-title">重复出现的问题</h3>
            </div>
          </div>
          {result.topQuestions.length > 0 ? (
            <ul className="question-list">
              {result.topQuestions.map((question) => (
                <li className="question-item" key={question.question}>
                  <strong>{question.question}</strong>
                  <div className="question-meta">
                    <span>出现 {question.count} 次</span>
                    <span>{question.topicTag}</span>
                    <span>{question.roundLabels.join(" / ")}</span>
                  </div>
                  <p className="quote">{question.evidenceSnippet}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="callout">
              <p className="muted">当前没有形成至少 2 次重复的问题，先把右侧来源当作快速摸底材料更合适。</p>
            </div>
          )}
        </div>
      </section>

      <aside className="span-4">
        <div className="panel">
          <div className="section-header section-header-inline">
            <div>
              <span className="section-kicker">Action Checklist</span>
              <h3 className="panel-title">面前准备重点</h3>
            </div>
          </div>
          <ul className="stack-list">
            {result.prepSuggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>

        <div className="panel section">
          <div className="section-header section-header-inline">
            <div>
              <span className="section-kicker">Evidence Base</span>
              <h3 className="panel-title">来源证据</h3>
            </div>
          </div>
          <p className="muted">来源跨年份，优先拿来确认轮次和题型，不建议直接拿它预测精确时间安排。</p>
          <ul className="source-list">
            {result.sources.map((source) => (
              <li className="source-item" key={source.id}>
                <strong>
                  <a href={source.sourceUrl} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </strong>
                <div className="source-meta">
                  <span>{source.sourceName}</span>
                  <span>{source.relevanceLabel}</span>
                  {source.authorLabel ? <span>{source.authorLabel}</span> : null}
                  <span>{source.publishedAt}</span>
                </div>
                <p className="quote">{source.summarySnippet}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
