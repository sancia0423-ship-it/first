import type { QueryExpansion, SearchInput, SourceCandidate } from "@/lib/schemas";
import { normalizeToLower } from "@/lib/pipeline/text";

export function matchesAny(text: string, values: string[]) {
  return values.some((value) => {
    const normalized = normalizeToLower(value);
    return normalized.length > 0 && text.includes(normalized);
  });
}

export function hasProductRole(text: string) {
  return /产品经理|产品实习|产品岗|产品培训生|\bpm\b|pm实习/i.test(text);
}

export function hasDataAnalysisRole(text: string) {
  return /数据分析|数分|\bbi\b|商业分析(?!方向)/i.test(text);
}

export function hasOperationsRole(text: string) {
  return /产品运营|运营实习|运营岗|内容运营|用户运营/i.test(text);
}

export function hasEngineeringRole(text: string) {
  return /前端|后端|开发|工程师|算法|测试|客户端|java|golang|python/i.test(text);
}

export function isRoleCompatible(text: string, input: SearchInput) {
  const normalizedRole = normalizeToLower(input.role);

  if (normalizedRole.includes("产品")) {
    return hasProductRole(text);
  }

  if (normalizedRole.includes("运营")) {
    return hasOperationsRole(text);
  }

  if (normalizedRole.includes("数据分析") || normalizedRole.includes("数分") || normalizedRole.includes("bi")) {
    return hasDataAnalysisRole(text);
  }

  if (
    normalizedRole.includes("开发") ||
    normalizedRole.includes("工程") ||
    normalizedRole.includes("算法") ||
    normalizedRole.includes("测试")
  ) {
    return hasEngineeringRole(text);
  }

  return true;
}

export function isCandidateCompatible(params: {
  title: string;
  previewText: string;
  input: SearchInput;
  expansion: QueryExpansion;
}) {
  const title = normalizeToLower(params.title);
  const previewText = normalizeToLower(params.previewText);
  const joined = `${title} ${previewText}`;

  if (!matchesAny(joined, params.expansion.companyAliases)) {
    return {
      compatible: false,
      reason: "缺少目标公司信号"
    };
  }

  if (!isRoleCompatible(joined, params.input)) {
    return {
      compatible: false,
      reason: "岗位信号与查询不匹配"
    };
  }

  if (normalizeToLower(params.input.role).includes("产品") && hasDataAnalysisRole(joined) && !hasProductRole(joined)) {
    return {
      compatible: false,
      reason: "更像数分/商分岗位，不是产品岗"
    };
  }

  return {
    compatible: true,
    reason: "公司与岗位信号匹配"
  };
}

export function recencyScore(publishedAt: string) {
  const days = daysSincePublished(publishedAt);

  if (days === null) {
    return 0;
  }

  if (days <= 120) {
    return 4.5;
  }
  if (days <= 240) {
    return 3.5;
  }
  if (days <= 365) {
    return 3;
  }
  if (days <= 365 * 2) {
    return 2;
  }
  if (days <= 365 * 3) {
    return 1;
  }
  if (days <= 365 * 4) {
    return 0.25;
  }
  if (days >= 365 * 6) {
    return -2.5;
  }
  if (days >= 365 * 5) {
    return -1.5;
  }

  return 0;
}

export function publishedAtToTimestamp(publishedAt: string) {
  const normalized = publishedAt.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const timestamp = Date.parse(`${normalized}T00:00:00.000Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function daysSincePublished(publishedAt: string) {
  const timestamp = publishedAtToTimestamp(publishedAt);

  if (timestamp === null) {
    return null;
  }

  const diff = Date.now() - timestamp;

  if (diff < 0) {
    return 0;
  }

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function compareCandidatePriority(
  left: Pick<SourceCandidate, "relevanceScore" | "publishedAt">,
  right: Pick<SourceCandidate, "relevanceScore" | "publishedAt">
) {
  const scoreGap = right.relevanceScore - left.relevanceScore;

  if (Math.abs(scoreGap) >= 1.5) {
    return scoreGap;
  }

  const leftTimestamp = publishedAtToTimestamp(left.publishedAt) ?? 0;
  const rightTimestamp = publishedAtToTimestamp(right.publishedAt) ?? 0;

  if (leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  return scoreGap;
}
