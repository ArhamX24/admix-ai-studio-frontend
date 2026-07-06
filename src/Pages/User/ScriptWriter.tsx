import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { clearSelectedNewsIds } from "../../lib/Slice/newSelectionSlice.ts";
import axios from "axios";
import { baseURL } from "@/Utils/URL";

const API = `${baseURL}/api/v1/scripts`;

type ScriptType = "short" | "long" | "longest" | null;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  timestamp: Date;
}

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
        <h3 className="text-xl font-bold text-white mb-2">Long Video </h3>
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
  const [anchorMins, setAnchorMins] = useState(type === "longest" ? 12 : 1);
  const [voMins, setVoMins] = useState(5);

  const getMinMaxValues = () => {
    if (type === "short") return { min: 0.5, max: 3, step: 0.5 };
    if (type === "longest") return { min: 5, max: 25, step: 1 };
    return { min: 0.5, max: 4, step: 0.5 }; // default for standard long anchor
  };

  const bounds = getMinMaxValues();

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
                min={2} 
                max={15} 
                step={0.5} 
                value={voMins} 
                onChange={(e) => setVoMins(Number(e.target.value))} 
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500" 
            />
              <div className="flex justify-between text-zinc-500 text-[11px] mt-1 font-mono">
                <span>Min: 2m</span>
                <span>Target: ~{Math.round(voMins * 130)} words</span>
                <span>Max: 15m</span>
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

