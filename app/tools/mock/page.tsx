import Link from "next/link";
import { MockInterviewDemo } from "@/components/mock-interview-demo";
import { SiteHeader } from "@/components/site-header";

const mockMetrics = [
  { label: "面试题数", value: "4 题", note: "逐题点评 + 最终总评" },
  { label: "评分维度", value: "5 维", note: "产品 / AI / 指标 / 落地 / 风险" },
  { label: "运行模式", value: "双模", note: "有 key 升级，无 key 回退" }
];

const differentiators = [
  {
    title: "像真实 AI 产品面试",
    body: "问题不会只问产品常识，而是会追问模型边界、风险控制和如何把 AI 价值转成业务结果。"
  },
  {
    title: "每题都有追问",
    body: "回答之后，系统会立即给出得分、强弱项和下一句大概率会被追问的问题。"
  },
  {
    title: "能直接拿来 demo",
    body: "即使本地没有配置 OpenAI key，这条链路也能完整跑通，方便你现场展示。"
  }
];

export default function MockInterviewPage() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">AI Product Interview Copilot</span>
            <h1 className="hero-title">把“面试 AI 产品”做成一个可以现场演示的交互 Demo。</h1>
            <p className="hero-copy">
              你可以直接在这里发起一场 AI 产品模拟面试。系统会根据岗位方向生成问题，逐题点评你的回答，再输出最终面试总结。它适合拿来讲“AI 能力如何嵌进一个真实产品闭环”。
            </p>

            <div className="hero-metrics">
              {mockMetrics.map((metric) => (
                <div className="metric-tile" key={metric.label}>
                  <p className="metric-label">{metric.label}</p>
                  <p className="metric-value">{metric.value}</p>
                  <p className="metric-note">{metric.note}</p>
                </div>
              ))}
            </div>

            <div className="button-row section">
              <Link className="ghost-button" href="/">
                返回产品首页
              </Link>
              <Link className="ghost-button" href="/search?company=字节跳动&role=产品经理实习&direction=增长">
                看面经情报模式
              </Link>
            </div>
          </div>

          <div className="panel search-panel">
            <h2 className="panel-title">为什么这个 demo 值得讲</h2>
            <ul className="stack-list">
              {differentiators.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span className="muted">{item.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <MockInterviewDemo />
      </section>
    </main>
  );
}
