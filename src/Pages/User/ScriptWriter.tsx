import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { clearSelectedNewsIds } from "../../lib/Slice/newSelectionSlice.ts";
import { clearTranscript } from "../../lib/Slice/transcriptSlice.ts";
import axios from "axios";
import { baseURL } from "@/Utils/URL";

const API = `${baseURL}/api/v1/scripts`;

type ScriptType = "short" | "long" | "longest" | null;

interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  anchor?: string;
  voiceOver?: string;
  suggestions?: string;
  imagePreview?: string;
  timestamp: Date;
}

// ── Markdown Bold Renderer ──────────────────────────────────────────
// Converts **bold** markdown segments into <strong> tags without pulling in
// a full markdown library. Keeps everything else (line breaks, spacing,
// the "...." pacing dots) exactly as the model wrote it.
const renderFormattedText = (text?: string) => {
  if (!text) return null;

  // Split on **...** while keeping the delimiters so we can tell bold
  // segments apart from normal text.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-white">
          {boldText}
        </strong>
      );
    }
    // React.Fragment preserves plain text (including newlines, since the
    // parent container already has whitespace-pre-wrap applied).
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
};

// Strips markdown bold markers for plain-text contexts like clipboard copy,
// so what gets pasted elsewhere (e.g. a teleprompter tool) doesn't carry
// stray asterisks.
const stripMarkdownBold = (text?: string) => (text || "").replace(/\*\*([^*]+)\*\*/g, "$1");

// ── SVG Icons ──────────────────────────────────────────────────────
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125 1.125-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
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

const PhotoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// ── 1. Script Type Selector ───────────────────────────────────────────
const ScriptTypeSelector: React.FC<{
  onSelect: (type: "short" | "long" | "longest") => void;
  newsCount: number;
}> = ({ onSelect, newsCount }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/8 rounded-full blur-[120px]" />
    </div>
    <div className="relative z-10 text-center mb-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 mb-8">
        <SparklesIcon />
        <span>{newsCount} News Selected</span>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Choose Script Type</h1>
      <p className="text-zinc-400 text-sm max-w-sm mx-auto">Select the type of script you want to create.</p>
    </div>
    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
      <button
        onClick={() => onSelect("short")}
        className="group relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-blue-500/60 hover:bg-zinc-900 transition-all duration-300 text-left hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
      >
        <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:bg-blue-600/25 transition-colors">
          <AnchorIcon />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Short / Reels</h3>
        <p className="text-zinc-500 text-sm">~1 min duration • Anchor Only</p>
      </button>

      <button
        onClick={() => onSelect("long")}
        className="group relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-violet-500/60 hover:bg-zinc-900 transition-all duration-300 text-left hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1"
      >
        <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mb-5 group-hover:bg-violet-600/25 transition-colors">
          <MicIcon />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Standard Video</h3>
        <p className="text-zinc-500 text-sm">~5-8 min duration • Anchor + VO</p>
      </button>

      <button
        onClick={() => onSelect("longest")}
        className="group relative p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/60 hover:bg-zinc-900 transition-all duration-300 text-left hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:bg-amber-600/25 transition-colors">
          <AnchorIcon />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Long Video</h3>
        <p className="text-zinc-500 text-sm">10-20 min duration • Anchor Only</p>
      </button>
    </div>
  </div>
);

