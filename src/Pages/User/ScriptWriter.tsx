import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { clearSelectedNewsIds } from "../../lib/Slice/newSelectionSlice.ts";
import axios from "axios";
import { baseURL } from "@/Utils/URL";

const API = `${baseURL}/api/v1/scripts`;

type ScriptType = "short" | "long" | null;

interface GeneratedScript {
  anchor: string;
  voiceOver: string;
  thumbnail: string;
  scriptType: ScriptType;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ── Icons ──────────────────────────────────────────────────────────
const MicIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);
const AnchorIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5" />
  </svg>
);
const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);
const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);
const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
  </svg>
);
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

// ── Script type selector screen ──────────────────────────────────
const ScriptTypeSelector: React.FC<{
  onSelect: (type: "short" | "long") => void;
  loading: boolean;
  newsCount: number;
}> = ({ onSelect, loading, newsCount }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/8 rounded-full blur-[120px]" />
    </div>
    <div className="relative z-10 text-center mb-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 mb-8">
        <SparklesIcon />
        <span>{newsCount} News {newsCount > 1 ? "ें" : ""} is Selected</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
        Choose Script Type
      </h1>
    </div>
    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
      <button
        onClick={() => onSelect("short")}
        disabled={loading}
        className="group relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-blue-500/60 hover:bg-zinc-900 transition-all duration-300 text-left hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:bg-blue-600/25 transition-colors">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h7.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Short Script</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          <span className="text-zinc-500">~1-2 min duration</span>
        </p>
        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </button>
      <button
        onClick={() => onSelect("long")}
        disabled={loading}
        className="group relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-violet-500/60 hover:bg-zinc-900 transition-all duration-300 text-left hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mb-5 group-hover:bg-violet-600/25 transition-colors">
          <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Long Script</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          <span className="text-zinc-500">~4-6 min duration</span>
        </p>
        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </button>
    </div>
  </div>
);

// ── Loading overlay ──────────────────────────────────────────────
const GeneratingLoader: React.FC<{ scriptType: ScriptType }> = ({ scriptType }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
    </div>
    <div className="relative z-10 text-center">
      <div className="relative w-20 h-20 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
        <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-violet-500 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Script is creating...</h2>
      <p className="text-zinc-400 text-sm">
        AI is creating {scriptType === "short" ? "Short" : "Long"} script for you
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        {["Anchor Script", "Voice Over", "Thumbnail"].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className="text-xs px-3 py-1.5 rounded-full border animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              <span className="text-zinc-400 border-zinc-700">{step}</span>
            </div>
            {i < 2 && <div className="text-zinc-700">→</div>}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Script block (editable) ──────────────────────────────────────
const ScriptBlock: React.FC<{
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, icon, accentColor, value, onChange }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border bg-zinc-900/60 overflow-hidden ${accentColor}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="text-zinc-400">{icon}</div>
          <span className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">{label}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-all z-10"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon />
              Copy
            </>
          )}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-zinc-300 text-sm leading-7 p-5 outline-none resize-none min-h-[220px] font-mono placeholder:text-zinc-600"
        placeholder={`${label} it will show here...`}
        style={{ fontFamily: "'Noto Sans Devanagari', 'Arial Unicode MS', monospace" }}
      />
    </div>
  );
};

