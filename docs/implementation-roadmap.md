# Implementation Roadmap

## 1. 先定一个真实可做的目标

这个项目最容易失败的方式，是一开始就把它理解成“我要做一个能爬全网面经的网站”。那样你会卡在：

- 站点差异太大
- 反爬太重
- 内容格式混乱
- 抽取和聚合逻辑没有稳定输入

所以我们的真实目标应该是：

先做一个能把“少量公开来源”转成“可信面试报告”的 MVP，确保每条结论都能追到来源片段。

## 2. 当前版本已经做到什么

当前仓库已经不是只有骨架，而是已经跑通了一条单源真实链路：

- 公开搜索召回：牛客
- 公开正文抓取：牛客面经详情页
- 正文抽取：规则抽取，可选 OpenAI 升级
- 结果输出：页面和 API 共用同一份聚合结果

仓库结构仍然按未来真实系统的形状拆好了：

### Web 层

- `app/page.tsx`
- `app/search/page.tsx`
- `app/api/search/route.ts`

负责：

- 用户输入
- 结果展示
- API 输出

### Pipeline 层

- `lib/pipeline/query-expansion.ts`
- `lib/pipeline/retrieval.ts`
- `lib/pipeline/extraction.ts`
- `lib/pipeline/aggregation.ts`
- `lib/pipeline/orchestrator.ts`

负责：

- 查询扩展
- 内容召回
- 抽取
- 聚合
- 主流程编排

### Data 层

- `lib/data/mock.ts`
- `lib/schemas.ts`

负责：

- 回退样本数据
- 类型契约
- 和真实来源 / LLM 输出对齐的 schema

## 3. 我们接下来按这 4 个阶段做

## Phase 1：把单源真实闭环跑稳

目标：

- 页面跑起来
- 输入查询能返回真实来源结果
- API 和页面使用同一套 pipeline

验收标准：

- `npm run dev` 能跑
- `/search` 能出真实结果
- `/api/search` 返回结构化 JSON

当前状态：已完成

## Phase 2：扩更多真实来源

目标：

- 不改页面，不改聚合，把来源从“牛客单源”扩成“多公开源”

推荐方案：

- 新增其他公开社区来源
- 或者接更稳定的搜索 API 作为补强

产出：

- URL 列表
- 标题
- 摘要
- 发布时间
- 初步相关度

你只需要继续沿用当前 `SourceCandidate -> 正文 -> InterviewSignal` 这条数据契约，不需要重做页面。

## Phase 3：接正文提取与结构化抽取

目标：

- 对 URL 抓正文
- 做清洗
- 交给模型抽取成 schema

实现拆法：

1. `retrieval.ts` 先返回候选链接
2. 新增 `fetch-source.ts` 抓取正文
3. `extraction.ts` 调 OpenAI 结构化输出
4. 输出对齐 `InterviewSignal`

验收标准：

- 至少 10 篇真实样本能稳定抽取
- 抽取字段有 evidence snippets
- 失败样本可见失败原因

## Phase 4：接存储和缓存

目标：

- 把查询结果缓存起来
- 后续支持重复查询秒回
- 给来源管理页提供数据

建议本地顺序：

1. 先 SQLite
2. 再 Postgres

本地先不追求完美架构，先保证能落库、能查、能复用。

## 4. 模块替换顺序

最推荐的替换顺序如下：

1. `lib/pipeline/retrieval.ts`
2. `lib/pipeline/extraction.ts`
3. `lib/data/mock.ts`
4. `lib/pipeline/aggregation.ts`
5. `app/search/page.tsx`

原因：

- 前两步替换掉以后，系统就开始接近真实产品
- 聚合和页面暂时可以稳定复用
- UI 不用跟着频繁改

## 5. 每个模块要负责什么

### `query-expansion.ts`

输入：

- 公司
- 岗位
- 方向

输出：

- 公司别名
- 岗位同义词
- 方向扩展词
- 搜索 query 列表

### `retrieval.ts`

输入：

- 用户查询
- 扩展词

输出：

- 候选来源列表

后续真实字段建议：

- `url`
- `title`
- `snippet`
- `domain`
- `publishedAt`

### `extraction.ts`

输入：

- 清洗后的正文

输出：

- `InterviewSignal`

这里是后面接模型的核心位置。

### `aggregation.ts`

输入：

- 多条 `InterviewSignal`

输出：

- 面向用户的结果页 JSON

这里尽量保持纯函数，方便测试。

## 6. 我建议我们下一步先做什么

第一优先级：

把来源从“牛客单源”扩成“牛客 + 其他公开社区”。

原因：

- 这一步最能提升结果覆盖度
- 当前页面和聚合已经够用
- 不需要推倒现有 pipeline
- 做完以后，这个项目就会更像真正的求职情报产品

## 7. 接下来怎么一起推进

推荐我们一轮只做一个明确目标。

### 下一轮可以直接做的任务

- 任务 A：接真实搜索 API，返回候选链接
- 任务 B：加一个 `SourceCandidate` 类型，替代当前 mock signal 直接输入
- 任务 C：把结果页加上“来源点击”与“空状态”

如果你愿意，下一步我就直接从 Phase 2 开始，先把真实召回层接上。
