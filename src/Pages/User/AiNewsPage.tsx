import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { baseURL } from "@/Utils/URL";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { toggleNewsId, clearSelectedNewsIds } from "../../lib/Slice/newSelectionSlice.ts";

interface NewsItem {
  id: string;
  title: string;
  hindiSummary: string;
  description: string;
  link: string;
  image_url: string | null;
  source_name: string;
  source_url: string;
  category: string;
  keywords: string[];
  pubDate?: string;
  createdAt?: string;
}

type ScriptState = "idle" | "generating" | "ready" | "error";

const CATEGORIES = [
  { id: "top", label: "Top News" },
  { id: "crime", label: "Crime" },
  { id: "education", label: "Education" },
  { id: "business", label: "Business" },
  { id: "technology", label: "Technology" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Entertainment" },
  { id: "health", label: "Health" },
  { id: "lifestyle", label: "Lifestyle" },
];

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const NewsCard = memo(({
  item,
  isSelected,
  isAnyGenerating,
  scriptState,
  onSelect,
  onDeselect,
}: {
  item: NewsItem;
  isSelected: boolean;
  isAnyGenerating: boolean;
  scriptState: ScriptState;
  onSelect: (id: string) => void;
  onDeselect: () => void;
}) => {
  const displayImage =
    item.image_url ||
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80";

  const handleOpenLink = () => {
    window.open(item.link, "_blank", "noopener,noreferrer");
  };

  const isGenerating = isSelected && scriptState === "generating";

  return (
    <div
      className={`group flex flex-col rounded-2xl overflow-hidden border shadow-lg transition-colors duration-300 transform-gpu ${
        isSelected
          ? "border-blue-500 shadow-blue-500/20 bg-zinc-900"
          : "border-zinc-800 hover:border-zinc-600 bg-[#18181b] hover:shadow-2xl"
      }`}
    >
      <div
        onClick={handleOpenLink}
        className="relative h-44 w-full overflow-hidden flex-shrink-0 cursor-pointer bg-zinc-800"
      >
        <img
          src={displayImage}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out transform-gpu will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />
        <div className="absolute top-3 right-3 px-3 py-1 bg-black/80 rounded-full border border-white/10">
          <span className="text-xs text-zinc-300 font-medium capitalize tracking-wider">
            {item.category}
          </span>
        </div>
        {isSelected && (
          <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
            {isGenerating ? <SpinnerIcon className="w-3.5 h-3.5" /> : <CheckIcon />}
          </div>
        )}
      </div>

      <div className="relative flex-1 p-5 group/middle">
        <div
          className={`absolute inset-0 transition-all duration-200 ${
            isSelected ? "bg-blue-500/5" : "bg-transparent group-hover/middle:bg-zinc-800/40"
          }`}
        />
        <div onClick={handleOpenLink} className="relative z-10 cursor-pointer">
          <h2 className="text-zinc-100 text-sm font-bold line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors mb-2">
            {item.title}
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
            {item.description}
          </p>
        </div>
        <div
          className={`relative z-10 mt-4 transition-all duration-200 ${
            isSelected
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 group-hover/middle:opacity-100 group-hover/middle:translate-y-0"
          }`}
        >
          {isSelected ? (
            <button
              onClick={isGenerating ? undefined : onDeselect}
              disabled={isGenerating}
              className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isGenerating
                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40"
              }`}
            >
              {isGenerating ? (
                <><SpinnerIcon className="w-3.5 h-3.5" />Preparing for script…</>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Deselect
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => !isAnyGenerating && onSelect(item.id)}
              disabled={isAnyGenerating}
              className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                isAnyGenerating
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
              }`}
            >
              <CheckIcon />
              Select for Script
            </button>
          )}
        </div>
      </div>

      <div
        onClick={handleOpenLink}
        className="px-5 pb-4 border-t border-zinc-800 pt-3 flex justify-between items-center text-xs text-zinc-500 font-medium flex-shrink-0 cursor-pointer"
      >
        <span className="truncate pr-4">{item.source_name || "News Source"}</span>
        <svg
          className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </div>
  );
});

NewsCard.displayName = "NewsCard";

