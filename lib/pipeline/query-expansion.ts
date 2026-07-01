import type { QueryExpansion, SearchInput } from "@/lib/schemas";

/**
 * Well-known aliases for popular companies.
 * New entries are welcome but the system no longer *requires* a hit here —
 * the generic rules below will always produce at least one alias.
 */
const COMPANY_ALIASES: Record<string, string[]> = {
  字节跳动: ["字节", "ByteDance"],
  美团: ["Meituan"],
  腾讯: ["Tencent", "鹅厂"],
  阿里巴巴: ["阿里", "Alibaba"],
  百度: ["Baidu"],
  京东: ["JD"],
  拼多多: ["PDD"],
  小红书: ["RED", "小红薯"],
  快手: ["Kuaishou"],
  网易: ["NetEase"],
  华为: ["Huawei"],
  滴滴: ["DiDi"],
  蚂蚁集团: ["蚂蚁", "Ant Group"],
  微软: ["Microsoft", "MSFT"],
  谷歌: ["Google"],
  苹果: ["Apple"],
  亚马逊: ["Amazon"],
  携程: ["Ctrip"],
  大疆: ["DJI"],
  小米: ["Xiaomi", "MI"],
  OPPO: ["oppo"],
  vivo: ["VIVO"],
  商汤: ["SenseTime"],
  bilibili: ["B站", "哔哩哔哩"],
  B站: ["bilibili", "哔哩哔哩"],
  哔哩哔哩: ["bilibili", "B站"],
};

/** Generate company aliases using generic heuristics. */
function expandCompany(raw: string): string[] {
  const results = [raw];

  // Lookup table
  if (COMPANY_ALIASES[raw]) {
    results.push(...COMPANY_ALIASES[raw]);
  }

  // If the name ends with 集团/公司/科技 etc., also try the short form
  const suffixPattern = /^(.{2,}?)(集团|公司|科技|网络|控股|技术|互联网)$/;
  const suffixMatch = raw.match(suffixPattern);
  if (suffixMatch) {
    results.push(suffixMatch[1]);
  }

  return results;
}

/** Generate role aliases using generic heuristics. */
function expandRole(raw: string): string[] {
  const results = [raw];

  if (raw.endsWith("实习")) {
    results.push(raw.slice(0, -2));
  }

  // "产品经理实习" → "产品实习", "PM intern"
  if (raw.includes("产品经理")) {
    results.push(raw.replace("产品经理", "产品"));
    results.push(raw.replace("产品经理", "PM"));
  }
  if (raw.includes("产品运营")) {
    results.push(raw.replace("产品运营", "运营"));
  }
  if (raw.includes("后端开发")) {
    results.push(raw.replace("后端开发", "后端"), raw.replace("后端开发", "服务端开发"));
  }
  if (raw.includes("前端开发")) {
    results.push(raw.replace("前端开发", "前端"), raw.replace("前端开发", "Web开发"));
  }
  if (raw.includes("算法")) {
    results.push(raw.replace("算法", "机器学习"));
  }
  if (raw.includes("数据分析")) {
    results.push(raw.replace("数据分析", "数分"), raw.replace("数据分析", "BI"));
  }

  return results;
}

/** Generate direction aliases using generic heuristics. */
function expandDirection(raw: string): string[] {
  if (!raw.trim()) return [];

  const results = [raw];

  const DIRECTION_SYNONYMS: Record<string, string[]> = {
    增长: ["商业化", "用户增长", "Growth"],
    商业分析: ["经营分析", "策略分析", "商分"],
    内容策略: ["内容生态", "创作者增长", "内容运营"],
    搜索: ["搜索推荐", "信息检索"],
    推荐: ["推荐系统", "搜索推荐"],
    广告: ["广告系统", "商业化"],
    风控: ["风险控制", "安全策略"],
    供应链: ["物流", "仓储"],
    国际化: ["出海", "全球化"],
  };

  if (DIRECTION_SYNONYMS[raw]) {
    results.push(...DIRECTION_SYNONYMS[raw]);
  }

  return results;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function expandQuery(input: SearchInput): QueryExpansion {
  const companyAliases = unique(expandCompany(input.company));
  const roleAliases = unique(expandRole(input.role));
  const directionTerms = unique(expandDirection(input.direction));

  const querySeeds = companyAliases.slice(0, 2).flatMap((company) =>
    roleAliases.slice(0, 4).flatMap((role) =>
      [
        [company, role, input.direction || undefined, "面经"].filter(Boolean).join(" "),
        [company, role, "面经"].filter(Boolean).join(" ")
      ]
    )
  );

  return {
    companyAliases,
    roleAliases,
    directionTerms,
    queries: unique(querySeeds).slice(0, 8)
  };
}
