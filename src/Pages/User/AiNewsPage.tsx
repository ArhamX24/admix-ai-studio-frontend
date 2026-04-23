import React, { useEffect, useState } from "react";
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

const CATEGORIES = [
  { id: "top", label: "Top News" },
  { id: "crime", label: "Crime" },
  { id: "education", label: "Education" },
  { id: "business", label: "Business" },
  { id: "lifestyle", label: "Lifestyle" },
];

// ── Helpers ────────────────────────────────────────────────────────
const isWithin24Hours = (dateStr?: string): boolean => {
  if (!dateStr) return true; // if no date, keep it
  return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000;
};

// ── Icons ──────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ── NewsCard ───────────────────────────────────────────────────────
const NewsCard: React.FC<{
  item: NewsItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}> = ({ item, isSelected, onToggle }) => {
  const displayImage =
    item.image_url ||
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80";

  const handleOpenLink = () => {
    window.open(item.link, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={`group flex flex-col rounded-2xl overflow-hidden backdrop-blur-md border shadow-lg transition-all duration-300 ${
        isSelected
          ? "border-blue-500 shadow-blue-500/20 bg-zinc-900/90"
          : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/80 hover:shadow-2xl hover:-translate-y-1"
      }`}
    >
      {/* Image — click opens link */}
      <div
        onClick={handleOpenLink}
        className="relative h-44 w-full overflow-hidden flex-shrink-0 cursor-pointer"
      >
        <img
          src={displayImage}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />

        {/* Category pill */}
        <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
          <span className="text-xs text-zinc-300 font-medium capitalize tracking-wider">
            {item.category}
          </span>
        </div>

        {/* Selected check badge */}
        {isSelected && (
          <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
            <CheckIcon />
          </div>
        )}
      </div>

      {/* Middle — title + select button */}
      <div className="relative flex-1 p-5 group/middle">
        <div
          className={`absolute inset-0 transition-all duration-200 ${
            isSelected
              ? "bg-blue-500/8"
              : "bg-transparent group-hover/middle:bg-zinc-800/40"
          }`}
        />

        {/* Title + summary — click opens link */}
        <div onClick={handleOpenLink} className="relative z-10 cursor-pointer">
          <h2 className="text-zinc-100 text-sm font-bold line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors mb-2">
            {item.title}
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
            {item.hindiSummary || item.description}
          </p>
        </div>

        {/* Select / Deselect button */}
        <div
          className={`relative z-10 mt-4 transition-all duration-200 ${
            isSelected
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 group-hover/middle:opacity-100 group-hover/middle:translate-y-0"
          }`}
        >
          <button
            onClick={() => onToggle(item.id)}
            className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isSelected
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40"
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
            }`}
          >
            {isSelected ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Deselect
              </>
            ) : (
              <>
                <CheckIcon />
                Select for Script
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer — click opens link */}
      <div
        onClick={handleOpenLink}
        className="px-5 pb-4 border-t border-zinc-800 pt-3 flex justify-between items-center text-xs text-zinc-500 font-medium flex-shrink-0 cursor-pointer"
      >
        <span className="truncate pr-4">{item.source_name || "News Source"}</span>
        <svg
          className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </div>
  );
};

// ── AiNewsPage ─────────────────────────────────────────────────────
const AiNewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("top");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedNewsId = useAppSelector((s) => s.newsSelection.selectedNewsId);
  const selectedCount = selectedNewsId ? 1 : 0;

  const fetchNews = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) setIsRefreshing(true);
      dispatch(clearSelectedNewsIds());

      const res = await axios.post(
        `${baseURL}/api/v1/morning-news-fetcher/get-morning-news`,
        { category, forceRefresh }
      );

      const rawNews: NewsItem[] = res.data?.data || res.data?.newsData || [];

      // ✅ Client-side guard: drop anything older than 24h
      // (handles edge case where backend returns cached data near the boundary)
      const freshNews = rawNews.filter((item) => isWithin24Hours(item.createdAt));

      // ✅ If everything came back stale and it wasn't a forceRefresh, auto-refetch fresh
      if (freshNews.length === 0 && rawNews.length > 0 && !forceRefresh) {
        console.log("All cached news older than 24h — auto-fetching fresh batch");
        setLoading(false);
        setIsRefreshing(false);
        fetchNews(true); // trigger a real fresh fetch
        return;
      }

      setNews(freshNews);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [category]);

  const toggleSelect = (id: string) => {
    dispatch(toggleNewsId(id));
  };

  const handleProceed = () => {
    if (!selectedNewsId) return;
    navigate("/script-writer");
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 font-sans relative">
      {/* Header bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        {/* Category selector */}
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

        {/* Right side controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {selectedCount}
              </div>
              <span>selected</span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!loading && !isRefreshing) fetchNews(true);
            }}
            disabled={loading || isRefreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              loading || isRefreshing
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
            }`}
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
                onToggle={toggleSelect}
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
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-4 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="text-sm text-zinc-300">
              <span className="font-bold text-white text-lg">1</span>
              <span className="text-zinc-400 ml-1.5">news selected</span>
            </div>
            <div className="w-px h-6 bg-zinc-700" />
            <button
              onClick={() => dispatch(clearSelectedNewsIds())}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleProceed}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Generate Script
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiNewsPage;