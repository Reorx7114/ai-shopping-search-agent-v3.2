import type { NarrowingAnswer, ParsedIntent, RefinementType, SelectedCandidatePayload } from "./types";

const REFINEMENT_HINTS: Record<RefinementType, string> = {
  similar: "similar alternative model",
  cheaper: "budget cheaper price deal",
  premium: "premium flagship high-end",
  "no-article": "product buy shop price -review -reddit -youtube -blog -news",
  marketplace: "official store ecommerce marketplace product page",
  "where-to-buy": "where to buy official store shop",
  "small-space": "compact small space mini size"
};

export function buildRefinedQuery(parsed: ParsedIntent, selectedCandidate?: SelectedCandidatePayload, refinementType?: RefinementType): string {
  const candidateCore = selectedCandidate ? `${selectedCandidate.title} ${selectedCandidate.source} ${selectedCandidate.link}` : "";
  const semantic = [...parsed.features, ...parsed.keywords, ...parsed.coreClues].filter(Boolean).join(" ");
  const hint = refinementType ? REFINEMENT_HINTS[refinementType] : "";
  const baseRaw = selectedCandidate ? `${selectedCandidate.title} ${semantic} ${candidateCore}` : parsed.searchQueries[0] ?? parsed.keywords.join(" ");
  const base = `${baseRaw} ${hint}`.trim();
  const negatives = parsed.negativeTerms.map((term) => `-${term}`).join(" ");
  return `${base} ${negatives}`.trim();
}

export function mapNarrowingToRefinement(answer?: NarrowingAnswer): RefinementType | undefined {
  if (!answer) return undefined;
  return answer;
}