// ── 4. Script Block Container ─────────────────────────────────────
const ScriptBlock: React.FC<{
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, icon, accentColor, value, onChange }) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl border bg-zinc-900/40 overflow-hidden flex flex-col ${accentColor}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 flex-shrink-0 bg-zinc-900/20">
        <div className="flex items-center gap-3">
          <div className="text-zinc-400">{icon}</div>
          <span className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">{label}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center z-10 gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-all"
        >
          {copied ? <span className="text-green-400 font-medium">Copied!</span> : <><CopyIcon />Copy</>}
        </button>
      </div>

      <div className="dark-scroll overflow-y-auto" style={{ maxHeight: "460px" }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-zinc-300 text-sm leading-8 p-6 outline-none resize-none font-medium selection:bg-blue-600/30 selection:text-white"
          placeholder={`${label} content will be loaded natively...`}
          style={{
            fontFamily: "'Noto Sans Devanagari', 'Arial Unicode MS', sans-serif",
            minHeight: "240px",
            height: "auto",
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
};

// ── 5. AI Chat (Vision and Multimodal Upgraded) ───────────────────
const AIChat: React.FC<{
  onRefine: (msg: string, imgBase64?: string) => void;
  messages: ChatMessage[];
  loading: boolean;
  scriptType: ScriptType;
}> = ({ onRefine, messages, loading, scriptType }) => {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if (!input.trim() && !imagePreview || loading) return;
    
    let cleanBase64 = undefined;
    if (imagePreview) {
      cleanBase64 = imagePreview.split(",")[1];
    }

    onRefine(input.trim() || "Please evaluate this attached asset style template layout reference", cleanBase64);
    setInput("");
    setImagePreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/30 rounded-2xl border border-zinc-800 overflow-hidden backdrop-blur-md">
      <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between flex-shrink-0 bg-zinc-900/10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <div>
            <p className="text-xs font-bold text-zinc-200 uppercase tracking-wider">ChatBot Editor</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="dark-scroll flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-zinc-950/20">
        {messages.length === 0 ? (
          <div className="text-center pt-8 px-4 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <SparklesIcon />
            </div>
            <p className="text-zinc-400 text-xs font-medium max-w-xs leading-relaxed">
              Paste instructions or drop structural template layouts using the image uploader module.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm shadow-md" : "bg-zinc-800/90 border border-zinc-700/50 text-zinc-300 rounded-bl-sm"
              }`}>
                {msg.imagePreview && (
                  <img src={msg.imagePreview} alt="Vision Token Entity" className="w-full max-w-[180px] rounded-lg mb-2 border border-zinc-700 shadow-sm" />
                )}
                <span style={{ fontFamily: msg.role === "assistant" ? "'Noto Sans Devanagari', sans-serif" : "inherit" }}>
                  {msg.content}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input UI */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex-shrink-0">
        {imagePreview && (
          <div className="relative inline-block mb-3 bg-zinc-900 p-1 rounded-xl border border-zinc-800 shadow-xl">
            <img src={imagePreview} className="h-16 w-16 object-cover rounded-lg" />
            <button 
              onClick={() => setImagePreview(null)} 
              className="absolute -top-1.5 -right-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] border border-zinc-700"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-zinc-950/80 rounded-xl border border-zinc-800 p-2 focus-within:border-zinc-700/80 transition-all">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageFile} />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
            disabled={loading}
          >
            <PhotoIcon />
          </button>
          <textarea 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder="Type instructions or paste reference..." 
            rows={1} 
            className="flex-1 bg-transparent text-sm text-zinc-200 p-2 outline-none resize-none max-h-24 dark-scroll min-h-[36px]" 
            disabled={loading} 
          />
          <button 
            onClick={handleSend} 
            disabled={(input.trim() === "" && !imagePreview) || loading} 
            className={`p-2 rounded-lg flex-shrink-0 transition-all ${
              (input.trim() || imagePreview) && !loading ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-zinc-800 text-zinc-600"
            }`}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 6. Main Architecture Component ────────────────────────────────
const ScriptWriter = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const selectedNewsId = useAppSelector((s) => s.newsSelection.selectedNewsId);
  const newsIds: string[] = selectedNewsId ? [selectedNewsId] : [];

  

  const [phase, setPhase] = useState<"select-type" | "configure-time" | "generating" | "editor">("select-type");
  const [scriptType, setScriptType] = useState<ScriptType>(null);
  
  const [title, setTitle] = useState("");
  const [anchor, setAnchor] = useState("");
  const [voiceOver, setVoiceOver] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState<string | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"anchor" | "voiceover">("anchor");
  const [error, setError] = useState<string | null>(null);
  const [scriptGenerated, setScriptGenerated] = useState(false);
  
  const [timeLimits, setTimeLimits] = useState({ anchorMins: 1, voMins: 5 });

  const abortControllerRef = useRef<AbortController | null>(null);

  if (newsIds.length === 0 && !scriptGenerated) {
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
    setTimeLimits({ anchorMins: aMins, voMins });
    setPhase("generating");
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const res = await axios.post(`${API}/generate`, {
        newsIds,
        scriptType,
        anchorMins: aMins,
        voMins
      }, { signal: abortControllerRef.current.signal });

      if (res.data?.success) {
        const payload = res.data.data;
        setTitle(payload.title || "News Update");
        setAnchor(payload.anchor || "");
        setVoiceOver(payload.voiceOver || "");
        setThumbnail(payload.thumbnail || "");
        setNewsImageUrl(payload.newsImageUrl || null); // <--- ADD THIS LINE
        setScriptGenerated(true);
        dispatch(clearSelectedNewsIds());
        setPhase("editor");
      }
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      setError(err.response?.data?.message || "Thread deployment processing exception.");
      setPhase("select-type");
    }
  };

  const handleRefine = async (userMessage: string, imgBase64?: string) => {
    setChatLoading(true);
    setChatMessages(p => [...p, { role: "user", content: userMessage, imagePreview: imgBase64 ? `data:image/jpeg;base64,${imgBase64}` : undefined, timestamp: new Date() }]);

    try {
      const res = await axios.post(`${API}/refine`, {
        anchor,
        voiceOver: (scriptType === "short" || scriptType === "longest") ? "" : voiceOver,
        userMessage,
        scriptType,
        base64Image: imgBase64
      });

      if (res.data?.success) {
        const data = res.data.data;
        setAnchor(data.anchor);
        if (scriptType === "long") setVoiceOver(data.voiceOver || voiceOver);
        setChatMessages(p => [...p, { role: "assistant", content: data.changes || "Script successfully recompiled.", timestamp: new Date() }]);
      }
    } catch (err) {
      setChatMessages(p => [...p, { role: "assistant", content: "Parsing exception on sandbox processing thread.", timestamp: new Date() }]);
    } finally {
      setChatLoading(false);
    }
  };

const handleSave = async () => {
    setSaveLoading(true);
    try {
      const heading = thumbnail || anchor.slice(0, 75) + "...";
      await axios.post(`${API}/save`, {
        heading,
        title: title || heading,
        anchor,
        voiceOver: (scriptType === "short" || scriptType === "longest") ? "" : voiceOver,
        thumbnail: thumbnail || heading,
        scriptType,
        newsIds: newsIds.length > 0 ? newsIds : [],
        newsImageUrl: newsImageUrl 
      }, { withCredentials: true });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Database write error occurred.");
    } finally {
      setSaveLoading(false);
    }
  };

  if (phase === "select-type") return <ScriptTypeSelector onSelect={handleTypeSelection} newsCount={newsIds.length} />;
  if (phase === "configure-time") return <TimeConfigurator type={scriptType} onConfirm={handleTimeConfirmation} onBack={() => setPhase("select-type")} />;
  if (phase === "generating") return <GeneratingLoader scriptType={scriptType} onRetry={() => setPhase("select-type")} />;

  // ── Editor Environment Layout ────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white">
      <style>{`
        .dark-scroll::-webkit-scrollbar { width: 6px !important; }
        .dark-scroll::-webkit-scrollbar-track { background: #09090b !important; }
        .dark-scroll::-webkit-scrollbar-thumb { background: #27272a !important; border-radius: 99px !important; }
        .dark-scroll::-webkit-scrollbar-thumb:hover { background: #3f3f46 !important; }
      `}</style>

      {/* Controller Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/ai-news")} className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-all">
              ←
            </button>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Workspace</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 capitalize">
                {scriptType === "longest" ? "Long Podcast Deep-Dive" : `${scriptType} platform`}
              </span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition-all ${
              savedOk ? "bg-green-950 text-green-400 border border-green-800/60" : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {savedOk ? "Saved!" : <><SaveIcon /> Save Scripts</>}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-950/40 border border-red-900 text-red-400 rounded-xl text-xs flex justify-between items-center">
          <span>{error}</span><button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Editor Space Matrix */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6 flex flex-col xl:flex-row gap-5 h-[calc(100vh-80px)] overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto dark-scroll pr-1 min-w-0">
          
          {/* Long script layout specific tab selectors for small screen matrices */}
          {scriptType === "long" && (
            <div className="flex sm:hidden gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {(["anchor", "voiceover"] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase ${activeTab === tab ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Desktop Matrix Layout */}
          <div className="hidden sm:flex flex-col gap-5">
            <ScriptBlock label={ "Anchor Script"} icon={<AnchorIcon />} accentColor="border-blue-900/30" value={anchor} onChange={setAnchor} />
            {scriptType === "long" && (
              <ScriptBlock label="Voice Over" icon={<MicIcon />} accentColor="border-violet-900/30" value={voiceOver} onChange={setVoiceOver} />
            )}
          </div>

          {/* Mobile Display Matrix Only */}
          <div className="sm:hidden flex-1">
            {scriptType !== "long" || activeTab === "anchor" ? (
              <ScriptBlock label="Anchor Content Sequence" icon={<AnchorIcon />} accentColor="border-blue-900/30" value={anchor} onChange={setAnchor} />
            ) : (
              <ScriptBlock label="Voice Over Sequence Engine" icon={<MicIcon />} accentColor="border-violet-900/30" value={voiceOver} onChange={setVoiceOver} />
            )}
          </div>
        </div>

        {/* Floating Chat Interface */}
        <div className="w-full xl:w-[400px] xl:flex-shrink-0 h-[480px] xl:h-full pb-2 xl:pb-0">
          <AIChat onRefine={handleRefine} messages={chatMessages} loading={chatLoading} scriptType={scriptType} />
        </div>
      </div>
    </div>
  );
};

export default ScriptWriter;