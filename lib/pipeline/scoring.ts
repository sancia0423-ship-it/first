import { normalizeToLower } from "@/lib/pipeline/text";
import { recencyScore } from "@/lib/pipeline/relevance";
import type { QueryExpansion, SourceCandidate } from "@/lib/schemas";

type ScoreInput = {
  title: string;
  previewText: string;
  publishedAt: string;
  expansion: QueryExpansion;
};

/** Weight for a term found in the title vs. anywhere in title + preview. */
const TERM_WEIGHTS = {
  company: { title: 5, body: 2 },
  role: { title: 4, body: 2 },
  direction: { title: 3, body: 1.5 }
} as const;

function scoreTerms(
  terms: string[],
  title: string,
  joined: string,
  weights: { title: number; body: number }
) {
  let score = 0;

  for (const term of terms) {
    const normalized = normalizeToLower(term);
    if (!normalized) {
      continue;
    }

    if (title.includes(normalized)) {
      score += weights.title;
    } else if (joined.includes(normalized)) {
      score += weights.body;
    }
  }

  return score;
}

/**
 * Shared query-match scoring. Nowcoder and Juejin used to keep two near-identical
 * copies of this that drifted apart (different bonus terms, different thresholds).
 * `bonus` carries the parts that really are source-specific.
 */
export function scoreCandidate(
  params: ScoreInput,
  bonus: (context: { title: string; previewText: string }) => number
) {
  const title = normalizeToLower(params.title);
  const previewText = normalizeToLower(params.previewText);
  const joined = `${title} ${previewText}`;

  let score =
    scoreTerms(params.expansion.companyAliases, title, joined, TERM_WEIGHTS.company) +
    scoreTerms(params.expansion.roleAliases, title, joined, TERM_WEIGHTS.role) +
    scoreTerms(params.expansion.directionTerms, title, joined, TERM_WEIGHTS.direction);

  score += bonus({ title, previewText });

  if (params.publishedAt !== "未知") {
    score += 0.5;
  }

  return score + recencyScore(params.publishedAt);
}

/** Keeps the first candidate per source URL, preserving order. */
export function dedupeCandidates(candidates: SourceCandidate[]) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    if (seen.has(candidate.sourceUrl)) {
      return false;
    }

    seen.add(candidate.sourceUrl);
    return true;
  });
}

/**
 * Runs per-query lookups and keeps whatever succeeded. A single upstream hiccup
 * previously rejected the whole batch and dropped the pipeline to mock data.
 */
export async function collectSettled<T>(tasks: Promise<T[]>[], label: string): Promise<T[]> {
  const settled = await Promise.allSettled(tasks);
  const results: T[] = [];

  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value);
    } else {
      console.warn(`[pipeline:${label}] query failed`, outcome.reason);
    }
  }

  if (results.length === 0 && settled.every((outcome) => outcome.status === "rejected")) {
    throw settled[0]?.status === "rejected"
      ? settled[0].reason
      : new Error(`${label} returned no results`);
  }

  return results;
}
