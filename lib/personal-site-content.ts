export const personalSiteContent = {
  hero: {
    kicker: "AI Product Portfolio",
    titleIntro: "把我的",
    highlightWords: {
      first: "AI 产品",
      second: "数据分析",
      third: "课程资料"
    },
    titleMiddle: "、",
    titleConnector: "和",
    titleOutro: "整理成一个可以直接分享的网站。",
    lead:
      "我是夏琪，悉尼大学商业数据分析硕士在读，做过美团和得物的 AI 产品，也做过联合国儿童基金会的数据分析项目。这里集中放我的简历、课程资料、作业和在线 Demo。",
    featureBadges: ["AI Product", "Business Analytics", "Python", "SQL", "COMP9208", "Open to internship"],
    showcaseTitle: "既能看我的经历，也能直接打开我做过的工具和课程材料。",
    showcaseCards: [
      {
        label: "Industry",
        body: "做过美团金融 AI 销售流程、得物 AIGC 内容生产和 UNICEF 数据分析项目。",
        className: "mini-card mini-card-sun"
      },
      {
        label: "Coursework",
        body: "把 COMP9208 Artificial Intelligence and Society 的 lecture 和 assignment 全部整理进站内。",
        className: "mini-card mini-card-mint"
      },
      {
        label: "Live Demos",
        body: "除了 PDF，我也把自己做的 YouTube 翻译、信息搜索和模拟面试 Demo 放在同一个入口。",
        className: "mini-card mini-card-sky"
      }
    ]
  },
  about: {
    kicker: "About",
    title: "我在做什么",
    summary: "我更偏向能把模型能力、用户体验和业务结果连起来的 AI 产品与数据分析方向，也在持续把课程学习沉淀成能直接展示的作品。",
    storyBadge: "Quick intro",
    storyTitle: "悉尼大学商分硕士在读，主修 Python、机器学习与数据分析。",
    storyParagraphs: [
      "在美团实习时，我参与了金融保险电销 AI 化项目，做购买流程设计、知识库和对话链路优化，把 AI 独立承接售卖流程后的转化率从 7.44% 提升到 12.6%。",
      "在得物实习时，我参与 AIGC 文生图能力建设，从结构化 Prompt 方案、PRD、原型到评测体系，推动能力接入内容发布与商家工具链，帮助商品内容生产效率提升 5 到 6 倍。",
      "除了业务项目，我也在系统学习 AI and Society、adversarial machine learning、distributed AI、AI literacy 等内容，并把讲义和作业做成可公开浏览的课程资料库。"
    ],
    prompts: [
      {
        title: "当前方向",
        body: "AI 产品、AIGC 应用、多模态工作流，以及能和真实业务指标挂钩的数据分析。"
      },
      {
        title: "核心能力",
        body: "Python、SQL、Prompt 设计、实验设计、指标分析、原型设计，以及 AI 工具辅助开发。"
      },
      {
        title: "机会偏好",
        body: "希望继续做 AI 产品或数据分析相关实习，偏向能从 0 到 1 做功能、看数据和推动上线的团队。"
      }
    ]
  },
  demos: {
    kicker: "Demos",
    title: "我做过的在线工具",
    summary: "除了 PDF 材料，我把几个可以直接打开使用的 Demo 也一起放在这里，方便别人快速理解我在做什么。",
    featuredLabel: "Featured Demo",
    featuredTitle: "YouTube 中文翻译工具",
    featuredBody:
      "输入公开视频链接，读取公开字幕，生成中文字幕、原文对照和可下载 SRT，还能打开浏览器中文朗读。",
    cards: [
      {
        title: "YouTube 中文翻译",
        body: "把 YouTube 字幕翻成中文，适合边看边学英语或技术视频。",
        href: "/",
        action: "打开工具"
      },
      {
        title: "信息搜索 Demo",
        body: "用于检索、汇总和整理结构化信息，适合做研究类问题的快速验证。",
        href: "/search",
        action: "打开搜索"
      },
      {
        title: "模拟面试 Demo",
        body: "把问题、回答和评分放在同一条链路里，适合练习表达和面试反馈。",
        href: "/mock",
        action: "开始练习"
      }
    ],
    sideBadge: "Current focus",
    sideTitle: "我希望把课程学习和产品 Demo 一起沉淀成作品集。",
    sideBody:
      "这样别人点进来，不只是看到一份 PDF，而是能同时看到我做过什么、学过什么，以及我真的把这些能力做成了可以运行的东西。",
    sideList: [
      "业务经历强调真实转化与效率提升。",
      "课程资料强调系统学习与 AI 基础理解。",
      "在线 Demo 强调我有把想法快速落成产品原型的能力。"
    ]
  },
  resume: {
    kicker: "Resume",
    title: "简历与公开资料",
    previewTitle: "夏琪 Resume",
    previewHint: "Sydney Business Analytics / AI Product / Data Analysis",
    viewHref: "/docs/resume/xiaqi-resume.pdf",
    highlights: [
      "美团 AI 电销转化率由 7.44% 提升至 12.6%，日均新增订单稳定在 180 到 240 单。",
      "重新设计二开与三开交互链路，把单轮操作时长从 1 分钟缩短到 20 秒，推动二开人均成单量由 2.2 提升到 2.8。",
      "得物 AIGC 文生图项目完成 MVP 上线并接入商家工具链，功能渗透率达到 65% 以上，内容生产效率提升 5 到 6 倍。",
      "联合国儿童基金会项目中，推动动态金额推荐策略上线，页面支付转化效率提升 4.8%，人均预期募捐收入提升 5%。"
    ],
    skills: ["Python", "SQL", "Machine Learning", "Prompt Design", "A/B Testing", "AI Product"],
    publicNotes: [
      "公开网站里我保留邮箱和简历下载，不直接展示手机号。",
      "如果需要更完整版本，可以直接打开 PDF 查看完整经历。"
    ]
  },
  assignments: [
    {
      tag: "Assignment 01",
      title: "Article Review Report",
      body: "围绕指定论文完成 3000 字以内的 article review，重点训练阅读、批判分析与结构化表达。",
      href: "/docs/comp9208/assignments/assignment-01.pdf"
    },
    {
      tag: "Assignment 02",
      title: "AI Case Analysis",
      body: "围绕 IBM Watson、iTutor Group recruiting AI 等案例讨论 AI 应用、伦理风险与治理问题。",
      href: "/docs/comp9208/assignments/assignment-02.pdf"
    },
    {
      tag: "Assignment 03",
      title: "Adversarial ML Report",
      body: "在数据分析作业中比较 white-box 与 black-box 攻击，并反思 adversarial attacks 对关键 AI 系统的社会影响。",
      href: "/docs/comp9208/assignments/assignment-03.pdf"
    }
  ],
  experiences: {
    kicker: "Experience",
    title: "项目与实习经历",
    summary: "我希望别人看到的不是“做过 AI”，而是做过哪些产品、看过哪些数据、把哪些结果做了出来。",
    cards: [
      {
        badge: "Meituan",
        title: "AI 电销保险流程优化",
        body: "负责购买流程设计、知识库与话术策略优化、产品页面承接逻辑，把 AI 独立售卖链路真正跑通。",
        metrics: ["AI Product", "Conversion", "Knowledge Base"]
      },
      {
        badge: "Dewu",
        title: "AIGC 文生图能力建设",
        body: "围绕商品内容生产做结构化 Prompt 方案、评测体系和多轮模型调优，推动能力接入发布与商家工具链。",
        metrics: ["AIGC", "Prompt", "Evaluation"]
      },
      {
        badge: "UNICEF",
        title: "募捐页面数据分析",
        body: "做用户分层、捐赠预测与策略评估，推动动态金额推荐上线，为后续投放与页面配置提供依据。",
        metrics: ["Data Analysis", "Experiment", "Impact"]
      }
    ]
  },
  coursework: {
    kicker: "Coursework",
    title: "COMP9208: Artificial Intelligence and Society",
    summary:
      "我把这门课的 lecture PDF 和 assignment PDF 都整理进来了。Lecture 11 是组内展示周，没有单独的 slide deck，所以这里主要收录 1 到 10，以及 12、13 讲。",
    lectures: [
      {
        badge: "Lecture 01",
        title: "History of AI",
        body: "课程导论与 AI 历史脉络。",
        href: "/docs/comp9208/lectures/lecture-01.pdf",
        metrics: ["History", "Overview"]
      },
      {
        badge: "Lecture 02",
        title: "Perception and Actuation",
        body: "从 AI 历史延伸到 perception 与 actuation。",
        href: "/docs/comp9208/lectures/lecture-02.pdf",
        metrics: ["Perception", "Actuation"]
      },
      {
        badge: "Lecture 03",
        title: "Representation and Reasoning",
        body: "知识表示与推理基础。",
        href: "/docs/comp9208/lectures/lecture-03.pdf",
        metrics: ["Knowledge", "Reasoning"]
      },
      {
        badge: "Lecture 04",
        title: "Machine Learning",
        body: "机器学习基础内容与社会语境。",
        href: "/docs/comp9208/lectures/lecture-04.pdf",
        metrics: ["ML", "Models"]
      },
      {
        badge: "Lecture 05",
        title: "Natural Interaction",
        body: "人机自然交互与 AI 体验。",
        href: "/docs/comp9208/lectures/lecture-05.pdf",
        metrics: ["HCI", "Interaction"]
      },
      {
        badge: "Lecture 06",
        title: "Distributed AI",
        body: "多智能体、分布式推理与 swarm intelligence。",
        href: "/docs/comp9208/lectures/lecture-06.pdf",
        metrics: ["MAS", "Swarm"]
      },
      {
        badge: "Lecture 07",
        title: "From GOFAI to AGI",
        body: "从 GOFAI 走向 AGI 的讨论与争议。",
        href: "/docs/comp9208/lectures/lecture-07.pdf",
        metrics: ["GOFAI", "AGI"]
      },
      {
        badge: "Lecture 08",
        title: "Goal-driven AI and LAWS",
        body: "Goal-driven AI、search and rescue 与 LAWS。",
        href: "/docs/comp9208/lectures/lecture-08.pdf",
        metrics: ["Ethics", "Safety"]
      },
      {
        badge: "Lecture 09",
        title: "Language Models and Search Trees",
        body: "回顾 language models、search trees、situated behaviours 与 neural networks。",
        href: "/docs/comp9208/lectures/lecture-09.pdf",
        metrics: ["LLMs", "Search"]
      },
      {
        badge: "Lecture 10",
        title: "Robotic Swarms",
        body: "RoboCop vs RoboCup，群体机器人与多智能体系统。",
        href: "/docs/comp9208/lectures/lecture-10.pdf",
        metrics: ["Robotics", "Swarm"]
      },
      {
        badge: "Lecture 12",
        title: "Adversarial Machine Learning",
        body: "对抗机器学习与攻击面。",
        href: "/docs/comp9208/lectures/lecture-12.pdf",
        metrics: ["Adversarial", "Security"]
      },
      {
        badge: "Lecture 13",
        title: "AI Literacy and Social Impact",
        body: "AI literacy、社会感知与影响。",
        href: "/docs/comp9208/lectures/lecture-13.pdf",
        metrics: ["AI Literacy", "Society"]
      }
    ]
  },
  contact: {
    kicker: "Contact",
    title: "可以从这里联系我或继续看资料",
    summary: "如果你是想看完整经历、课程资料，或者直接试用我做的 AI 工具，都可以从这里继续点进去。",
    links: [
      { label: "Email / Sancia0423@gmail.com", href: "mailto:Sancia0423@gmail.com" },
      { label: "Resume PDF", href: "/docs/resume/xiaqi-resume.pdf" },
      { label: "COMP9208 Course Library", href: "#coursework" },
      { label: "YouTube Translator Demo", href: "/" }
    ]
  }
};
