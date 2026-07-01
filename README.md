# Interview Intel MVP

这是一个真实可跑的 AI Demo 集合。现在它有三条可演示的主链路：

1. `Mock Interview`：选择 AI 产品方向 -> 系统扮演面试官提问 -> 逐题评分、追问和总结
2. `Interview Briefing`：输入公司、岗位、方向 -> 系统召回公开面经 -> 聚合成准备简报
3. `YouTube Translate Agent`：输入 YouTube 链接 -> 系统读取字幕 -> 生成中文字幕，并支持浏览器中文跟读

最早这个项目先从面经情报 MVP 起步，但现在已经补上了可直接演示的模拟面试链路。

原始的情报链路仍然是：

用户输入公司、岗位、方向 -> 系统召回公开面经/复盘 -> 抽取结构化面试信息 -> 聚合出快速准备结论 -> 展示可追溯证据

当前版本已经具备：

- 产品文档和数据库设计
- 一套可运行的 Next.js 应用
- 一条可跑通的 AI 产品模拟面试链路
- 牛客 + 掘金公开内容的真实召回
- 面经详情页的正文提取
- 无 key 可运行、配 key 可升级的抽取路径
- 回退演示数据，确保页面始终可用

## 运行方式

```bash
npm install
npm run dev
```

默认访问：

- 首页：`http://localhost:3000`
- YouTube 翻译：`http://localhost:3000/youtube`
- 模拟面试：`http://localhost:3000/mock`
- 结果页示例：`http://localhost:3000/search?company=字节跳动&role=产品经理实习&direction=增长`
- API 示例：`http://localhost:3000/api/search?company=字节跳动&role=产品经理实习&direction=增长`
- 健康检查：`http://localhost:3000/api/health`

## 环境变量

可选环境变量如下：

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
```

不配置 `OPENAI_API_KEY` 时：

- 系统仍然可以跑
- 模拟面试走本地题库和规则评分
- 正文抽取走规则解析
- YouTube 翻译会自动回退到本地 Google 翻译脚本，不影响基础使用

配置 `OPENAI_API_KEY` 后：

- 模拟面试会优先走动态 AI 出题与点评
- 系统会自动尝试走结构化 AI 抽取
- 某条来源 AI 抽取失败时，会自动回退到规则解析
- YouTube 翻译会优先走 OpenAI 字幕翻译，并补一段中文重点速览

## 当前技术选择

为了让你本地今天就能跑起来，这一版刻意选了最小可行方案：

- 前端：Next.js App Router
- 服务层：同仓库 route handlers + server-side pipeline
- 数据层：公开网页 + 本地文件缓存
- AI 层：OpenAI 可选，规则抽取始终可用

## 目录结构

```text
interview-intel-mvp/
├─ app/
│  ├─ api/mock-interview/route.ts # 模拟面试 API
│  ├─ api/search/route.ts        # 对外 API
│  ├─ mock/page.tsx              # 模拟面试页
│  ├─ search/page.tsx            # 搜索结果页
│  ├─ globals.css                # 全局样式
│  ├─ layout.tsx                 # 根布局
│  └─ page.tsx                   # 首页
├─ components/
│  ├─ mock-interview-demo.tsx    # 模拟面试交互
│  ├─ results-view.tsx           # 结果页展示
│  └─ search-form.tsx            # 查询表单
├─ lib/
│  ├─ data/mock.ts               # 回退演示数据
│  ├─ mock-interview.ts          # 面试题库、评分与总结
│  ├─ pipeline/
│  │  ├─ aggregation.ts          # 聚合逻辑
│  │  ├─ cache.ts                # 本地文件缓存
│  │  ├─ extraction.ts           # AI/规则双通道抽取
│  │  ├─ http.ts                 # 服务端抓取工具
│  │  ├─ juejin.ts               # 掘金搜索与详情解析
│  │  ├─ nowcoder.ts             # 牛客搜索与详情解析
│  │  ├─ orchestrator.ts         # 主流程编排
│  │  ├─ query-expansion.ts      # 查询扩展
│  │  ├─ relevance.ts            # 来源相关性过滤
│  │  ├─ retrieval.ts            # 真实召回 + 回退样本
│  │  └─ text.ts                 # 文本清洗与格式转换
│  └─ schemas.ts                 # 类型和 schema
├─ docs/
│  ├─ database-design.md
│  ├─ implementation-roadmap.md
│  ├─ mvp-prd.md
│  ├─ page-wireframes.md
│  └─ prompt-design.md
├─ .env.example
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```

## 当前版本的真实能力

现在这版已经可以：

1. 根据岗位方向发起一场 AI 产品模拟面试
2. 对单题回答给出评分、追问和更强回答结构
3. 汇总整场面试的维度得分和下一轮练习建议
4. 根据公司、岗位、方向生成检索 query
5. 去牛客和掘金的公开内容里召回候选面经
6. 抓详情页正文并清洗
7. 提炼面试轮次、常见题型和准备重点
8. 聚合成结果页和 API 输出
9. 读取公开视频字幕并同步翻译成中文字幕
10. 下载中文 `.srt`
11. 用浏览器中文语音跟着当前字幕朗读

## 下一步最值得做什么

建议按这个顺序继续迭代：

1. 扩更多公开来源
2. 把规则抽取效果打磨稳
3. 加 SQLite/Postgres 缓存
4. 做用户纠错和收藏
5. 最后再补管理台和导出能力

## 对外公开部署

这套项目现在已经可以部署成公开网站。

推荐方式：

- `Railway`
- `Render`

不建议第一版直接上 `Vercel`，因为当前 YouTube 翻译链路会在服务端调用本地 Python 回退脚本，更适合用 Docker 容器整体部署。

仓库里已经补好的部署文件：

- `Dockerfile`
- `.dockerignore`
- `requirements.txt`
- `/api/health`

本地容器自测：

```bash
npm run docker:build
npm run docker:run
```

更完整的上线说明见：

- [公开部署说明](./docs/public-deployment.md)

## 文档入口

- [实现路线图](./docs/implementation-roadmap.md)
- [MVP PRD](./docs/mvp-prd.md)
- [数据库设计](./docs/database-design.md)
- [Prompt 设计](./docs/prompt-design.md)
- [页面线框](./docs/page-wireframes.md)

## 你在面试里可以怎么讲

“我没有把它直接做成一个全网爬虫，而是先定义成一个面试情报产品。第一版聚焦公开可访问、结构稳定的来源，先把可信结论、证据展示和结构化抽取做出来，再逐步扩站点和数据层。”
