import { mockInterviewSignals } from "@/lib/data/mock";
import { searchJuejinCandidates } from "@/lib/pipeline/juejin";
import { searchNowcoderCandidates } from "@/lib/pipeline/nowcoder";
import { compareCandidatePriority } from "@/lib/pipeline/relevance";
import { dedupeCandidates } from "@/lib/pipeline/scoring";
import { normalizeToLower } from "@/lib/pipeline/text";
import type { InterviewSignal, QueryExpansion, SearchInput, SourceCandidate } from "@/lib/schemas";

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(normalizeToLower(needle)));
}

const MAX_CANDIDATES = 6;

/** One dead source should degrade the result set, not empty it. */
async function settleSource(
  label: string,
  task: Promise<SourceCandidate[]>
): Promise<SourceCandidate[]> {
  try {
    return await task;
  } catch (error) {
    console.warn(`[pipeline:retrieval] ${label} unavailable`, error);
    return [];
  }
}

export async function retrieveCandidateSources(input: SearchInput, expansion: QueryExpansion): Promise<SourceCandidate[]> {
  const [nowcoderCandidates, juejinCandidates] = await Promise.all([
    settleSource("nowcoder", searchNowcoderCandidates(input, expansion)),
    settleSource("juejin", searchJuejinCandidates(input, expansion))
  ]);

  // Lead with one hit from each source so a single dominant site cannot fill
  // every slot, then fall back to global ranking.
  const diversified = [nowcoderCandidates[0], juejinCandidates[0]].filter(
    (candidate): candidate is SourceCandidate => Boolean(candidate)
  );

  return dedupeCandidates([...diversified, ...nowcoderCandidates, ...juejinCandidates])
    .sort(compareCandidatePriority)
    .slice(0, MAX_CANDIDATES);
}

export function retrieveMockSignals(input: SearchInput, expansion: QueryExpansion): InterviewSignal[] {
  return mockInterviewSignals.filter((item) => {
    const companyText = normalizeToLower(item.company);
    const roleText = normalizeToLower(item.role);
    const directionText = normalizeToLower(item.direction);

    const companyMatch =
      companyText.includes(normalizeToLower(input.company)) ||
      includesAny(companyText, expansion.companyAliases);

    const roleMatch =
      roleText.includes(normalizeToLower(input.role)) ||
      includesAny(roleText, expansion.roleAliases);

    const directionMatch =
      input.direction.trim().length === 0 ||
      directionText.includes(normalizeToLower(input.direction)) ||
      includesAny(directionText, expansion.directionTerms);

    return companyMatch && roleMatch && directionMatch;
  });
}
