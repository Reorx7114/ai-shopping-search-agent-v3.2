import type { Candidate, ParsedIntent } from "./types";

export function rankCandidates(candidates: Candidate[], parsedIntent: ParsedIntent): Candidate[] {
  const clues = new Set(
    [...parsedIntent.keywords, ...parsedIntent.englishKeywords, ...parsedIntent.coreClues]
      .flatMap((x) => x.toLowerCase().split(/\s+/))
      .filter(Boolean)
  );

  const scored = candidates.map((candidate) => scoreCandidate(candidate));
  return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  function scoreCandidate(candidate: Candidate): Candidate {
    const domain = extractDomain(candidate.link);
    const text = `${candidate.title} ${candidate.source} ${domain}`.toLowerCase();
    let s = 0;
    const matchedClues: string[] = [];
    const matchedNegativeTerms: string[] = [];
    for (const clue of clues) {
      if (text.includes(clue)) {
        s += 1;
        matchedClues.push(clue);
      }
    }
    for (const neg of parsedIntent.negativeTerms) {
      if (text.includes(neg.toLowerCase())) {
        s -= 2;
        matchedNegativeTerms.push(neg);
      }
    }
    s += commerceSignalScore(text, domain, candidate.priceText);
    const fitReason = buildFitReason(matchedClues, domain, candidate.priceText);
    return {
      ...candidate,
      score: s,
      matchedClues,
      matchedNegativeTerms,
      domain,
      fitReason
    };
  }
}

function commerceSignalScore(text: string, domain: string, priceText?: string): number {
  let score = 0;
  if (/shop|store|mall|official|buy|cart|product|ecommerce|商城|官網|購物/.test(text)) score += 4;
  if (priceText) score += 3;
  if (/amazon|shopee|momo|pchome|rakuten|ebay|walmart|target|bestbuy|costco/.test(domain)) score += 3;
  if (/facebook|reddit|youtube|instagram|medium|blog|news|article/.test(domain)) score -= 5;
  return score;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function buildFitReason(matchedClues: string[], domain: string, priceText?: string): string {
  if (priceText) return `含價格資訊（${priceText}），方便直接比較。`;
  if (domain) return `來源為 ${domain}，偏向可購買頁面。`;
  if (matchedClues.length) return `符合關鍵需求：${matchedClues.slice(0, 2).join("、")}。`;
  return "與你的需求語意相近。";
}
