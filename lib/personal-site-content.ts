export const personalSiteContent = {
  site: {
    /** Browser tab / metadata name. */
    siteName: "sancia_aboutme",
    /** Display name in the masthead. */
    title: "夏琪",
    handle: "sancia",
    subtitle: "AI 产品 / 数据分析",
    /** 个性签名。跟在名字下面，一句话交代我做这些事情的出发点。 */
    tagline: "AI 是新的生产力",
    description:
      "这个网站有我的介绍和学习资料，有自己做的工具，做得很简单。"
  },
  home: {
    hero: {
      kicker: "Hi, I am sancia",
      titleIntro: "我是夏琪",
      highlightWords: {
        first: "",
        second: "",
        third: ""
      },
      titleMiddle: "",
      titleConnector: "",
      titleOutro: "",
      lead: "温暖、好奇、生命力",
      badges: []
    },
    about: {
      kicker: "ABOUT ME",
      title: "hello，我叫夏琪",
      summary: "",
      storyBadge: "",
      storyTitle: "",
      /** 夏琪自己写的原文，逐字照录。 */
      storyParagraphs: [
        "hello，我叫夏琪，悉尼大学商业数据分析硕士在读，预计 2026 年底毕业。",
        "过去，在美团和得物做过 AI 产品实习。",
        "未来，我希望继续沿着 AI 产品这条路探索，做真正有价值、有意思的产品。",
        "能力：熟练使用 Python 和 SQL，具备良好的代码理解与基础开发能力，可完成数据处理、模型调用及简单功能实现。"
      ],
      prompts: []
    },
    projects: {
      kicker: "",
      title: "项目展示",
      summary: "",
      /** 四张卡的文案逐字用夏琪自己写的，不改写不增补。 */
      cards: [
        {
          title: "美团AI电销",
          lines: [
            "参与美团 AI 电销机器人从 0 到 1 的产品建设",
            "负责核心业务链路优化，推动转化率与成单效率同步提升"
          ],
          image: "/images/projects/meituan-polaroid.jpg",
          imageAlt: "美团实习期间的拍立得合影",
          imageWidth: 570,
          imageHeight: 656
        },
        {
          title: "得物AIGC板块",
          lines: [
            "参与商家 AI 素材创作平台的 AIGC 文生图板块建设，5 个月完成 MVP 上线并接入内容发布与商家工具链"
          ],
          image: "/images/projects/dewu-art.png",
          imageAlt: "",
          imageWidth: 177,
          imageHeight: 291
        },
        {
          title: "",
          lines: ["为悉尼新洲政府 IDE 部门做数分报告（校企合作）"],
          image: "/images/projects/nsw-tableau.png",
          imageAlt: "澳洲职场性别平等 Tableau 看板",
          imageWidth: 1600,
          imageHeight: 1900
        },
        {
          title: "",
          lines: ["为澳洲联合国儿童基金会搭建预测模型，并提供最终数据分析报告（校企合作）"],
          image: "/images/projects/unicef-art.png",
          imageAlt: "",
          imageWidth: 235,
          imageHeight: 260
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
    contact: {
      kicker: "Got questions?",
      title: "期待你的联系",
      summary: "",
      email: "sancia0423@gmail.com",
      links: [
        { label: "LinkedIn", href: "https://www.linkedin.com/in/xiaqi77sancia/" },
        { label: "Email", href: "mailto:sancia0423@gmail.com" }
      ]
    }
  },
  learning: {
    hero: {
      kicker: "",
      title: "AI 学习与文献资料",
      lead: "这个页面集中记录我觉得不错的学习资料和文献。"
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
      summary:
        "这里先把我看的重要的 `Articles.docx` 里的文章全部整理进来。之后我会继续在这个板块补充自己看过的内容、阅读记录和简单笔记。",
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
      kicker: "",
      title: "我做过的小工具"
    },
    /** 夏琪自己写的开发者日志，逐字照录，不改写不增补。 */
    feature: {
      name: "越语听",
      tagline: "第二语言长播客理解 AI",
      logTitle: "开发者日志",
      log: [
        "这个工具，来源于我自己的一个小困扰。",
        "我很喜欢在打扫卫生、走路或者做家务的时候听 YouTube 长播客。但我发现，当播客使用第二语言时，我很容易走神，对信息的理解和吸收也明显低于母语内容。",
        "后来问了一圈身边的人，发现很多人都有类似的问题：很难在放松的场景里持续跟上长时间、高密度的第二语言播客。",
        "于是，这个让英文长播客变得更容易理解的 AI 工具就做出来了。",
        "只需要粘贴 YouTube 长播客视频链接，它就可以自动获取字幕、完成翻译，并生成可以直接收听的中文内容。你也可以点击任意字幕片段，针对具体内容直接向 AI 提问。",
        "我还为它设计了一套内容理解 Prompt，让 AI 在读完整期内容后成为这期播客的内容专家：你可以继续追问具体观点、概念或细节，也可以让它总结重点、解释上下文，甚至围绕内容继续深入讨论。",
        "每天提供 3 次免费体验；如果希望长期多次使用，也可以填写自己的 API Key。",
        "目前支持字幕获取、翻译与下载，同时提供 MCP 模式，方便在不同使用场景下快速调用。",
        "我希望它不只是一个翻译工具，而是能让英文播客真正进入日常生活，无论走路、通勤还是做家务，都能随时听懂即使是其他语言、但是自己感兴趣的内容，减少语言带来的理解门槛。"
      ],
      href: "/tools/youtube",
      action: "打开越语听"
    }
  }
} as const;
