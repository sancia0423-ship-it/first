export const personalSiteContent = {
  site: {
    title: "夏琪",
    subtitle: "AI 产品 / 数据分析 / 作品集网站",
    description:
      "夏琪的个人网站，包含自我介绍、简历、数据分析与 AI 产品项目、AI 学习资料，以及自己做的小工具。"
  },
  home: {
    hero: {
      kicker: "作品集式个人主页",
      titleIntro: "你好，我是",
      highlightWords: {
        first: "夏琪",
        second: "AI 产品",
        third: "数据分析"
      },
      titleMiddle: "，正在把",
      titleConnector: "和",
      titleOutro: "做成一个会持续更新的小网站。",
      lead:
        "我目前在悉尼大学读商业数据分析硕士，主修 Python、机器学习与数据分析。做过美团和得物的 AI 产品，也做过联合国儿童基金会的数据分析项目。我希望这个网站既能快速介绍我，也能把简历、作品、AI 学习资料和工具整合在一起。",
      badges: ["悉尼大学", "商业数据分析", "Python", "SQL", "AI 产品", "开放实习机会"]
    },
    photos: {
      kicker: "照片与日常",
      title: "这里会放我的照片、学习记录和作品截图",
      summary: "这一块我先把结构留出来。之后你只要把真实照片、活动记录或者作品截图换进去，首页就会更完整、更有个人感。",
      cards: [
        {
          label: "生活",
          caption: "可以放你平时的照片、城市记录或日常片段。",
          className: "photo-card photo-card-peach"
        },
        {
          label: "学习",
          caption: "可以放上课、做作业、整理课程资料时的照片。",
          className: "photo-card photo-card-mint"
        },
        {
          label: "项目",
          caption: "可以放数据分析作品截图、比赛现场或实习相关画面。",
          className: "photo-card photo-card-sky"
        }
      ]
    },
    about: {
      kicker: "自我介绍",
      title: "我想做能把模型能力、用户体验和业务结果连起来的工作",
      summary:
        "相比单纯讲模型，我更在意怎么把模型真正接进产品、接进流程、接进业务指标。所以我的经历会同时包含 AI 产品、数据分析和落地效果。",
      storyBadge: "一句话介绍",
      storyTitle: "悉尼大学商分硕士在读，偏 AI 产品与数据分析。",
      storyParagraphs: [
        "在美团实习时，我参与了金融保险电销 AI 化项目，负责购买流程设计、知识库与对话链路优化，推动 AI 独立承接售卖流程后的转化率由 7.44% 提升到 12.6%。",
        "在得物实习时，我参与 AIGC 文生图能力建设，从结构化 Prompt 方案、PRD、原型到评测体系，推动能力接入内容发布与商家工具链，帮助商品内容生产效率提升 5 到 6 倍。",
        "除了业务项目，我也在系统学习 AI and Society、adversarial machine learning、distributed AI、AI literacy 等内容，并把 lecture 和 assignment 整理成了可下载的资料页。"
      ],
      prompts: [
        {
          title: "我现在在做什么",
          body: "一边做 AI 产品与数据分析相关实习，一边把课程学习和 Demo 沉淀成作品集。"
        },
        {
          title: "我擅长什么",
          body: "Python、SQL、Prompt 设计、数据分析、实验设计、原型设计，以及用 AI 工具快速搭建原型。"
        },
        {
          title: "我想去哪里",
          body: "希望继续做 AI 产品、AIGC 应用、多模态工作流或偏产品导向的数据分析岗位。"
        }
      ]
    },
    projects: {
      kicker: "项目经历",
      title: "我做过的一些数据分析和 AI 产品项目",
      summary: "这里先放最能代表我的几段经历，后面你也可以继续往里加 dashboard、数据作品截图或单独项目页。",
      cards: [
        {
          badge: "Meituan",
          title: "金融保险 AI 电销流程优化",
          body: "负责购买流程、知识库与话术策略优化，把 AI 独立售卖链路真正跑通，推动转化率和成单效率一起提升。",
          metrics: ["AI Product", "Conversion", "Knowledge Base"]
        },
        {
          badge: "Dewu",
          title: "AIGC 文生图能力建设",
          body: "围绕商品内容生产设计结构化 Prompt、评测体系和功能原型，把能力接入商家工具链，提升内容供给效率。",
          metrics: ["AIGC", "Prompt", "Evaluation"]
        },
        {
          badge: "UNICEF",
          title: "募捐页面数据分析与推荐策略",
          body: "做用户分层、捐赠预测和策略评估，推动动态金额推荐上线，为后续投放和页面配置提供依据。",
          metrics: ["Data Analysis", "Experiment", "Impact"]
        }
      ]
    },
    resume: {
      kicker: "简历",
      title: "简历与个人资料",
      previewTitle: "夏琪 Resume",
      previewHint: "AI Product / Data Analysis / Business Analytics",
      viewHref: "/docs/resume/xiaqi-resume.pdf",
      highlights: [
        "美团 AI 电销项目中，AI 转化率由 7.44% 提升至 12.6%，日均新增订单稳定在 180 到 240 单。",
        "二开与三开交互链路优化后，将用户单轮操作时长从 1 分钟缩短到 20 秒。",
        "得物 AIGC 项目完成 MVP 上线并接入商家工具链，内容生产效率提升 5 到 6 倍。",
        "联合国儿童基金会项目推动动态金额推荐上线，页面支付转化效率提升 4.8%。"
      ],
      skills: ["Python", "SQL", "Machine Learning", "Prompt Design", "A/B Testing", "AI Product"]
    },
    learningPreview: {
      kicker: "学习资料",
      title: "AI 学习与文献资料",
      summary:
        "我会把课程 lecture、assignment、以后自己整理的 reading notes 和想保存的资料放在这个板块里，方便下载和回看。",
      items: [
        {
          title: "COMP9208 课程讲义",
          body: "课程讲义已经整理进站内，目前收录 1 到 10，以及 12、13 讲。",
          href: "/ai-learning"
        },
        {
          title: "课程作业资料",
          body: "包含 article review、AI case analysis 和 adversarial machine learning report 三份作业资料。",
          href: "/ai-learning"
        },
        {
          title: "文献与学习笔记",
          body: "后面可以继续放论文、学习笔记、读书笔记和自己整理的 AI 资料。",
          href: "/ai-learning"
        }
      ]
    },
    toolsPreview: {
      kicker: "小工具",
      title: "我做的一些小工具",
      summary: "工具页会集中放我自己做的小功能，现在先接进来 YouTube 翻译、信息搜索和模拟面试三个入口。",
      cards: [
        {
          title: "YouTube 中文翻译",
          body: "把公开视频字幕翻成中文，支持原文对照、SRT 下载和中文朗读。",
          href: "/tools"
        },
        {
          title: "信息搜索",
          body: "适合做研究和资料整理，帮助快速收集和总结信息。",
          href: "/search"
        },
        {
          title: "模拟面试",
          body: "用于练习表达、模拟问答和拿到结构化反馈。",
          href: "/mock"
        }
      ]
    },
    contact: {
      kicker: "联系与入口",
      title: "如果你想继续看资料、作品或联系我",
      summary: "这里先保留最核心的几个入口。后面如果你想加 LinkedIn、邮箱按钮或更多社交链接，也很容易继续扩展。",
      links: [
        { label: "Email / Sancia0423@gmail.com", href: "mailto:Sancia0423@gmail.com" },
        { label: "Resume PDF", href: "/docs/resume/xiaqi-resume.pdf" },
        { label: "AI 学习资料", href: "/ai-learning" },
        { label: "小工具", href: "/tools" }
      ]
    }
  },
  learning: {
    hero: {
      kicker: "AI 学习资料库",
      title: "AI 学习与文献资料",
      lead:
        "这个页面集中放我现在学过以后觉得很好的资料、一些小练习，之后也会继续补充，希望大家可以一起学习。我打算把这里慢慢做成自己的一个知识库。"
    },
    overviewCards: [
      {
        label: "课程资料",
        title: "AI 基础入门文件",
        body: "目前我在学一些 AI 通识和基础入门相关的内容。这一组文件每一个都有简单介绍，可以按照顺序慢慢看，用来建立对 AI 的基础理解。"
      },
      {
        label: "文献与笔记",
        title: "文献笔记",
        body: "这里先把我整理在 Word 里的 article 清单放进来，后面也会继续补充自己看过的文献、笔记和一些想法。"
      }
    ],
    practice: {
      kicker: "小练习",
      title: "小练习",
      summary: "这个板块先留出来，后面我会慢慢把自己做过的小练习、随手实验和学习记录补进来。",
      emptyTitle: "这个板块之后会继续补充",
      emptyBody: "现在先把作业资料去掉，后面这里会换成更适合展示的小练习内容。"
    },
    referenceShelf: {
      kicker: "文献笔记",
      title: "Articles 文献清单",
      summary: "这里先把 `Articles.docx` 里的文章全部整理进来。之后我会继续在这个板块补充自己看过的内容、阅读记录和简单笔记。",
      fileHref: "/docs/ai-learning/articles/articles.docx",
      items: [
        {
          tag: "Article 01",
          title: "Computing Machinery and Intelligence",
          body: "Alan Turing · 1950"
        },
        {
          tag: "Article 02",
          title: "A Chess-Playing Machine",
          body: "Claude E. Shannon · 1950"
        },
        {
          tag: "Article 03",
          title: "Why Should Machines Learn",
          body: "Herbert Simon · 1983"
        },
        {
          tag: "Article 04",
          title: "Flocks, Herds, and Schools: A Distributed Behavioral Model",
          body: "Craig Reynolds · 1987"
        },
        {
          tag: "Article 05",
          title: "Elephants Don't Play Chess",
          body: "Rodney A. Brooks · 1990"
        },
        {
          tag: "Article 06",
          title: "The Myth of the Last Metaphor",
          body: "Joseph Weizenbaum · 1995"
        },
        {
          tag: "Article 07",
          title: "RoboCup: The Robot World Cup Initiative",
          body: "Hiroaki Kitano et al. · 1996"
        },
        {
          tag: "Article 08",
          title: "The RoboCup Synthetic Agent Challenge",
          body: "Hiroaki Kitano et al. · 1997"
        },
        {
          tag: "Article 09",
          title: "Perceptron, Encyclopedia of Computer Science",
          body: "Laveen Kanal · 2003"
        },
        {
          tag: "Article 10",
          title: "Is Chess the Drosophila of Artificial Intelligence? A Social History of an Algorithm",
          body: "Nathan Ensmenger · 2012"
        },
        {
          tag: "Article 11",
          title: "A Few Useful Things to Know About Machine Learning",
          body: "Pedro Domingos · 2012"
        },
        {
          tag: "Article 12",
          title: "Overview on DeepMind and Its AlphaGo Zero AI",
          body: "Sean Holcomb et al. · 2018"
        },
        {
          tag: "Article 13",
          title: "Conversations with ELIZA on Gender and Artificial Intelligence",
          body: "Pedro Costa and Luisa Ribas · 2018"
        },
        {
          tag: "Article 14",
          title: "The Five Tribes of Machine-Learning: A Brief Overview",
          body: "Jens Pohl · 2019"
        },
        {
          tag: "Article 15",
          title: "Deep New: The Shifting Narratives of Artificial Intelligence from Deep Blue to AlphaGo",
          body: "Paolo Bory · 2019"
        },
        {
          tag: "Article 16",
          title: "ChatGPT Is a Blurry JPEG of the Web",
          body: "Ted Chiang · 2023"
        },
        {
          tag: "Article 17",
          title: "Steps Toward Artificial Intelligence",
          body: "Minsky · 1961"
        },
        {
          tag: "Article 18",
          title: "Learning Representations by Back-Propagating Errors",
          body: "Rumelhart et al. · 1986"
        },
        {
          tag: "Article 19",
          title: "Heuristic Problem Solving The Next Advance in Operations Research",
          body: "Simon and Newell · 1958"
        },
        {
          tag: "Article 20",
          title: "Intelligence Without Representation",
          body: "Brooks · 1991"
        },
        {
          tag: "Article 21",
          title: "Deep Learning",
          body: "LeCun et al. · 2015"
        },
        {
          tag: "Article 22",
          title: "ImageNet Classification with Deep Convolutional Neural Networks",
          body: "Krizhevsky et al. · 2012"
        },
        {
          tag: "Article 23",
          title: "Datasheets for Datasets",
          body: "Gebru et al. · 2018"
        },
        {
          tag: "Article 24",
          title: "There is a Blind Spot in AI Research",
          body: "Crawford and Calo · 2016"
        }
      ]
    },
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
    ],
    assignments: []
  },
  tools: {
    hero: {
      kicker: "工具区",
      title: "我做的一些小工具",
      lead:
        "这里放我现在做过的小工具。你可以把它看成是一个实验区，一边展示我会做什么，一边也真的可以直接用。"
    },
    cards: [
      {
        label: "工具 01",
        title: "YouTube 中文翻译",
        body: "读取公开视频字幕，生成中文字幕、原文对照和可下载 SRT，还能打开中文朗读。",
        href: "#youtube-tool",
        action: "直接试用"
      },
      {
        label: "工具 02",
        title: "信息搜索",
        body: "适合做资料检索、内容整理和快速研究验证。",
        href: "/search",
        action: "打开搜索"
      },
      {
        label: "工具 03",
        title: "模拟面试",
        body: "把面试问题、回答练习和反馈放在一条链路里。",
        href: "/mock",
        action: "开始练习"
      }
    ],
    noteTitle: "之后这里还可以继续加",
    noteBody:
      "如果你后面还想放更多功能，比如简历分析器、论文摘要器、课程问答助手、数据作品展示小组件，都可以继续接进这个工具页。"
  }
} as const;