// ── AI Chat ──────────────────────────────────────────────────────
const AIChat: React.FC<{
  onRefine: (msg: string) => void;
  messages: ChatMessage[];
  loading: boolean;
}> = ({ onRefine, messages, loading }) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onRefine(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Make Anchor more crispy",
    "Make voice-over a little longer",
    "Make starting more punchy",
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900/40 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
          <SparklesIcon />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-200">AI Script Assistant</p>
          <p className="text-xs text-zinc-500">Changes in script make it here</p>
        </div>
        {loading && (
          <div className="ml-auto flex items-center gap-2 text-xs text-blue-400">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Processing...
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center pt-6">
            <p className="text-zinc-600 text-sm mb-4">What changes in script you want?</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg border border-zinc-700 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-300 rounded-bl-sm border border-zinc-700"
                }`}
                style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-end gap-3 bg-zinc-800/60 rounded-xl border border-zinc-700 p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Changes in script.. (Enter to send)"
            rows={2}
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
            style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              input.trim() && !loading
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ScriptWriter component ──────────────────────────────────
const ScriptWriter = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedNewsId = useAppSelector((s) => s.newsSelection.selectedNewsId);
  const dispatch = useAppDispatch();
  const newsIds: string[] = selectedNewsId ? [selectedNewsId] : [];

  const [phase, setPhase] = useState<"select-type" | "generating" | "editor">("select-type");
  const [scriptType, setScriptType] = useState<ScriptType>(null);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [anchor, setAnchor] = useState("");
  const [voiceOver, setVoiceOver] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [activeTab, setActiveTab] = useState<"anchor" | "voiceover">("anchor");
  const [error, setError] = useState<string | null>(null);
  const [scriptGenerated, setScriptGenerated] = useState(false); // ✅ NEW

  const handleSelectType = async (type: "short" | "long") => {
    setScriptType(type);
    setPhase("generating");
    setError(null);

    try {
      const res = await axios.post(`${API}/generate`, {
        newsIds,
        scriptType: type,
      });

      if (res.data?.success) {
        const data = res.data.data;
        setScript(data);
        setAnchor(data.anchor);
        setVoiceOver(data.voiceOver);
        setThumbnail(data.thumbnail || "");
        setScriptGenerated(true);
        dispatch(clearSelectedNewsIds());
        setPhase("editor");
      } else {
        throw new Error(res.data?.message || "Generation failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to generate script");
      setPhase("select-type");
    }
  };

  const handleRefine = async (userMessage: string) => {
    setChatLoading(true);
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);

    try {
      const res = await axios.post(`${API}/refine`, {
        anchor,
        voiceOver: scriptType === "short" ? "" : voiceOver,
        userMessage,
        scriptType,
      });

      if (res.data?.success) {
        const { anchor: newAnchor, voiceOver: newVoiceOver, changes } = res.data.data;
        setAnchor(newAnchor);
        if (scriptType === "long") setVoiceOver(newVoiceOver);
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: changes || "Script has been updated",
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error("Refinement failed");
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Please try again!",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const heading = thumbnail || anchor.slice(0, 80) + "...";
      await axios.post(
        `${API}/save`,
        { heading, anchor, voiceOver: scriptType === "short" ? "" : voiceOver, thumbnail, scriptType },
        { withCredentials: true }
      );
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save script");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPhase("select-type");
    setScript(null);
    setAnchor("");
    setVoiceOver("");
    setThumbnail("");
    setChatMessages([]);
    setScriptType(null);
    setScriptGenerated(false);
  };

  // ✅ Only show "No News Selected" if no news AND script hasn't been generated yet
  if (newsIds.length === 0 && !scriptGenerated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/8 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">No News Selected</h2>
            <p className="text-zinc-500 text-sm">
              Please go to AI News page and select at least one news to generate a script.
            </p>
          </div>
          <button
            onClick={() => navigate("/ai-news")}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Go to AI News
          </button>
        </div>
      </div>
    );
  }

  if (phase === "select-type") {
    return (
      <>
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-900/80 border border-red-700 text-red-300 rounded-xl text-sm backdrop-blur-sm">
            {error}
          </div>
        )}
        <ScriptTypeSelector
          onSelect={handleSelectType}
          loading={false}
          newsCount={newsIds.length}
        />
      </>
    );
  }

  if (phase === "generating") {
    return <GeneratingLoader scriptType={scriptType} />;
  }

  // ── Editor phase ──
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/60 px-4 sm:px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/ai-news")}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Script Editor</h1>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  scriptType === "short"
                    ? "bg-blue-600/20 text-blue-400"
                    : "bg-violet-600/20 text-violet-400"
                }`}>
                  {scriptType === "short" ? "Short Script" : "Long Script"}
                </span>
                <span className="text-xs text-zinc-600">•</span>
                <span className="text-xs text-zinc-500">{newsIds.length} News</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all border border-zinc-700"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="hidden sm:inline">Regenerate</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saveLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                savedOk
                  ? "bg-green-600/20 text-green-400 border border-green-500/30"
                  : saveLoading
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              }`}
            >
              {savedOk ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </>
              ) : (
                <>
                  <SaveIcon />
                  Save Script
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 px-5 py-3 bg-red-900/40 border border-red-700/50 text-red-300 rounded-xl text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 flex flex-col xl:flex-row gap-5">
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {scriptType === "long" && (
            <div className="flex sm:hidden gap-2 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
              {(["anchor", "voiceover"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab === "anchor" ? "🎙 Anchor" : "🎙 Voice Over"}
                </button>
              ))}
            </div>
          )}

          <div className="hidden sm:flex flex-col gap-5">
            <ScriptBlock
              label={scriptType === "short" ? "Short / Anchor Script" : "Anchor Script"}
              icon={<AnchorIcon />}
              accentColor="border-blue-900/40"
              value={anchor}
              onChange={setAnchor}
            />
            {scriptType === "long" && (
              <ScriptBlock
                label="Voice Over Script"
                icon={<MicIcon />}
                accentColor="border-violet-900/40"
                value={voiceOver}
                onChange={setVoiceOver}
              />
            )}
          </div>

          <div className="sm:hidden">
            {scriptType === "short" || activeTab === "anchor" ? (
              <ScriptBlock
                label={scriptType === "short" ? "Short / Anchor Script" : "Anchor Script"}
                icon={<AnchorIcon />}
                accentColor="border-blue-900/40"
                value={anchor}
                onChange={setAnchor}
              />
            ) : (
              <ScriptBlock
                label="Voice Over Script"
                icon={<MicIcon />}
                accentColor="border-violet-900/40"
                value={voiceOver}
                onChange={setVoiceOver}
              />
            )}
          </div>
        </div>

        <div className="w-full xl:w-[380px] xl:flex-shrink-0 h-[520px] xl:h-auto xl:min-h-[600px] xl:sticky xl:top-20 xl:self-start">
          <AIChat
            onRefine={handleRefine}
            messages={chatMessages}
            loading={chatLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ScriptWriter;