"use client";

import { useState } from "react";
import type { Candidate, IntentMode, SearchApiResponse } from "@/lib/search/types";
import { INTENT_MODES } from "@/lib/search/types";

function CandidateImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return <div className="h-28 w-full bg-slate-200 text-xs flex items-center justify-center">No Image</div>;
  }
  return <img src={src} alt={alt} className="h-28 w-full object-cover rounded" onError={() => setFailed(true)} referrerPolicy="no-referrer" />;
}

function joinOrFallback(items: string[] | undefined, fallback = "無"): string {
  if (!items || items.length === 0) return fallback;
  return items.join("、");
}

export default function Home() {
  const [intentMode, setIntentMode] = useState<IntentMode>("我不確定");
  const [wanted, setWanted] = useState("");
  const [result, setResult] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  const setBusy = (message: string) => {
    setLoadingMessage(message);
    setLoading(true);
  };

  const runSearch = async () => {
    setBusy("正在幫你找商品...");
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentMode,
          wanted,
          query: wanted
        })
      });
      const data = (await response.json()) as SearchApiResponse;
      setResult(data);
      setVisibleCount(4);
      setShowDebug(false);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const refineLikeThis = async (candidate: Candidate) => {
    setBusy("正在重新縮小範圍...");
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: wanted,
          intentMode,
          wanted,
          selectedCandidate: {
            title: candidate.title,
            source: candidate.source,
            link: candidate.link
          },
          refinementType
        })
      });
      const data = (await response.json()) as SearchApiResponse;
      setResult(data);
      setVisibleCount(4);
      setShowDebug(false);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const reshuffle = async () => {
    setBusy("正在換一批結果...");
    try {
      await runSearch();
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const refinementChips = [
    { label: "更便宜", type: "cheaper" as const },
    { label: "更高級", type: "premium" as const },
    { label: "不要文章", type: "no-article" as const },
    { label: "找商城", type: "marketplace" as const },
    { label: "哪裡買", type: "where-to-buy" as const },
    { label: "更適合小空間", type: "small-space" as const }
  ];

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI Shopping Search Agent</h1>
      <p className="text-sm text-slate-600">幫你縮小選擇，快速找到更像你要買的商品。</p>
      <section className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {INTENT_MODES.map((mode) => (
            <button key={mode} type="button" className={`px-3 py-1 rounded border ${intentMode === mode ? "bg-slate-900 text-white" : "bg-white"}`} onClick={() => setIntentMode(mode)}>
              {mode}
            </button>
          ))}
        </div>
        <textarea className="w-full border rounded p-2" placeholder="你想找什麼？" value={wanted} onChange={(e) => setWanted(e.target.value)} />
        <button type="button" className="px-4 py-2 bg-slate-900 text-white rounded" onClick={runSearch} disabled={loading || !wanted.trim()}>
          {loading ? "搜尋中..." : "開始搜尋"}
        </button>
      </section>

      {result && (
        <section className="space-y-4">
          {loading ? (
            <div className="bg-slate-50 border rounded-lg p-3 text-sm text-slate-600">{loadingMessage || "載入中..."}</div>
          ) : null}
          {result.blocked ? (
            <article className="bg-white border rounded-lg p-4 space-y-2">
              <h2 className="text-base font-semibold">安全提示</h2>
              <p className="text-sm text-slate-700">這個需求可能涉及違法或高風險服務，因此我不能協助搜尋或提供連結。你可以改搜尋合法、安全的一般商品、旅遊、住宿或靈感內容。</p>
              <button type="button" className="text-xs underline text-slate-500" onClick={() => setShowDebug((v) => !v)} aria-expanded={showDebug}>
                {showDebug ? "隱藏除錯資訊" : "顯示除錯資訊"}
              </button>
              {showDebug ? (
                <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : null}
            </article>
          ) : (
          <article className="bg-white border rounded-lg p-4 space-y-2">
            <h2 className="text-base font-semibold">AI 解析結果</h2>
            <p className="text-sm"><span className="font-medium">商品特徵：</span>{joinOrFallback(result.parsedIntent?.features)}</p>
            <p className="text-sm"><span className="font-medium">搜尋關鍵字：</span>{joinOrFallback(result.parsedIntent?.keywords)}</p>
            <p className="text-sm"><span className="font-medium">英文搜尋詞：</span>{joinOrFallback(result.parsedIntent?.englishKeywords)}</p>
            <p className="text-sm"><span className="font-medium">重要線索：</span>{joinOrFallback(result.parsedIntent?.coreClues)}</p>
            <p className="text-sm"><span className="font-medium">排除條件：</span>{joinOrFallback(result.parsedIntent?.negativeTerms, "無")}</p>
            <p className="text-sm"><span className="font-medium">搜尋查詢：</span>{joinOrFallback(result.parsedIntent?.searchQueries)}</p>
            <p className="text-sm text-slate-600 pt-1">
              {result.candidates.length > 0 ? "已為你找到候選商品。" : "目前沒有找到候選商品，請換個說法或放寬條件。"}
            </p>
            <button type="button" className="text-xs underline text-slate-500" onClick={() => setShowDebug((v) => !v)} aria-expanded={showDebug}>
              {showDebug ? "隱藏除錯資訊" : "顯示除錯資訊"}
            </button>
            {showDebug ? (
              <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded overflow-auto">
                {JSON.stringify({ parsedIntent: result.parsedIntent, debug: result.debug }, null, 2)}
              </pre>
            ) : null}
          </article>
          )}

          {result.blocked || result.candidates.length === 0 ? null : (
            <div className="grid md:grid-cols-2 gap-3">
              {result.candidates.slice(0, visibleCount).map((candidate) => (
                <article key={candidate.id} className="bg-white border rounded-lg overflow-hidden p-2 flex gap-3">
                  <div className="w-28 shrink-0">
                    <CandidateImage src={candidate.image} alt={candidate.title} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h2 className="font-medium text-sm line-clamp-2">{candidate.title}</h2>
                    {candidate.priceText ? <p className="text-sm font-semibold text-emerald-700">{candidate.priceText}</p> : null}
                    <p className="text-xs text-slate-500">{candidate.domain || candidate.source}</p>
                    {candidate.fitReason ? <p className="text-xs text-slate-600">{candidate.fitReason}</p> : null}
                    <div className="pt-1">
                      <a href={candidate.link} target="_blank" className="inline-flex px-3 py-1.5 text-xs rounded bg-slate-900 text-white" rel="noreferrer">
                        查看商品
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      <button type="button" className="text-xs underline disabled:opacity-50" onClick={() => refineLikeThis(candidate)} disabled={loading}>比較像這個</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!result.blocked && result.candidates.length > visibleCount ? (
            <button type="button" className="text-sm underline disabled:opacity-50" onClick={() => setVisibleCount((n) => Math.min(6, n + 2))} disabled={loading}>
              顯示更多（最多 6 筆）
            </button>
          ) : null}
          {!result.blocked && result.candidates.length > 0 ? (
            <div className="flex flex-wrap gap-3 text-sm">
              <button type="button" className="underline disabled:opacity-50" onClick={() => setResult(null)} disabled={loading}>這些都不像</button>
              <button type="button" className="underline disabled:opacity-50" onClick={reshuffle} disabled={loading || !wanted.trim()}>換一批</button>
              <button type="button" className="underline disabled:opacity-50" onClick={runSearch} disabled={loading || !wanted.trim()}>重新搜尋</button>
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
