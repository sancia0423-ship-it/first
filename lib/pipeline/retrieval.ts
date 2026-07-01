import { mockInterviewSignals } from "@/lib/data/mock";
import { searchJuejinCandidates } from "@/lib/pipeline/juejin";
import { searchNowcoderCandidates } from "@/lib/pipeline/nowcoder";
import { compareCandidatePriority } from "@/lib/pipeline/relevance";
import { normalizeToLower } from "@/lib/pipeline/text";
import type { InterviewSignal, QueryExpansion, SearchInput, SourceCandidate } from "@/lib/schemas";

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(normalizeToLower(needle)));
}

export async function retrieveCandidateSources(input: SearchInput, expansion: QueryExpansion): Promise<SourceCandidate[]> {
  const [nowcoderCandidates, juejinCandidates] = await Promise.all([
    searchNowcoderCandidates(input, expansion),
    searchJuejinCandidates(input, expansion)
  ]);

  const seen = new Set<string>();
  const diversified = [nowcoderCandidates[0], juejinCandidates[0]].filter(
    (candidate): candidate is SourceCandidate => Boolean(candidate)
  );
  const combined = [...diversified, ...nowcoderCandidates, ...juejinCandidates];

  return combined
    .filter((candidate) => {
      if (seen.has(candidate.sourceUrl)) {
        return false;
      }

      seen.add(candidate.sourceUrl);
      return true;
    })
    .sort(compareCandidatePriority)
    .slice(0, 6);
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
