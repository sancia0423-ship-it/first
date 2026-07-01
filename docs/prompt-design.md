# Prompt Design

## 1. 设计原则

这个项目里，LLM 的角色不是“自由发挥写总结”，而是一个受约束的信息处理器。Prompt 设计要围绕三个目标：

- 结构化抽取
- 标准化归一
- 基于证据的聚合总结

所有阶段都建议使用结构化输出，避免直接生成长文本。

## 2. 流水线拆分

### Step 1：查询扩展

输入用户的公司、岗位、方向，输出：

- 公司别名
- 岗位同义词
- 方向关联词
- 负向过滤词
- 推荐搜索 query 列表

#### Prompt 模板

```text
你是一个招聘信息检索助手。请根据用户输入的公司、岗位、方向，生成适合搜索公开面经的关键词扩展。

要求：
1. 保留用户原意，不要发明无关方向。
2. 输出公司别名、岗位同义词、方向扩展词、排除词。
3. 输出 5 到 8 个适合搜索引擎的 query。
4. 只输出 JSON。

用户输入：
company: {{company}}
role: {{role}}
direction: {{direction}}
```

#### 期望输出

```json
{
  "company_aliases": ["字节", "字节跳动"],
  "role_aliases": ["产品经理实习", "产品实习", "PM intern"],
  "direction_terms": ["增长", "商业化", "用户增长"],
  "negative_terms": ["内推教程", "薪资爆料", "校招笔试题"],
  "queries": [
    "字节跳动 产品经理实习 增长 面经",
    "字节 产品实习 商业化 面试经验"
  ]
}
```

### Step 2：来源相关性判断

对搜索结果标题和摘要做轻量筛选，避免无关内容进入抓取流程。

#### Prompt 模板

```text
你是一个面经检索筛选器。请判断下面这条搜索结果是否与目标查询高度相关。

规则：
1. 只根据给定标题和摘要判断。
2. 如果无法确认，也不要判定为高度相关。
3. 输出 JSON，字段包括 relevant, confidence, reason。

目标查询：
company: {{company}}
role: {{role}}
direction: {{direction}}

候选结果：
title: {{title}}
snippet: {{snippet}}
url: {{url}}
```

### Step 3：结构化抽取

这是最重要的一步。输入清洗后的正文，输出标准 JSON。

#### Prompt 模板

```text
你是一个面经结构化抽取器。请从下面的公开面经文本中提取结构化信息。

重要规则：
1. 只能根据原文提取，不要补充常识。
2. 不确定的字段写 null，不要猜。
3. 如果文本不是面经，is_interview_report 必须为 false。
4. 所有问题尽量保留原意，但要去掉口语赘词。
5. 对每个关键字段，尽量给 evidence_snippets。
6. 只输出 JSON。

目标 schema：
{
  "is_interview_report": true,
  "company_name": "string|null",
  "role_name": "string|null",
  "direction_name": "string|null",
  "candidate_level": "string|null",
  "city": "string|null",
  "published_at": "YYYY-MM-DD|null",
  "overall_result": "passed|rejected|offer|unknown|null",
  "timeline": {
    "apply_to_hr_days": "number|null",
    "hr_to_first_round_days": "number|null",
    "first_to_second_days": "number|null",
    "final_to_offer_days": "number|null",
    "raw_time_expressions": []
  },
  "rounds": [
    {
      "round_index": 1,
      "round_name": "string",
      "interviewer_type": "hr|business|manager|cross_function|null",
      "duration_minutes": "number|null",
      "topics": ["string"],
      "questions": ["string"],
      "evidence_snippets": ["string"]
    }
  ],
  "overall_observations": ["string"],
  "evidence_snippets": ["string"],
  "confidence": 0.0
}

原文：
{{clean_text}}
```

### Step 4：时间与问题标准化

把“隔了几天”“一周左右”“差不多 30 分钟”统一成便于统计的格式。

#### Prompt 模板

```text
你是一个数据标准化助手。请对下面的时间表达和问题表达进行归一化。

规则：
1. 时间尽量换算为天或分钟。
2. 如果只能得出范围，输出 min/max。
3. 问题标准化时保留核心语义，不要删除业务关键词。
4. 只输出 JSON。

输入：
{{extracted_json}}
```

### Step 5：聚合总结

输入多份结构化 `report`，生成面向用户的结果摘要。

#### Prompt 模板

```text
你是一个面试情报总结助手。请基于给定的结构化面经数据，生成一份可追溯的摘要。

规则：
1. 只能引用输入中的事实。
2. 结论必须附带 source_ids。
3. 没有足够证据时，请明确写“不确定”。
4. 输出 JSON，不要输出自然语言段落。

输出字段：
{
  "sample_size": 0,
  "typical_process": [
    {
      "summary": "string",
      "source_ids": ["uuid"]
    }
  ],
  "timeline_summary": {
    "median_days": "number|null",
    "range_text": "string|null",
    "source_ids": ["uuid"]
  },
  "top_questions": [
    {
      "question": "string",
      "topic_tag": "string",
      "count": 0,
      "source_ids": ["uuid"]
    }
  ],
  "differences": [
    {
      "summary": "string",
      "source_ids": ["uuid"]
    }
  ],
  "confidence_note": "string"
}
```

## 3. 输出约束

### 一定要做的约束

- 使用 JSON schema 或结构化输出模式
- 对枚举值做限定
- 所有空值显式返回 `null`
- 对关键字段提供 `evidence_snippets`

### 不建议的做法

- 让模型直接读取几十篇原文然后写大段总结
- 不提供 schema 就要求“尽量结构化”
- 抽取和总结混在一个 prompt 里完成

## 4. 质量控制

### 自动检查

- `company_name` 和查询是否一致
- `round_index` 是否连续
- `questions` 是否为空列表
- `confidence` 是否超出 0 到 1
- `evidence_snippets` 是否真的出现在原文中

### 人工抽检

抽 20 条样本，检查：

- 抽取字段准确率
- 时间标准化是否合理
- 引用是否支持结论
- 结果页是否出现过度推断

## 5. 面试时值得讲的点

- 把一个大任务拆成多个可评估的小任务
- 用结构化输出降低幻觉风险
- 用 evidence snippet 把模型结论绑定到原文
- 用低温和枚举 schema 提高稳定性

## 6. 推荐参数

- 查询扩展：`temperature = 0.4`
- 相关性判断：`temperature = 0.1`
- 结构化抽取：`temperature = 0.1`
- 标准化：`temperature = 0.0`
- 聚合总结：`temperature = 0.2`

如果模型支持，优先使用：

- JSON schema mode
- reasoning summary 关闭或最小化
- max tokens 按阶段单独控制