// ── AiNewsPage ────────────────────────────────────────────────────
const AiNewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("top");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [scriptState, setScriptState] = useState<ScriptState>("idle");
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedNewsId = useAppSelector((s) => s.newsSelection.selectedNewsId);

  // Tracks whether a fetch is currently in-flight to prevent duplicates
  const fetchInFlight = useRef(false);

  const resetScriptState = useCallback(() => {
    setScriptState("idle");
    setGeneratedScript(null);
    setScriptError(null);
  }, []);

  // FIX: fetchNews does NOT depend on `category` — it receives it as a parameter.
  // This breaks the stale-closure problem entirely: the function ref never changes,
  // so it can't accidentally trigger the second useEffect.
  const fetchNews = useCallback(async (categoryToFetch: string, forceRefresh = false) => {
    if (fetchInFlight.current && !forceRefresh) return;
    fetchInFlight.current = true;

    try {
      setLoading(true);
      if (forceRefresh) setIsRefreshing(true);
      resetScriptState();

      const res = await axios.post(
        `${baseURL}/api/v1/morning-news-fetcher/get-morning-news`,
        { category: categoryToFetch, forceRefresh }
      );

      const rawNews: NewsItem[] = res.data?.data || res.data?.newsData || [];
      setNews(rawNews);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      fetchInFlight.current = false;
    }
  }, [resetScriptState]); // resetScriptState is stable (no deps), so fetchNews is effectively stable too

  // FIX: Single useEffect. Passes current category directly as argument — no closure capture issue.
  // Cleanup resets the in-flight guard so a quick category switch doesn't permanently block fetching.
  useEffect(() => {
    dispatch(clearSelectedNewsIds());
    resetScriptState();
    fetchInFlight.current = false; // reset guard on category change before starting new fetch
    fetchNews(category);

    return () => {
      // If category changes mid-fetch, mark it as done so the next fetch isn't blocked
      fetchInFlight.current = false;
    };
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps
  // Intentionally omitting fetchNews/dispatch/resetScriptState — all are stable refs.
  // Including them would cause the effect to re-run unnecessarily.

  const handleSelect = useCallback(async (articleId: string) => {
    if (scriptState === "generating") return;
    if (selectedNewsId === articleId && scriptState === "ready") return;

    dispatch(clearSelectedNewsIds());
    dispatch(toggleNewsId(articleId));

    setScriptState("generating");
    setGeneratedScript(null);
    setScriptError(null);

    try {
      const res = await axios.post(
        `${baseURL}/api/v1/morning-news-fetcher/generate-article-summary`,
        { articleId }
      );
      if (res.data?.success) {
        setGeneratedScript(res.data.data?.hindiSummary || null);
        setScriptState("ready");
      } else {
        throw new Error(res.data?.message || "Script generation failed");
      }
    } catch (err: any) {
      console.error("Script generation error:", err);
      setScriptError(err?.response?.data?.message || err?.message || "Something went wrong");
      setScriptState("error");
    }
  }, [scriptState, selectedNewsId, dispatch]);

  const handleDeselect = useCallback(() => {
    dispatch(clearSelectedNewsIds());
    resetScriptState();
  }, [dispatch, resetScriptState]);

  const handleProceed = useCallback(() => {
    if (!selectedNewsId || scriptState !== "ready") return;
    navigate("/script-writer");
  }, [selectedNewsId, scriptState, navigate]);

  const handleRefresh = useCallback(() => {
    if (loading || isRefreshing) return;
    dispatch(clearSelectedNewsIds());
    resetScriptState();
    fetchInFlight.current = false;
    fetchNews(category, true);
  }, [loading, isRefreshing, category, dispatch, resetScriptState, fetchNews]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 font-sans relative">
      {/* Header bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm text-zinc-400 font-medium whitespace-nowrap">Category:</label>
          <div className="relative w-full sm:w-44">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {selectedNewsId && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">1</div>
              <span>selected</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              loading || isRefreshing
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            }`}
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? "Generating..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* News grid */}
      {loading ? (
        <div className="w-full h-64 flex flex-col justify-center items-center gap-4">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm animate-pulse">
            {isRefreshing
              ? "Generating fresh news with AI..."
              : `Fetching latest ${category} news...`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {news.length > 0 ? (
            news.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                isSelected={selectedNewsId === item.id}
                isAnyGenerating={scriptState === "generating"}
                scriptState={selectedNewsId === item.id ? scriptState : "idle"}
                onSelect={handleSelect}
                onDeselect={handleDeselect}
              />
            ))
          ) : (
            <div className="col-span-full h-32 flex justify-center items-center text-zinc-500">
              No news found for this category.
            </div>
          )}
        </div>
      )}

      {/* Floating action bar */}
      {selectedNewsId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-4 shadow-2xl shadow-black/60 backdrop-blur-xl">
            {scriptState === "generating" && (
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <SpinnerIcon className="w-5 h-5 text-blue-400" />
                <div className="flex flex-col">
                  <span className="font-semibold text-white text-sm">Preparing your article for script…</span>
                </div>
              </div>
            )}

            {scriptState === "ready" && (
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                  <CheckIcon />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white text-sm">Article is ready for script!</span>
                </div>
              </div>
            )}

            {scriptState === "error" && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-red-400 text-sm">Script generation failed</span>
                  <span className="text-zinc-500 text-xs max-w-xs truncate">{scriptError || "Please retry"}</span>
                </div>
                <button
                  onClick={() => selectedNewsId && handleSelect(selectedNewsId)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30 transition-all flex-shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {scriptState === "idle" && (
              <div className="text-sm text-zinc-300">
                <span className="font-bold text-white text-lg">1</span>
                <span className="text-zinc-400 ml-1.5">news selected</span>
              </div>
            )}

            <div className="w-px h-6 bg-zinc-700" />

            <button
              onClick={handleDeselect}
              disabled={scriptState === "generating"}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear
            </button>

            <button
              onClick={handleProceed}
              disabled={scriptState !== "ready"}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                scriptState === "ready"
                  ? "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 shadow-lg shadow-blue-500/30"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {scriptState === "generating" ? (
                <><SpinnerIcon className="w-4 h-4" />Generating…</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Generate Script
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiNewsPage;