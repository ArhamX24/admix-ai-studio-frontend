import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/hooks";
// UPDATE THIS IMPORT TO MATCH YOUR REDUX SLICE EXPORT
import {toggleNewsId} from "../../lib/Slice/newSelectionSlice"
import axios from "axios";
import { baseURL } from "@/Utils/URL";

const API = `${baseURL}/api/v1/scripts`;

const UrlExtractor = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Extract URL data and save it as a news item in the DB
      const res = await axios.post(`${API}/extract-url`, { url });

      if (res.data?.success) {
        const newArticleId = res.data.data.id;
        
        // 2. Save the new ID to Redux state
        dispatch(toggleNewsId(newArticleId));
        
        // 3. Navigate back to ScriptWriter to continue the normal flow
        navigate("/script-writer");
      } else {
        throw new Error(res.data?.message || "Failed to extract URL.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to extract URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <button
          onClick={() => navigate("/script-writer")}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Script Writer
        </button>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="w-14 h-14 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Extract from URL</h1>
          <p className="text-zinc-400 text-sm mb-8">
            Paste any news article link below. Our AI will extract the content, read the details, and prepare it for script generation.
          </p>

          <form onSubmit={handleExtract} className="space-y-5">
            <div>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/news-article..."
                className="w-full bg-zinc-950/50 border border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-5 py-4 text-zinc-200 text-sm outline-none transition-all placeholder:text-zinc-600"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!url.trim() || loading}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                !url.trim() || loading
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-400 border-t-white animate-spin" />
                  Extracting Content...
                </>
              ) : (
                <>
                  Continue to Script
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UrlExtractor;