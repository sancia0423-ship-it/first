import type { InterviewSignal } from "@/lib/schemas";

export const mockInterviewSignals: InterviewSignal[] = [
  {
    sourceId: "bd-growth-01",
    title: "字节跳动产品经理实习增长方向面经",
    sourceName: "Mock Campus Board",
    sourceUrl: "https://example.com/mock/bytedance-growth-01",
    publishedAt: "2026-03-12",
    authorLabel: "Mock Candidate",
    company: "字节跳动",
    role: "产品经理实习",
    direction: "增长",
    process: ["HR 初筛", "业务一面", "业务二面", "HR 沟通"],
    totalCycleDays: 11,
    questions: [
      {
        question: "你做过的增长项目里，最核心的指标是什么？",
        normalizedQuestion: "增长项目最核心的指标是什么",
        topicTag: "增长分析",
        roundLabel: "业务一面",
        evidenceSnippet: "面试官先追问项目目标，接着让我解释为什么把次日留存和激活率作为核心指标。"
      },
      {
        question: "如果新用户转化下降，你会怎么定位问题？",
        normalizedQuestion: "新用户转化下降怎么定位问题",
        topicTag: "漏斗诊断",
        roundLabel: "业务二面",
        evidenceSnippet: "二面基本围绕漏斗分析展开，让我拆每一层转化并说明优先排查顺序。"
      }
    ],
    notes: ["更偏增长漏斗和指标拆解", "会深挖项目里你亲自做的部分"],
    summarySnippet: "整体四轮，问题集中在增长指标、漏斗定位和跨团队推进。",
    extractionMethod: "heuristic"
  },
  {
    sourceId: "bd-growth-02",
    title: "字节增长 PM 实习复盘",
    sourceName: "Mock Career Notes",
    sourceUrl: "https://example.com/mock/bytedance-growth-02",
    publishedAt: "2026-02-20",
    authorLabel: "Mock Candidate",
    company: "字节跳动",
    role: "产品经理实习",
    direction: "增长",
    process: ["HR 初筛", "业务一面", "leader 面", "HR 终沟通"],
    totalCycleDays: 13,
    questions: [
      {
        question: "如果新用户转化下降，你会怎么定位问题？",
        normalizedQuestion: "新用户转化下降怎么定位问题",
        topicTag: "漏斗诊断",
        roundLabel: "leader 面",
        evidenceSnippet: "leader 面直接给了激活率下滑场景，让我从流量质量、页面改动、运营策略三个角度排查。"
      },
      {
        question: "讲一个你和研发、运营协作推进项目的例子。",
        normalizedQuestion: "讲一个跨团队协作推进项目的例子",
        topicTag: "协作推进",
        roundLabel: "业务一面",
        evidenceSnippet: "一面会追问你和研发怎么对齐优先级，最后项目是怎么落地的。"
      }
    ],
    notes: ["leader 面会看业务判断", "项目复盘比八股更重要"],
    summarySnippet: "流程仍是四轮，但二面更像 leader case，重业务判断与优先级。",
    extractionMethod: "heuristic"
  },
  {
    sourceId: "bd-growth-03",
    title: "字节商业化增长产品实习面经",
    sourceName: "Mock Offer Diary",
    sourceUrl: "https://example.com/mock/bytedance-growth-03",
    publishedAt: "2025-12-09",
    authorLabel: "Mock Candidate",
    company: "字节跳动",
    role: "产品经理实习",
    direction: "增长",
    process: ["HR 初筛", "业务一面", "业务二面", "HR 沟通"],
    totalCycleDays: 10,
    questions: [
      {
        question: "你做过的增长项目里，最核心的指标是什么？",
        normalizedQuestion: "增长项目最核心的指标是什么",
        topicTag: "增长分析",
        roundLabel: "业务一面",
        evidenceSnippet: "一面上来就让我选一个项目，说明北极星指标、约束指标和验证方法。"
      },
      {
        question: "讲一个你和研发、运营协作推进项目的例子。",
        normalizedQuestion: "讲一个跨团队协作推进项目的例子",
        topicTag: "协作推进",
        roundLabel: "业务二面",
        evidenceSnippet: "二面重点追问冲突怎么处理，尤其是研发资源紧张时你怎么推进。"
      }
    ],
    notes: ["整体节奏快", "问题很贴业务，不太问纯理论定义"],
    summarySnippet: "更关注项目里的定量分析和真实推进细节。",
    extractionMethod: "heuristic"
  },
  {
    sourceId: "mt-analysis-01",
    title: "美团产品经理实习商业分析方向面经",
    sourceName: "Mock Campus Board",
    sourceUrl: "https://example.com/mock/meituan-analysis-01",
    publishedAt: "2026-01-17",
    authorLabel: "Mock Candidate",
    company: "美团",
    role: "产品经理实习",
    direction: "商业分析",
    process: ["HR 初筛", "业务一面", "业务二面"],
    totalCycleDays: 9,
    questions: [
      {
        question: "如果某城市订单量下降，你会先看哪些数据？",
        normalizedQuestion: "某城市订单量下降先看哪些数据",
        topicTag: "经营分析",
        roundLabel: "业务一面",
        evidenceSnippet: "面试官给了一个城市经营下滑 case，让我先拆供给、需求和履约。"
      },
      {
        question: "你如何判断一个策略要不要继续投放？",
        normalizedQuestion: "如何判断一个策略要不要继续投放",
        topicTag: "策略评估",
        roundLabel: "业务二面",
        evidenceSnippet: "二面更重 ROI 和长期价值，看你能不能给出继续或暂停的判断逻辑。"
      }
    ],
    notes: ["更像业务 case 面", "指标体系和经营分析权重很高"],
    summarySnippet: "流程更短，但 case 深度更高，喜欢从经营视角问问题。",
    extractionMethod: "heuristic"
  },
  {
    sourceId: "tx-content-01",
    title: "腾讯产品运营实习内容策略面经",
    sourceName: "Mock Career Notes",
    sourceUrl: "https://example.com/mock/tencent-content-01",
    publishedAt: "2025-11-04",
    authorLabel: "Mock Candidate",
    company: "腾讯",
    role: "产品运营实习",
    direction: "内容策略",
    process: ["HR 初筛", "业务一面", "业务二面", "总监面"],
    totalCycleDays: 16,
    questions: [
      {
        question: "你会怎么提升内容社区的新作者活跃度？",
        normalizedQuestion: "怎么提升内容社区新作者活跃度",
        topicTag: "内容增长",
        roundLabel: "业务一面",
        evidenceSnippet: "一面围绕内容生态，问新作者冷启动、激励和留存。"
      },
      {
        question: "如果优质内容供给不足，你会优先改哪一环？",
        normalizedQuestion: "优质内容供给不足优先改哪一环",
        topicTag: "供给策略",
        roundLabel: "总监面",
        evidenceSnippet: "总监面更关注供给侧策略和平台长期结构，而不是单点活动执行。"
      }
    ],
    notes: ["更看内容生态理解", "总监面会看长期策略"],
    summarySnippet: "除了运营执行，还会明显考察内容供给和生态理解。",
    extractionMethod: "heuristic"
  }
];
