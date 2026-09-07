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

提交前建议跑一遍本地校验（CI 也跑同样这四条）：

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

默认访问：

- 首页：`http://localhost:3000`
- YouTube 翻译：`http://localhost:3000/youtube`
- 模拟面试：`http://localhost:3000/mock`
- 结果页示例：`http://localhost:3000/search?company=字节跳动&role=产品经理实习&direction=增长`
- API 示例：`http://localhost:3000/api/search?company=字节跳动&role=产品经理实习&direction=增长`
- 健康检查：`http://localhost:3000/api/health`

## 视觉风格

全站是一套极简编辑风格的设计系统，参考 willhandley.net，规则写在 `app/globals.css` 顶部：

- **只有一个字号**。层级靠 `⎯` 分隔线、黑/灰对比和留白建立，不靠放大字号
- **没有装饰**。无卡片边框、无圆角、无阴影、无填充色
- **没有颜色**。只有纸灰 `#eee`、墨黑和两级灰
- 左侧固定栏承载身份和导航，右侧单列正文滚动

唯一偏离参考站的地方：参考站正文是 11.66px，汉字在这个尺寸下不可读，所以正文取 13px、
拉丁文元信息取 11.5px。

改样式基本只需要动 `app/globals.css` 里的 token，组件层不带任何视觉细节。

## 对外 API 与 MCP

三个工具都有对应的公开接口，并打包成了一个 MCP server。网页、REST API 和 MCP
共用同一套服务端逻辑，不会出现行为分叉。

| 端点 | 说明 |
| --- | --- |
| `GET /api/v1/health` | 服务状态、是否需要 key、是否处于增强模式 |
| `POST /api/v1/youtube/translate` | YouTube 字幕中文翻译，返回时间轴字幕与 SRT |
| `GET /api/v1/interview/briefing` | 按公司/岗位/方向生成结构化面经简报 |
| `POST /api/v1/interview/mock` | 模拟面试：`start` / `evaluate` / `summary` |
| `GET /api/openapi.json` | OpenAPI 3.1 规范，由服务端的 zod schema 直接生成 |

接口仍然可用，但站点导航里不再展示 —— 这是个人作品集，API 说明留在这份 README 和 `/api/openapi.json` 里。

鉴权由 `API_KEYS` 控制：配置后 `/api/v1/*` 需要 `Authorization: Bearer <key>`，
不配置则开放访问（本地开发方便，公网部署前记得配上）。

### MCP server

`mcp/server.mjs` 是一个标准 MCP server（stdio），暴露 5 个工具：
`check_service_status`、`translate_youtube_video`、`get_interview_briefing`、
`start_mock_interview`、`evaluate_interview_answer`。

它只是 HTTP API 的薄封装，不需要单独部署。接进 Claude Desktop：

```json
{
  "mcpServers": {
    "sancia-tools": {
      "command": "node",
      "args": ["/absolute/path/to/first/mcp/server.mjs"],
      "env": {
        "SANCIA_API_BASE_URL": "https://your-domain.com",
        "SANCIA_API_KEY": "your-api-key"
      }
    }
  }
}
```

自测（需要另一个终端里先 `npm run dev`）：

```bash
npm run mcp:smoke
```

## 环境变量

完整清单见 `.env.example`。最常用的三个：

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
NEXT_PUBLIC_SITE_URL=
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

所有模型名和超时都收敛在 `lib/config.ts`，还可以按需覆盖
`OPENAI_TIMEOUT_MS`、`PYTHON_SCRIPT_TIMEOUT_MS`、`MAX_CAPTION_SEGMENTS`、
`RATE_LIMIT_MAX_HITS`、`CACHE_BACKEND` 等，默认值都写在 `.env.example` 里。

## 当前技术选择

为了让你本地今天就能跑起来，这一版刻意选了最小可行方案：

- 前端：Next.js App Router
- 服务层：同仓库 route handlers + server-side pipeline
- 数据层：公开网页 + 本地文件缓存
- AI 层：OpenAI 可选，规则抽取始终可用

## 目录结构

```text
first/
├─ app/
│  ├─ api/v1/                      # 公开 REST API（鉴权 + 限流）
│  │  ├─ health/route.ts
│  │  ├─ youtube/translate/route.ts
│  │  └─ interview/{briefing,mock}/route.ts
│  ├─ api/openapi.json/route.ts    # 由 zod schema 生成的 OpenAPI 3.1
│  ├─ api/{health,search,mock-interview,youtube-translate}/route.ts  # 站点内部路由
│  ├─ api-docs/page.tsx            # API 与 MCP 文档页
│  ├─ ai-learning/page.tsx         # AI 学习资料库
│  ├─ mock/page.tsx                # 模拟面试页
│  ├─ search/page.tsx              # 快速准备结果页
│  ├─ tools/page.tsx               # 小工具聚合页
│  ├─ robots.ts / sitemap.ts       # SEO 元数据
│  ├─ globals.css                  # 极简设计系统（规则写在文件顶部）
│  ├─ layout.tsx                   # 根布局与站点 metadata
│  └─ page.tsx                     # 个人主页
├─ components/                     # 页面与交互组件
├─ mcp/
│  ├─ server.mjs                   # MCP server（stdio，5 个工具）
│  └─ smoke-test.mjs               # 端到端自测
├─ lib/
│  ├─ config.ts                    # 模型、超时、限流等统一配置
│  ├─ concurrency.ts               # 有上限的并发执行器
│  ├─ api/
│  │  ├─ auth.ts                   # API key 校验
│  │  ├─ contracts.ts              # 共享请求契约
│  │  ├─ guards.ts                 # 限流与对外错误信息处理
│  │  ├─ openapi.ts                # OpenAPI 文档生成
│  │  └─ v1.ts                     # /api/v1 公共处理流程
│  ├─ mock-interview.ts            # 面试题库、评分与总结
│  ├─ personal-site-content.ts     # 个人站点文案
│  ├─ pipeline/                    # 检索、抽取、聚合、缓存、限流
│  ├─ schemas.ts                   # 类型和 schema
│  └─ youtube-agent/               # 字幕读取、翻译与 python 调用封装
├─ __tests__/                      # vitest 单测
├─ docs/                           # 产品、设计与部署文档
├─ .github/workflows/ci.yml        # lint / typecheck / test / build
├─ Dockerfile
├─ eslint.config.mjs
└─ package.json
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

字幕通过 Supadata 官方 API 读取，不再依赖任何本地脚本，所以对部署平台没有特殊要求。

仓库里已经补好的部署文件：

- `Dockerfile`
- `.dockerignore`
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