// ── 2. Time Configurator ───────────────────────────────────────────
const TimeConfigurator: React.FC<{
  type: ScriptType;
  onConfirm: (aMins: number, voMins: number) => void;
  onBack: () => void;
}> = ({ type, onConfirm, onBack }) => {
  const [anchorMins, setAnchorMins] = useState(type === "longest" ? 5 : 1);
  const [voMins, setVoMins] = useState(3);

  const getMinMaxValues = () => {
    // Limits lowered to prevent LLM hallucination/truncation on thin source material
    if (type === "short") return { min: 0.5, max: 3, step: 0.5 };
    if (type === "longest") return { min: 3, max: 10, step: 1 }; // Lowered from 25 to 10 max
    return { min: 0.5, max: 4, step: 0.5 }; // default for standard long anchor
  };

  const getVOBounds = () => {
    return { min: 1, max: 8, step: 0.5 }; // Lowered max VO limit to 8 mins
  }

  const bounds = getMinMaxValues();
  const voBounds = getVOBounds();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="relative z-10 p-8 rounded-3xl border border-zinc-800 bg-zinc-900/80 max-w-md w-full shadow-2xl border-t-zinc-700/50">
        <div className="flex items-center gap-2 mb-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          <span>Duration Parameter Config</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-6">Configure Script Limits</h2>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm font-medium text-zinc-300 mb-2">
              <span>Anchor Speaking Target</span>
              <span className="text-blue-400 font-mono font-bold">{anchorMins} Min</span>
            </div>
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={bounds.step}
              value={anchorMins}
              onChange={(e) => setAnchorMins(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-zinc-500 text-[11px] mt-1 font-mono">
              <span>Min: {bounds.min}m</span>
              <span>Target: ~{Math.round(anchorMins * 130)} words</span>
              <span>Max: {bounds.max}m</span>
            </div>
          </div>

          {type === "long" && (
            <div className="border-t border-zinc-800/80 pt-5">
              <div className="flex justify-between text-sm font-medium text-zinc-300 mb-2">
                <span>Voice Over (VO) Target</span>
                <span className="text-violet-400 font-mono font-bold">{voMins} Min</span>
              </div>
              <input
                type="range"
                min={voBounds.min}
                max={voBounds.max}
                step={voBounds.step}
                value={voMins}
                onChange={(e) => setVoMins(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex justify-between text-zinc-500 text-[11px] mt-1 font-mono">
                <span>Min: {voBounds.min}m</span>
                <span>Target: ~{Math.round(voMins * 130)} words</span>
                <span>Max: {voBounds.max}m</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-xl hover:bg-zinc-700 hover:text-white transition-all text-sm"
            >
              Back
            </button>
            <button
              onClick={() => onConfirm(anchorMins, voMins)}
              className="flex-[2] py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm shadow-xl shadow-white/5"
            >
              Compile Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── 3. Generating Loader ──────────────────────────────────────────
const GeneratingLoader: React.FC<{
  scriptType: ScriptType;
  onRetry: () => void;
}> = ({ scriptType, onRetry }) => {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 60000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-violet-500 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Creating Script</h2>
        <p className="text-zinc-400 text-sm max-w-xs">The AI is currently generating your script based on the selected configuration. This may take a few moments.</p>

        {showRetry && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center gap-4 mt-10 p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl backdrop-blur-sm max-w-sm">
            <p className="text-zinc-400 text-sm leading-relaxed">
              <span className="text-amber-400 font-semibold block mb-1">Queue latency detected</span>
              The LLM execution thread is taking longer than expected. You may reset the active connection pool.
            </p>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium rounded-xl transition-all shadow-lg"
            >
              Cancel & Reconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


// ── 4. Main Architecture Component (ChatGPT Interface) ────────────
const ScriptWriter = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const selectedNewsId = useAppSelector((s) => s.newsSelection.selectedNewsId);
  const transcriptText = useAppSelector((s) => s.transcript.fullText);
  const newsIds: string[] = selectedNewsId ? [selectedNewsId] : [];

  const [phase, setPhase] = useState<"select-type" | "configure-time" | "generating" | "chat">("select-type");
  const [scriptType, setScriptType] = useState<ScriptType>(null);

  // Tracking the active script parameters for saving to the DB
  const [title, setTitle] = useState("");
  const [activeAnchor, setActiveAnchor] = useState("");
  const [activeVoiceOver, setActiveVoiceOver] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState<string | null>(null);
  const [scriptGenerated, setScriptGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep chat scrolled to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading, phase]);

  // Handle Image Upload for Chat
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Copy functionality for script blocks — strips ** markers so pasted
  // text elsewhere doesn't carry raw markdown syntax.
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(stripMarkdownBold(text));
    alert("Copied to clipboard!");
  };

  if (newsIds.length === 0 && !transcriptText && !scriptGenerated && phase === "select-type") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 px-4">
        <div className="relative z-10 text-center flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">No News Selected </h2>
            <p className="text-zinc-400 text-sm max-w-xs">Please select at least one news to proceed with script generation.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/ai-news")} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl text-sm border border-zinc-800 transition-all">
              Daily Fetch
            </button>
            <button onClick={() => navigate("/url-news-ai")} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10">
              Extract Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleTypeSelection = (type: "short" | "long" | "longest") => {
    setScriptType(type);
    setPhase("configure-time");
  };

  const handleTimeConfirmation = async (aMins: number, voMins: number) => {
    setPhase("generating");
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const res = await axios.post(`${API}/generate`, {
        newsIds: newsIds.length > 0 ? newsIds : undefined,
        transcriptText: transcriptText || undefined,
        scriptType,
        anchorMins: aMins,
        voMins
      }, { signal: abortControllerRef.current.signal });

      if (res.data?.success) {
        const payload = res.data.data;
        setTitle(payload.title || "News Update");
        setActiveAnchor(payload.anchor || "");
        setActiveVoiceOver(payload.voiceOver || "");
        setThumbnail(payload.thumbnail || "");
        setNewsImageUrl(payload.newsImageUrl || null);
        setScriptGenerated(true);

        // 1. Clear News IDs
        dispatch(clearSelectedNewsIds());

        // 2. Clear Transcript
        if (transcriptText) {
          dispatch(clearTranscript());
        }

        // 3. Setup Initial Chat State
        setChatMessages([
          {
            role: "assistant",
            content: "I have generated the initial script based on your parameters. Please review it below, along with my safety and quality review. Let me know if you want to make any adjustments.",
            anchor: payload.anchor,
            voiceOver: payload.voiceOver,
            suggestions: payload.suggestions,
            timestamp: new Date()
          }
        ]);

        setPhase("chat");
      }
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      setError(err.response?.data?.message || "Thread deployment processing exception.");
      setPhase("select-type");
    }
  };

  const handleSendRefinement = async () => {
    if ((!input.trim() && !imagePreview) || chatLoading) return;

    let cleanBase64 = undefined;
    if (imagePreview) {
      cleanBase64 = imagePreview.split(",")[1];
    }

    const userMsg = input.trim() || "Please evaluate this attached asset style template layout reference";
    setInput("");
    setImagePreview(null);

    setChatMessages(p => [
        ...p, 
        { 
          role: "user", 
          content: userMsg, 
          imagePreview: imagePreview || undefined, // converts null to undefined
          timestamp: new Date() 
        }
      ]);

    setChatLoading(true);

    try {
      const res = await axios.post(`${API}/refine`, {
        anchor: activeAnchor,
        voiceOver: (scriptType === "short" || scriptType === "longest") ? "" : activeVoiceOver,
        userMessage: userMsg,
        scriptType,
        base64Image: cleanBase64
      });

      if (res.data?.success) {
        const data = res.data.data;

        // Update the active script state for saving
        setActiveAnchor(data.anchor);
        if (scriptType === "long") setActiveVoiceOver(data.voiceOver || activeVoiceOver);

        setChatMessages(p => [...p, {
          role: "assistant",
          content: data.changes || "I have applied your requested changes. Here is the updated script.",
          anchor: data.anchor,
          voiceOver: data.voiceOver,
          suggestions: data.suggestions,
          timestamp: new Date()
        }]);
      }
    } catch (err: any) {
      setChatMessages(p => [...p, { role: "assistant", content: "Sorry, I encountered a parsing exception on the sandbox processing thread.", timestamp: new Date() }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const heading = thumbnail || activeAnchor.slice(0, 75) + "...";
      await axios.post(`${API}/save`, {
        heading,
        title: title || heading,
        anchor: activeAnchor,
        voiceOver: (scriptType === "short" || scriptType === "longest") ? "" : activeVoiceOver,
        thumbnail: thumbnail || heading,
        scriptType,
        newsIds: newsIds.length > 0 ? newsIds : [],
        newsImageUrl: newsImageUrl
      }, { withCredentials: true });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Database write error occurred.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (phase === "select-type") return <ScriptTypeSelector onSelect={handleTypeSelection} newsCount={newsIds.length} />;
  if (phase === "configure-time") return <TimeConfigurator type={scriptType} onConfirm={handleTimeConfirmation} onBack={() => setPhase("select-type")} />;
  if (phase === "generating") return <GeneratingLoader scriptType={scriptType} onRetry={() => setPhase("select-type")} />;

  // ── ChatGPT Style Environment Layout ────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#212121] font-sans selection:bg-blue-600/30 selection:text-white">
      <style>{`
        .dark-scroll::-webkit-scrollbar { width: 6px !important; }
        .dark-scroll::-webkit-scrollbar-track { background: transparent !important; }
        .dark-scroll::-webkit-scrollbar-thumb { background: #404040 !important; border-radius: 99px !important; }
        .dark-scroll::-webkit-scrollbar-thumb:hover { background: #525252 !important; }
      `}</style>

      {/* Controller Header */}
      <header className="sticky top-0 z-30 bg-[#212121] border-b border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/ai-news")} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center transition-all">
            ←
          </button>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">AI Script Editor</h1>
            <span className="text-[11px] text-zinc-400 capitalize">{scriptType === "longest" ? "Long Podcast Deep-Dive" : `${scriptType} platform`}</span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saveLoading || !activeAnchor}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
            savedOk ? "bg-green-900 text-green-400 border-green-800" : "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5"
          }`}
        >
          {savedOk ? "Saved to Database!" : <><SaveIcon /> Save Script</>}
        </button>
      </header>

      {error && (
        <div className="mx-auto max-w-3xl w-full mt-4 px-4 py-3 bg-red-950/40 border border-red-900 text-red-400 rounded-xl text-xs flex justify-between items-center">
          <span>{error}</span><button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Chat Thread Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 dark-scroll relative">
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

              {/* Avatar for Assistant */}
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-blue-900/20">
                  <SparklesIcon />
                </div>
              )}

              <div className={`max-w-[85%] text-sm leading-relaxed ${msg.role === "user" ? "bg-zinc-700 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md" : "text-zinc-200"}`}>

                {/* Regular Message Text / Images */}
                {msg.imagePreview && <img src={msg.imagePreview} alt="Reference" className="w-48 rounded-lg mb-3 border border-zinc-600 shadow-sm" />}

                {msg.content && (
                <div className="mb-5 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-300">
                  {msg.content}
                </div>
              )}

                {/* Script Blocks Generated by AI */}
                {(msg.anchor || msg.voiceOver) && (
                  <div className="space-y-4 mt-2">

                    {/* Anchor Block */}
                    {msg.anchor && (
                      <div className="bg-[#2f2f2f] border border-zinc-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AnchorIcon /> <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Anchor Script</span>
                          </div>
                          <button onClick={() => copyToClipboard(msg.anchor || "")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                            <CopyIcon />
                          </button>
                        </div>
                        <div className="p-5 font-['Noto_Sans_Devanagari'] text-base text-zinc-200 whitespace-pre-wrap leading-8">
                          {renderFormattedText(msg.anchor)}
                        </div>
                      </div>
                    )}

                    {/* VO Block */}
                    {msg.voiceOver && scriptType === "long" && (
                      <div className="bg-[#2f2f2f] border border-zinc-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MicIcon /> <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Voice Over</span>
                          </div>
                          <button onClick={() => copyToClipboard(msg.voiceOver || "")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                            <CopyIcon />
                          </button>
                        </div>
                        <div className="p-5 font-['Noto_Sans_Devanagari'] text-base text-zinc-200 whitespace-pre-wrap leading-8">
                          {renderFormattedText(msg.voiceOver)}
                        </div>
                      </div>
                    )}

                    {/* Suggestions/Critiques */}
                    {msg.suggestions && (
                      <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex gap-3 text-amber-200/90 mt-2">
                        <div className="mt-0.5"><AlertIcon /></div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1.5 opacity-80">AI Safety & Quality Review</h4>
                          <p className="text-sm leading-relaxed">{msg.suggestions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {chatLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center animate-pulse shadow-md shadow-blue-900/20">
                <SparklesIcon />
              </div>
              <div className="text-zinc-400 text-sm mt-1 animate-pulse font-medium">Recompiling narrative flow...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Composer Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-12 pb-6 px-4">
        <div className="max-w-3xl mx-auto relative">

          {imagePreview && (
            <div className="absolute -top-16 left-0 bg-zinc-800 p-1.5 rounded-xl border border-zinc-700 shadow-2xl">
              <img src={imagePreview} className="h-12 w-12 object-cover rounded-lg" />
              <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm">✕</button>
            </div>
          )}

          <div className="flex items-end gap-2 bg-[#2f2f2f] rounded-2xl p-2 border border-zinc-700 focus-within:border-zinc-500 shadow-xl transition-colors">
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageFile} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={chatLoading}
              className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-xl transition-all mb-0.5"
            >
              <PhotoIcon />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendRefinement(); } }}
              placeholder="Ask the AI to change the tone, rewrite a section, or add new facts..."
              rows={1}
              disabled={chatLoading}
              className="flex-1 bg-transparent text-zinc-100 p-3 outline-none resize-none max-h-32 min-h-[44px] text-sm dark-scroll"
            />

            <button
              onClick={handleSendRefinement}
              disabled={(!input.trim() && !imagePreview) || chatLoading}
              className={`p-3 rounded-xl mb-0.5 transition-all ${
                (input.trim() || imagePreview) && !chatLoading ? "bg-white text-black hover:bg-zinc-200 shadow-md shadow-white/10" : "bg-transparent text-zinc-600"
              }`}
            >
              <SendIcon />
            </button>
          </div>
          <div className="text-center mt-3 text-[11px] text-zinc-500 font-medium">
            AI edits the script based on your instructions. Press 'Save Script' when satisfied with the final output above.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptWriter;