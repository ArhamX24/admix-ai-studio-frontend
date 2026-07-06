import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Send, Download, Loader2, Sparkles,
  ArrowLeft, Wand2, Bot, User, ImageIcon, Zap,
  Youtube, Play, ChevronDown, Check, Tv2, Plus, X,
  Smartphone
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '@/Utils/URL';

// Make sure these paths match your folder structure
import BBmix   from "../../Logos/BB MIX LOGO.png";
import BBstory from "../../Logos/BB STORY LOGO.png";
import PDNnews from "../../Logos/PDN NEWS LOGO.png";
import Storyfm from "../../Logos/STORY FM LOGO.png";
import Ycity   from "../../Logos/YCITY LOGO.png";

const API_BASE = `${baseURL}/api/v1/thumbnail`;

// ── Types & Constants ───────────────────────────────────────────────
const CHANNELS = [
  { id: 'bbmix',   label: 'BB Mix',   logo: BBmix   },
  { id: 'bbstory', label: 'BB Story', logo: BBstory },
  { id: 'pdnnews', label: 'PDN News', logo: PDNnews },
  { id: 'storyfm', label: 'Story FM', logo: Storyfm },
  { id: 'ycity',   label: 'Y City',   logo: Ycity   },
] as const;

type ChannelId = typeof CHANNELS[number]['id'];
type AssetFormat = 'graphic' | 'youtube' | 'shorts';

interface ScriptState {
  id?: string;
  heading: string;
  anchor: string;
  newsImageUrl?: string;
  scriptType?: 'short' | 'long' | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  loading?: boolean;
  isNew?: boolean;
  assetFormat?: AssetFormat;
}

interface ThumbnailResult {
  imageUrl: string;
  imageKey: string;
  prompt: string;
  assetFormat: AssetFormat;
  channelName: ChannelId | null;
}

const suggestions = [
  "Make the text bigger",
  "Change the background to dark red",
  "Make it look more dramatic",
  "Put this person's face in the image"
];

// ── Custom ChatGPT Style Loader ──────────────────────────────────
const ChatGptLoader = ({ format }: { format: AssetFormat }) => {
  let aspectClass = "w-[220px] aspect-square";
  if (format === 'youtube') aspectClass = "w-[300px] aspect-video";
  if (format === 'shorts') aspectClass = "w-[180px] aspect-[9/16]";

  return (
    <div className={`relative flex items-center justify-center rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl mt-2 ${aspectClass}`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/10 animate-pulse" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)] -translate-x-full animate-[shimmer_1.5s_infinite]" />
      <div className="flex flex-col items-center gap-3 relative z-10">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
        <span className="text-zinc-400 text-[10px] font-semibold tracking-widest uppercase">Creating Graphic...</span>
      </div>
    </div>
  );
};

// ── Channel Dropdown ─────────────────────────────────────────────
const ChannelDropdown: React.FC<{
  value: ChannelId | null;
  onChange: (id: ChannelId) => void;
  compact?: boolean;
}> = ({ value, onChange, compact = false }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = CHANNELS.find((c) => c.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={dropdownRef} className="relative z-50 w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 bg-zinc-900/80 border transition-all rounded-xl ${
          open ? 'border-violet-500/50 shadow-lg shadow-violet-500/10' : 'border-white/10 hover:border-white/20'
        } ${compact ? 'px-2.5 py-1.5' : 'px-4 py-3'}`}
      >
        <div className="flex items-center gap-3">
          {selected ? (
            <>
              <img src={selected.logo} alt={selected.label} className={`object-contain rounded ${compact ? 'w-4 h-4' : 'h-6'}`} />
              <span className={`text-zinc-200 font-semibold whitespace-nowrap ${compact ? 'text-[10px]' : 'text-sm'}`}>{selected.label}</span>
            </>
          ) : (
            <>
              <Tv2 className={`text-zinc-500 ${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
              <span className={`text-zinc-500 whitespace-nowrap ${compact ? 'text-[10px]' : 'text-sm font-semibold'}`}>Select Channel Logo</span>
            </>
          )}
        </div>
        <ChevronDown className={`text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 w-full min-w-[160px] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { onChange(ch.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/80 transition-all text-left ${value === ch.id ? 'bg-zinc-800/60' : ''}`}
            >
              <img src={ch.logo} alt={ch.label} className="h-6 object-contain rounded flex-shrink-0" />
              <span className="text-zinc-200 text-sm font-medium flex-1">{ch.label}</span>
              {value === ch.id ? <Check className="w-4 h-4 text-violet-400 flex-shrink-0" /> : <div className="w-4 h-4 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Thumbnail Card ───────────────────────────────────────────────
const ThumbnailCard: React.FC<{
  imageUrl: string;
  assetFormat: AssetFormat;
  onDownload: (url: string) => void;
  isNew?: boolean;
}> = ({ imageUrl, assetFormat, onDownload, isNew }) => {
  const [loaded, setLoaded] = useState(false);
  
  let aspectStyle = { width: '220px', aspectRatio: '1/1' };
  let labelText = "1024 × 1024 · Graphic";
  let shortLabel = "1:1";

  if (assetFormat === 'youtube') {
    aspectStyle = { width: '300px', aspectRatio: '16/9' };
    labelText = "1792 × 1024 · YouTube";
    shortLabel = "YT";
  } else if (assetFormat === 'shorts') {
    aspectStyle = { width: '180px', aspectRatio: '9/16' };
    labelText = "1024 × 1792 · Reels";
    shortLabel = "9:16";
  }

  return (
    <div className={`relative mt-3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 group transition-all duration-700 ${isNew ? 'animate-[fadeSlideUp_0.5s_ease_forwards]' : ''}`} style={{ width: aspectStyle.width }}>
      {!loaded && <div className="w-full bg-zinc-800 animate-pulse rounded-2xl" style={{ aspectRatio: aspectStyle.aspectRatio }} />}
      
      <img 
        src={imageUrl} 
        alt="Generated thumbnail" 
        className={`w-full object-cover block transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`} 
        style={{ aspectRatio: aspectStyle.aspectRatio }} 
        onLoad={() => setLoaded(true)} 
      />

      {loaded && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4 gap-2">
          <button onClick={() => onDownload(imageUrl)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-100 transition-all shadow-xl transform hover:scale-105 active:scale-95">
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <p className="text-white/50 text-[10px]">{labelText}</p>
        </div>
      )}

      {isNew && loaded && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 bg-violet-600 rounded-lg text-white text-[10px] font-bold tracking-wide shadow-lg">
          <Sparkles className="w-2.5 h-2.5" />
          NEW
        </div>
      )}

      {loaded && (
        <div className={`absolute top-2.5 right-2.5 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide ${assetFormat === 'youtube' ? 'bg-red-600/90 text-white' : 'bg-violet-600/90 text-white'}`}>
          {shortLabel}
        </div>
      )}
    </div>
  );
};

// ── Chat Bubble ──────────────────────────────────────────────────
const ChatBubble: React.FC<{
  message: ChatMessage;
  onDownload: (url: string, format: AssetFormat) => void;
}> = ({ message, onDownload }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-5">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] text-zinc-500 backdrop-blur-sm">
          <Zap className="w-3 h-3 text-violet-400" />
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-3 mb-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`} style={{ animation: 'fadeSlideUp 0.35s ease forwards' }}>
      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${isUser ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600' : 'bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10'}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-zinc-300" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white rounded-br-sm shadow-lg shadow-violet-500/20' : 'bg-zinc-800/90 border border-white/8 text-zinc-200 rounded-bl-sm backdrop-blur-sm'}`}>
          {message.imageUrl && message.role === 'user' && (
            <img src={message.imageUrl} alt="Reference" className="w-full max-w-[200px] rounded-lg mb-2 border border-white/20" />
          )}
          <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
        </div>

        {message.imageUrl && message.role === 'assistant' && message.assetFormat && (
          <ThumbnailCard 
            imageUrl={message.imageUrl} 
            assetFormat={message.assetFormat} 
            onDownload={(url) => onDownload(url, message.assetFormat!)} 
            isNew={message.isNew} 
          />
        )}
      </div>
    </div>
  );
};

// ── Script Badge ─────────────────────────────────────────────────
const ScriptBadge: React.FC<{
  script: ScriptState;
}> = ({ script }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-white/8 rounded-2xl backdrop-blur-md relative z-40">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
      <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-zinc-200 text-xs font-semibold leading-snug line-clamp-1" style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}>
        {script.heading}
      </p>
      <p className="text-zinc-600 text-[10px] mt-0.5 font-medium tracking-wide uppercase">
        {script.scriptType ? `${script.scriptType} Script Context` : 'Manual Script Context'}
      </p>
    </div>
  </div>
);


// ── Main Page Component ──────────────────────────────────────────
const AssetGeneratorPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const passedScript = location.state?.script as ScriptState | undefined;

  // Phase Router: source -> manual -> category -> config -> editor
  const [phase, setPhase] = useState<'source' | 'manual' | 'category' | 'config' | 'editor'>(
    passedScript ? 'category' : 'source'
  );
  
  const [script, setScript] = useState<ScriptState | null>(passedScript || null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAnchor, setManualAnchor] = useState("");

  const [assetCategory, setAssetCategory] = useState<'graphic' | 'thumbnail' | null>(null);
  const [assetFormat, setAssetFormat] = useState<AssetFormat | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelId | null>(null);

  const [messages,        setMessages]        = useState<ChatMessage[]>([]);
  const [inputText,       setInputText]       = useState('');
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [hasGenerated,    setHasGenerated]    = useState(false);
  const [latestAsset,     setLatestAsset]     = useState<ThumbnailResult | null>(null);
  
  // Reference Image Upload States
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDownload = async (imageUrl: string, format: AssetFormat) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `asset-${format}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Swal.fire({
        icon: 'success', title: 'Downloaded!', text: 'Asset saved.',
        background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false,
      });
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      setReferenceImagePreview(URL.createObjectURL(file));
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitManualScript = () => {
    if (!manualTitle.trim() || !manualAnchor.trim()) {
      return Swal.fire({ icon: 'warning', text: 'Please fill both headline and script fields', background: '#18181b', color: '#fff' });
    }
    setScript({ heading: manualTitle, anchor: manualAnchor });
    setPhase('category');
  };

  const buildFormData = (textInstruction?: string, isRefine = false, formatOverride?: AssetFormat) => {
    const formData = new FormData();
    const finalFormat = formatOverride || assetFormat!; 

    formData.append('anchor', script!.anchor);
    formData.append('assetFormat', finalFormat);
    
    // STRICT RULE: If thumbnail, force channelName to null so backend doesn't draw logo.
    if (assetCategory === 'thumbnail') {
      formData.append('channelName', 'null');
    } else {
      formData.append('channelName', selectedChannel ? selectedChannel : 'null');
    }

    formData.append('title', script!.heading); 

    if (script?.newsImageUrl) {
      formData.append('newsImageUrl', script.newsImageUrl);
    }

    if (referenceImage) {
      formData.append('referenceImage', referenceImage);
    }

    if (isRefine && latestAsset) {
      formData.append('userInstruction', textInstruction || '');
      formData.append('previousPrompt', latestAsset.prompt);
      
      // ---------- REPLICATE ADDITION ----------
      // We pass the key so the backend can fetch the base image from memory to swap the face onto
      formData.append('previousImageKey', latestAsset.imageKey);
      // ----------------------------------------
    }
    return formData;
  };

  const triggerGeneration = async (formatOverride?: AssetFormat) => {
    const finalFormat = formatOverride || assetFormat;
    if (!script || !finalFormat) return;

    setPhase('editor');
    setIsGenerating(true);
    clearReferenceImage();

    const requestData = buildFormData(undefined, false, finalFormat);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: hasGenerated ? `🔄 Generating new asset design...` : `🚀 Generate an eye-catching ${finalFormat}!`,
    };
    
    const loadingId  = `loading-${Date.now()}`;
    const loadingMsg: ChatMessage = { id: loadingId, role: 'assistant', content: '', loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const res = await axios.post(`${API_BASE}/generate`, requestData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000
      });
      const data: ThumbnailResult = res.data.data;
      setLatestAsset(data);
      setHasGenerated(true);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, loading: false, content: `✨ Asset is ready!\n\nHover on image for downloading.`, imageUrl: data.imageUrl, assetFormat: finalFormat, isNew: true }
            : m
        )
      );
    } catch (err: any) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId ? { ...m, loading: false, content: '❌ Generation failed, please try again.' } : m
        )
      );
      Swal.fire({
        icon: 'error', title: 'Generation Failed',
        text: err.response?.data?.message || 'Something went wrong.',
        background: '#18181b', color: '#fff',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if ((!messageText && !referenceImagePreview) || isGenerating || !latestAsset || !script || !assetFormat) return;

    const requestData = buildFormData(messageText, true, assetFormat);

    setInputText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsGenerating(true);
    
    const previewToKeep = referenceImagePreview;
    clearReferenceImage(); 

    const userMsg: ChatMessage   = { 
      id: `user-${Date.now()}`, 
      role: 'user', 
      content: messageText || "Updated with new reference image.",
      imageUrl: previewToKeep || undefined
    };
    const loadingId              = `loading-${Date.now()}`;
    const loadingMsg: ChatMessage = { id: loadingId, role: 'assistant', content: '', loading: true };
    
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const res = await axios.post(`${API_BASE}/refine`, requestData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000
      });
      
      const data: ThumbnailResult = res.data.data;
      setLatestAsset(data);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, loading: false, content: `✅ Updated!\n\nWhat else would you like to change?`, imageUrl: data.imageUrl, assetFormat: assetFormat, isNew: true }
            : m
        )
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.map((m) => m.id === loadingId ? { ...m, loading: false, content: '❌ Error in editing, please try again.' } : m));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      hasGenerated ? handleSendMessage() : triggerGeneration();
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden relative">
        {/* Ambient bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/6 rounded-full blur-3xl" />
        </div>

        {/* Top bar */}
        <div className="relative z-20 flex-shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/6 bg-black/40 backdrop-blur-xl">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/8 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-700 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <Wand2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm leading-none">Design Studio</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-semibold tracking-wide">ONLINE</span>
          </div>
        </div>

        {/* Routing Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-5 py-3 pb-[180px] scrollbar-hide">
          
          {/* Phase 1: Source Selection */}
          {phase === 'source' && (
            <div className="flex flex-col items-center justify-center h-full gap-6 max-w-2xl mx-auto animate-[fadeSlideUp_0.35s_ease_forwards]">
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold text-white mb-2">Graphic & Thumbnail Studio</h2>
                <p className="text-zinc-400 text-sm">How would you like to provide the news context?</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                <button onClick={() => setPhase('manual')} className="p-8 bg-zinc-900/80 border border-white/5 hover:border-violet-500/50 rounded-3xl transition-all duration-300 text-left hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-violet-500/20 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <ImageIcon className="w-5 h-5 text-violet-400"/>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Paste Manually</h3>
                  <p className="text-zinc-500 text-sm">Enter your headline and script text directly here.</p>
                </button>
                <button onClick={() => navigate('/scripts-list')} className="p-8 bg-zinc-900/80 border border-white/5 hover:border-blue-500/50 rounded-3xl transition-all duration-300 text-left hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-blue-400"/>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Select Saved Script</h3>
                  <p className="text-zinc-500 text-sm">Choose from AI-generated scripts in your database.</p>
                </button>
              </div>
            </div>
          )}

          {/* Phase 2: Manual Entry */}
          {phase === 'manual' && (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto w-full animate-[fadeSlideUp_0.35s_ease_forwards]">
              <div className="w-full bg-zinc-900/80 border border-white/10 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Manual Script Entry</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">News Headline / Title</label>
                    <input 
                      value={manualTitle} 
                      onChange={e => setManualTitle(e.target.value)} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-violet-500 transition-colors" 
                      placeholder="Enter a shocking headline..." 
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Context / Anchor Script</label>
                    <textarea 
                      value={manualAnchor} 
                      onChange={e => setManualAnchor(e.target.value)} 
                      rows={5} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-violet-500 resize-none transition-colors" 
                      placeholder="Paste the script text here so the AI understands the context..." 
                    />
                  </div>
                  <button onClick={submitManualScript} className="w-full py-4 bg-white text-black font-bold rounded-xl mt-2 hover:bg-zinc-200 transition-all shadow-xl shadow-white/10">
                    Continue to Design
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Phase 3: Category Selection */}
          {phase === 'category' && (
            <div className="flex flex-col items-center justify-center h-full gap-8 max-w-3xl mx-auto animate-[fadeSlideUp_0.35s_ease_forwards]">
              <div className="text-center mb-2">
                <h2 className="text-3xl font-bold text-white mb-2">What do you want to create?</h2>
                <p className="text-zinc-400 text-sm">Select the format style based on where you will post this.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                <button 
                  onClick={() => { setAssetCategory('graphic'); setAssetFormat('graphic'); setPhase('config'); }} 
                  className="p-8 bg-zinc-900/80 border border-white/5 hover:border-violet-500/50 rounded-3xl transition-all duration-300 text-center group hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10"
                >
                  <div className="w-16 h-16 bg-violet-500/20 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-violet-500/30 transition-colors">
                    <ImageIcon className="w-7 h-7 text-violet-400"/>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">News Graphic</h3>
                  <p className="text-zinc-500 text-sm">1:1 Square • Mandatory Channel Logo placement</p>
                </button>

                <button 
                  onClick={() => { setAssetCategory('thumbnail'); setPhase('config'); }} 
                  className="p-8 bg-zinc-900/80 border border-white/5 hover:border-red-500/50 rounded-3xl transition-all duration-300 text-center group hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10"
                >
                  <div className="w-16 h-16 bg-red-500/20 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-red-500/30 transition-colors">
                    <Youtube className="w-7 h-7 text-red-400"/>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Video Thumbnail</h3>
                  <p className="text-zinc-500 text-sm">16:9 or 9:16 • No logos • Clean typography</p>
                </button>
              </div>
            </div>
          )}

          {/* Phase 4: Configurations */}
          {phase === 'config' && assetCategory === 'graphic' && (
            <div className="flex flex-col items-center justify-center h-full px-4 max-w-md mx-auto w-full animate-[fadeSlideUp_0.35s_ease_forwards]">
              <div className="w-full bg-zinc-900/80 p-8 rounded-3xl border border-white/10 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-2 text-center">Select Graphic Logo</h2>
                <p className="text-zinc-500 text-xs text-center mb-8">This logo will be embedded in the top corner of the 1:1 graphic.</p>
                
                <ChannelDropdown value={selectedChannel} onChange={setSelectedChannel} />
                
                <button 
                  disabled={!selectedChannel} 
                  onClick={() => triggerGeneration()} 
                  className="w-full mt-8 py-4 bg-white text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-white/10 hover:bg-zinc-200"
                >
                  Generate Graphic (1:1)
                </button>
              </div>
            </div>
          )}

          {phase === 'config' && assetCategory === 'thumbnail' && (
            <div className="flex flex-col items-center justify-center h-full px-4 max-w-2xl mx-auto w-full animate-[fadeSlideUp_0.35s_ease_forwards]">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Select Aspect Ratio</h2>
                <p className="text-zinc-400 text-sm">Logos will be hidden for video thumbnails.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                <button 
                  onClick={() => { setAssetFormat('youtube'); triggerGeneration('youtube'); }} 
                  className="p-6 bg-zinc-900/80 border border-white/5 hover:border-red-500/50 rounded-3xl text-center transition-all hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1"
                >
                  <div className="w-full aspect-video bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-5">
                    <Youtube className="text-red-400 w-8 h-8"/>
                  </div>
                  <h3 className="text-white font-bold text-lg">YouTube (16:9)</h3>
                </button>
                <button 
                  onClick={() => { setAssetFormat('shorts'); triggerGeneration('shorts'); }} 
                  className="p-6 bg-zinc-900/80 border border-white/5 hover:border-fuchsia-500/50 rounded-3xl text-center transition-all hover:shadow-xl hover:shadow-fuchsia-500/10 hover:-translate-y-1"
                >
                  <div className="w-full aspect-[9/16] bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl flex items-center justify-center mb-5 mx-auto max-w-[120px]">
                    <Smartphone className="text-fuchsia-400 w-8 h-8"/>
                  </div>
                  <h3 className="text-white font-bold text-lg">Reels / Shorts (9:16)</h3>
                </button>
              </div>
            </div>
          )}

          {/* Phase 5: Editor Space */}
          {phase === 'editor' && (
            <div className="max-w-4xl mx-auto pt-6 px-4">
              
              {/* Context Badge shown at top of chat */}
              {script && (
                <div className="mb-6">
                  <ScriptBadge script={script} />
                </div>
              )}

              {messages.map((message) => (
                message.loading && assetFormat ? (
                  <div key={message.id} className="flex justify-start mb-5" style={{ animation: 'fadeSlideUp 0.35s ease forwards' }}>
                    <div className="flex flex-col gap-2 items-start">
                      <div className="px-4 py-3 bg-zinc-800/90 border border-white/8 text-zinc-200 rounded-2xl rounded-bl-sm">
                        Preparing your graphic...
                      </div>
                      <ChatGptLoader format={assetFormat} />
                    </div>
                  </div>
                ) : (
                  <ChatBubble key={message.id} message={message} onDownload={handleDownload} />
                )
              ))}
              <div ref={chatEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* ── Modern Centered Input Area (Only in Editor) ──────────────────────────────── */}
        {phase === 'editor' && assetFormat && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50 flex flex-col items-center">
            
            {/* Suggestions (Only if already generated) */}
            {hasGenerated && !isGenerating && (
              <div className="flex gap-2 overflow-x-auto pb-3 w-full justify-center scrollbar-hide">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSendMessage(s.replace(/^[^\s]+\s/, ''))}
                    className="flex-shrink-0 px-4 py-1.5 text-xs font-semibold bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-violet-500/50 text-zinc-300 hover:text-white rounded-full transition-all shadow-lg backdrop-blur-md"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form Box */}
            <div className="w-full bg-zinc-900/80 backdrop-blur-2xl border border-white/10 p-2.5 rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col transition-all">
              
              {/* Image Preview Box inside the flow */}
              {referenceImagePreview && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-md group bg-zinc-800 ml-12 mt-1 mb-2 shrink-0">
                  <img src={referenceImagePreview} alt="Reference" className="w-full h-full object-cover" />
                  <button onClick={clearReferenceImage} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" title="Remove Reference">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                {/* Reference Upload Button */}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  title="Upload reference image"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all flex-shrink-0 ml-1"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={hasGenerated ? "Message AI to refine graphic..." : "Type custom instructions or click Generate to start"}
                  disabled={isGenerating}
                  rows={1}
                  className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm py-2.5 px-2 resize-none outline-none leading-relaxed disabled:opacity-40"
                  style={{ maxHeight: '120px' }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                  }}
                />

                {/* Generate / Send Button */}
                <button
                  onClick={() => hasGenerated ? handleSendMessage() : triggerGeneration()}
                  disabled={isGenerating || (hasGenerated && !inputText.trim() && !referenceImagePreview)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:bg-white/10 disabled:text-zinc-500 flex-shrink-0 shadow-lg mr-1"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </>
  );
};

export default AssetGeneratorPage;