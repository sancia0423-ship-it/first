export const portfolioContent = {
  site: {
    title: "Colorful Portfolio",
    subtitle: "self intro, videos, writing, data projects",
    description: "一个彩色、可爱、适合放自我介绍、YouTube、简历、文章和数据分析项目的个人网站。",
    brandMark: "ME",
    headerBadge: "Pastel mode"
  },
  navItems: [
    { label: "About", href: "/#about" },
    { label: "Videos", href: "/#videos" },
    { label: "Resume", href: "/#resume" },
    { label: "Articles", href: "/#articles" },
    { label: "Projects", href: "/#projects" }
  ],
  hero: {
    kicker: "Colorful Personal Website",
    highlightWords: {
      first: "故事",
      second: "视频",
      third: "数据项目"
    },
    titleIntro: "把你的",
    titleMiddle: "和",
    titleOutro: "做成一座会发光的小展厅。",
    lead: "我把首页设计成一张可爱的个人作品海报: 先让别人快速认识你，再继续看你的 YouTube、自我介绍视频、简历、文章和数据分析项目。后面你只需要把真实内容替换进去，就能直接拿去用。",
    featureBadges: ["自我介绍", "YouTube", "Resume", "Articles", "Data Projects"],
    ctas: [
      { label: "看项目展示", href: "/#projects", kind: "primary" as const },
      { label: "看视频区块", href: "/#videos", kind: "ghost" as const },
      { label: "看简历模块", href: "/#resume", kind: "ghost" as const }
    ],
    showcaseTitle: "可爱、彩色、清楚、很像一本正在打开的个人手账。",
    showcaseCards: [
      {
        label: "Intro First",
        body: "先认识你，再看内容，不让作品变成一堆没有上下文的链接。",
        className: "mini-card mini-card-sun"
      },
      {
        label: "Video Friendly",
        body: "首页天然适合放 YouTube 频道预告、自我介绍视频和精选播放列表。",
        className: "mini-card mini-card-mint"
      },
      {
        label: "Data With Personality",
        body: "数据分析项目不再只是冷冰冰的截图，而是能和你的表达风格放在一起。",
        className: "mini-card mini-card-sky"
      }
    ]
  },
  about: {
    kicker: "About",
    title: "先用一小段话，把你介绍得有记忆点",
    summary: "这一块建议像“电梯自我介绍”一样，短、准、有气质。别人 20 秒内就能知道你是谁、在做什么，以及为什么要继续往下看。",
    storyBadge: "30-second intro",
    storyTitle: "Hi, this is my little corner of the internet.",
    storyParagraphs: [
      "这里可以放一段第一人称介绍: 你是怎样的人、你正在探索什么、你最想被别人记住的能力是什么。建议保留一点温度，而不是把自己写成一份扁平化简历。",
      "如果你愿意，也可以在这里加一句更有个人风格的话，比如你为什么开始做视频、为什么喜欢数据、为什么在意表达和故事。"
    ],
    prompts: [
      {
        title: "我是谁",
        body: "用一句话写清你的身份，比如创作者、学生、分析师，或者你最想被记住的标签。"
      },
      {
        title: "我在做什么",
        body: "这里适合放你最近正在做的内容，例如频道更新、研究主题、求职方向或合作计划。"
      },
      {
        title: "我擅长什么",
        body: "把视频表达、写作、数据分析、项目策划这些能力，浓缩成 2 到 3 个关键词。"
      }
    ]
  },
  videos: {
    kicker: "Video Corner",
    title: "把频道内容和自我介绍视频放在最有氛围的位置",
    summary: "这一屏分成两块: 左边像频道橱窗，右边像自我介绍短片卡片，既适合创作者，也适合求职展示。",
    youtubeLabel: "YouTube Feature",
    youtubeTitle: "把你的频道 trailer 或精选视频嵌在这里",
    youtubeBody: "后续把 iframe 换进去，这一块就能直接作为首页主视觉播放窗口。",
    playlistCards: [
      {
        title: "频道 Trailer",
        body: "把你的频道介绍、代表作合集，或者最能体现风格的一支视频放在这里。"
      },
      {
        title: "内容系列",
        body: "比如学习记录、作品拆解、生活更新、数据分析笔记，适合用 playlist 卡片来组织。"
      },
      {
        title: "更新节奏",
        body: "可以写每周更新什么、观众能期待什么，让第一次点进来的人马上知道你的气质。"
      }
    ],
    introBadge: "Intro reel",
    introTitle: "自我介绍视频建议控制在 60 到 90 秒",
    introBody: "这张卡片适合放你自己的介绍视频封面、讲稿提示，或者一段“为什么来这里看我”的引导。视觉上它会和频道区分开，像一张单独的明星卡。",
    introOutline: [
      "前 15 秒：一句话介绍你是谁，以及你现在最关注什么。",
      "中间 30 秒：展示你做过的视频、写作或项目，强调你如何思考和执行。",
      "最后 15 秒：告诉别人你希望连接到什么机会，例如实习、合作或内容共创。"
    ]
  },
  resume: {
    kicker: "Resume Wall",
    title: "简历模块像一张被钉起来的作品页",
    previewTitle: "Your Resume Preview",
    previewHint: "replace with `public/resume.pdf`",
    highlights: [
      "教育经历、实习经历、项目经历用三段式排版，最适合扫描式阅读。",
      "把最强的 3 个能力写成标签，放在简历卡片顶部，会比纯段落更有记忆点。",
      "后续只要把 PDF 放进 `public/resume.pdf`，这一块就可以直接变成下载入口。"
    ]
  },
  articles: {
    kicker: "Writing",
    title: "文章区适合放观点、复盘和专题系列",
    cards: [
      {
        tag: "Essay 01",
        title: "把一篇文章做成“值得分享”的故事",
        body: "适合放观点型长文、留学或求职复盘、创作心得，或者你对某个社会话题的观察。"
      },
      {
        tag: "Essay 02",
        title: "我如何把复杂问题解释给更多人听",
        body: "这一张可以放方法论型内容，例如学习框架、生产力流程、选题拆解或表达训练。"
      },
      {
        tag: "Essay 03",
        title: "从兴趣到作品：一个项目的完整成长记录",
        body: "如果你有持续更新的系列文章，这里很适合做成专题入口，方便别人继续点进去看。"
      }
    ]
  },
  projects: {
    kicker: "Data Projects",
    title: "项目区用来证明你不只会表达，也会分析和落地",
    summary: "这里我做成三张项目卡，适合放 dashboard、文本分析、实验设计或任何你想展示判断力的作品。",
    cards: [
      {
        badge: "Project 01",
        title: "用户增长漏斗分析",
        body: "展示你如何从注册、留存、转化、流失四个阶段拆解问题，再用图表和结论把故事讲完整。",
        metrics: ["SQL", "Dashboard", "Cohort"]
      },
      {
        badge: "Project 02",
        title: "社交媒体情绪与内容表现",
        body: "很适合放文本分析、情绪分类、话题聚类这类项目，也能自然连接你的视频或文章主题。",
        metrics: ["Python", "NLP", "Visualization"]
      },
      {
        badge: "Project 03",
        title: "A/B Test 与策略复盘",
        body: "如果你做过实验设计、推荐策略或运营活动评估，这一块可以突出你的判断力和商业感觉。",
        metrics: ["Experiment", "Insight", "Storytelling"]
      }
    ]
  },
  contact: {
    kicker: "Contact",
    title: "最后收成一个轻松但清楚的联系区",
    summary: "这一块适合放邮箱、频道、社交账号和一句行动邀请。别人看完内容之后，可以很自然地从这里联系你。",
    pills: ["yourname@email.com", "YouTube / @yourchannel", "LinkedIn / your-name", "GitHub / your-name"]
  }
};
