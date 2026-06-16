import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Send, Download, Loader2, Sparkles, RefreshCw,
  ArrowLeft, Wand2, Bot, User, ImageIcon, Zap,
  Youtube, Play, ChevronDown, Check, Tv2, Plus, X
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

type ChannelId      = typeof CHANNELS[number]['id'];
type ThumbnailType  = 'youtube' | 'reels';

interface ScriptState {
  id: string;
  heading: string;
  anchor: string;
  voiceOver: string;
  scriptType: 'short' | 'long' | null;
  thumbnail?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  loading?: boolean;
  isNew?: boolean;
  thumbnailType?: ThumbnailType;
}

interface ThumbnailResult {
  imageUrl: string;
  imageKey: string;
  prompt: string;
  scriptType: string;
  thumbnailType: ThumbnailType;
  channelName: ChannelId | null;
  changes?: string;
}

const suggestions = [""];

// ── Custom ChatGPT Style Loader ──────────────────────────────────
const ChatGptLoader = ({ isYoutube }: { isYoutube: boolean }) => (
  <div className={`relative flex items-center justify-center rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl mt-2 ${isYoutube ? 'w-[300px] aspect-video' : 'w-[220px] aspect-square'}`}>
    <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/10 animate-pulse" />
    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)] -translate-x-full animate-[shimmer_1.5s_infinite]" />
    <div className="flex flex-col items-center gap-3 relative z-10">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
      <span className="text-zinc-400 text-[10px] font-semibold tracking-widest uppercase">Creating Graphic...</span>
    </div>
  </div>
);

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
    <div ref={dropdownRef} className="relative z-50">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 bg-zinc-900/80 border transition-all rounded-xl ${
          open ? 'border-violet-500/50 shadow-lg shadow-violet-500/10' : 'border-white/10 hover:border-white/20'
        } ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'}`}
      >
        {selected ? (
          <>
            <img src={selected.logo} alt={selected.label} className={`object-contain rounded ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`text-zinc-200 font-semibold whitespace-nowrap ${compact ? 'text-[10px]' : 'text-xs'}`}>{selected.label}</span>
          </>
        ) : (
          <>
            <Tv2 className={`text-zinc-500 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            <span className={`text-zinc-500 whitespace-nowrap ${compact ? 'text-[10px]' : 'text-xs'}`}>Select Channel</span>
          </>
        )}
        <ChevronDown className={`text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 min-w-[160px] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { onChange(ch.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-zinc-800/80 transition-all text-left ${value === ch.id ? 'bg-zinc-800/60' : ''}`}
            >
              <img src={ch.logo} alt={ch.label} className="w-5 h-5 object-contain rounded flex-shrink-0" />
              <span className="text-zinc-200 text-xs font-medium flex-1">{ch.label}</span>
              {value === ch.id ? <Check className="w-3 h-3 text-violet-400 flex-shrink-0" /> : <div className="w-3 h-3 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Type Selector Screen ─────────────────────────────────────────
const TypeSelector: React.FC<{
  onSelect: (type: ThumbnailType) => void;
  script: ScriptState;
  selectedChannel: ChannelId | null;
  onChannelChange: (id: ChannelId) => void;
}> = ({ onSelect, script, selectedChannel, onChannelChange }) => (
  <div className="flex flex-col items-center justify-center h-full gap-7 py-6 px-2">
    <div className="text-center space-y-1.5">
      <h3 className="text-white font-bold text-lg">Choose Thumbnail Format</h3>
      <p className="text-zinc-600 text-xs">Pick format and channel before generating</p>
    </div>

    <div className="w-full max-w-sm relative z-50">
      <p className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wide mb-2 px-1">Channel / Brand</p>
      <div className="flex justify-start">
        <ChannelDropdown value={selectedChannel} onChange={onChannelChange} />
      </div>
      {!selectedChannel && <p className="text-amber-500/70 text-[10px] mt-1.5 px-1">⚠ Select a channel to embed its logo on the thumbnail</p>}
      {selectedChannel && <p className="text-emerald-500/70 text-[10px] mt-1.5 px-1">✓ Logo will be placed in the top-right corner</p>}
    </div>

    <div className="grid grid-cols-2 gap-4 w-full max-w-sm relative z-40">
      <button onClick={() => onSelect('youtube')} className="group flex flex-col items-center gap-3 p-5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/8 hover:border-red-500/40 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10">
        <div className="w-full aspect-video bg-gradient-to-br from-red-600/20 to-red-900/30 border border-red-500/20 group-hover:border-red-500/40 rounded-xl flex items-center justify-center transition-all">
          <Youtube className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm">YouTube</p>
          <p className="text-zinc-500 text-[10px] mt-0.5">1536 × 1024 · 16:9</p>
        </div>
      </button>

      <button onClick={() => onSelect('reels')} className="group flex flex-col items-center gap-3 p-5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/8 hover:border-violet-500/40 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/10">
        <div className="w-full aspect-square bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20 group-hover:border-violet-500/40 rounded-xl flex items-center justify-center transition-all">
          <Play className="w-8 h-8 text-violet-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm">Reels / Shorts</p>
          <p className="text-zinc-500 text-[10px] mt-0.5">1024 × 1024 · 1:1</p>
        </div>
      </button>
    </div>

    <div className="w-full max-w-sm px-4 py-3 bg-zinc-900/60 border border-white/6 rounded-xl relative z-30">
      <p className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wide mb-1">Script Context</p>
      <p className="text-zinc-300 text-xs line-clamp-2 leading-relaxed" style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}>
        {script.heading}
      </p>
    </div>
  </div>
);

// ── Thumbnail Card ───────────────────────────────────────────────
const ThumbnailCard: React.FC<{
  imageUrl: string;
  thumbnailType: ThumbnailType;
  onDownload: (url: string) => void;
  isNew?: boolean;
}> = ({ imageUrl, thumbnailType, onDownload, isNew }) => {
  const [loaded, setLoaded] = useState(false);
  const isYoutube = thumbnailType === 'youtube';

  return (
    <div className={`relative mt-3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 group transition-all duration-700 ${isNew ? 'animate-[fadeSlideUp_0.5s_ease_forwards]' : ''}`} style={{ width: isYoutube ? '300px' : '220px' }}>
      {!loaded && <div className="w-full bg-zinc-800 animate-pulse rounded-2xl" style={{ aspectRatio: isYoutube ? '16/9' : '1/1' }} />}
      
      <img src={imageUrl} alt="Generated thumbnail" className={`w-full object-cover block transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`} style={{ aspectRatio: isYoutube ? '16/9' : '1/1' }} onLoad={() => setLoaded(true)} />

      {loaded && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4 gap-2">
          <button onClick={() => onDownload(imageUrl)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-100 transition-all shadow-xl transform hover:scale-105 active:scale-95">
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <p className="text-white/50 text-[10px]">{isYoutube ? '1536 × 1024 · YouTube' : '1024 × 1024 · Reels'}</p>
        </div>
      )}

      {isNew && loaded && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 bg-violet-600 rounded-lg text-white text-[10px] font-bold tracking-wide shadow-lg">
          <Sparkles className="w-2.5 h-2.5" />
          NEW
        </div>
      )}

      {loaded && (
        <div className={`absolute top-2.5 right-2.5 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide ${isYoutube ? 'bg-red-600/90 text-white' : 'bg-violet-600/90 text-white'}`}>
          {isYoutube ? 'YT' : '1:1'}
        </div>
      )}
    </div>
  );
};

// ── Chat Bubble ──────────────────────────────────────────────────
const ChatBubble: React.FC<{
  message: ChatMessage;
  onDownload: (url: string) => void;
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
          <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
        </div>

        {message.imageUrl && message.thumbnailType && (
          <ThumbnailCard imageUrl={message.imageUrl} thumbnailType={message.thumbnailType} onDownload={onDownload} isNew={message.isNew} />
        )}
      </div>
    </div>
  );
};

// ── Script Badge ─────────────────────────────────────────────────
const ScriptBadge: React.FC<{
  script: ScriptState;
  thumbnailType: ThumbnailType | null;
  selectedChannel: ChannelId | null;
  onChangeType: () => void;
  onChannelChange: (id: ChannelId) => void;
}> = ({ script, thumbnailType, selectedChannel, onChangeType, onChannelChange }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-white/8 rounded-2xl backdrop-blur-md relative z-40">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
      <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-zinc-200 text-xs font-semibold leading-snug line-clamp-1" style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}>
        {script.heading}
      </p>
      <p className="text-zinc-600 text-[10px] mt-0.5 font-medium tracking-wide uppercase">
        {script.scriptType === 'short' ? 'Short · Anchor only' : 'Long · Anchor + Voice Over'}
      </p>
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      <ChannelDropdown value={selectedChannel} onChange={onChannelChange} compact />

      {thumbnailType && (
        <button onClick={onChangeType} title="Change format" className={`text-[10px] px-2 py-1 rounded-lg font-bold tracking-wide uppercase border transition-all ${thumbnailType === 'youtube' ? 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/25' : 'bg-violet-500/15 text-violet-400 border-violet-500/20 hover:bg-violet-500/25'}`}>
          {thumbnailType === 'youtube' ? '▶ YT 16:9' : '□ 1:1'}
        </button>
      )}

      <span className={`text-[10px] px-2 py-1 rounded-lg font-bold tracking-wide uppercase ${script.scriptType === 'short' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-violet-500/15 text-violet-400 border border-violet-500/20'}`}>
        {script.scriptType}
      </span>
    </div>
  </div>
);


// ── Main Page Component ──────────────────────────────────────────
const ThumbnailGenerationPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const script = location.state?.script as ScriptState | undefined;

  const [messages,        setMessages]        = useState<ChatMessage[]>([]);
  const [inputText,       setInputText]       = useState('');
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [hasGenerated,    setHasGenerated]    = useState(false);
  const [latestThumbnail, setLatestThumbnail] = useState<ThumbnailResult | null>(null);
  const [thumbnailType,   setThumbnailType]   = useState<ThumbnailType | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelId | null>(null);
  
  // Reference Image Upload States
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!script) navigate('/scripts');
  }, [script, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `thumbnail-${thumbnailType}-${selectedChannel ?? 'nologos'}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Swal.fire({
        icon: 'success', title: 'Downloaded!', text: 'Thumbnail saved.',
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

  const handleTypeSelect = (type: ThumbnailType) => {
    setThumbnailType(type);
  };

  const handleChangeType = () => {
    setThumbnailType(null);
    setMessages([]);
    setHasGenerated(false);
    setLatestThumbnail(null);
    clearReferenceImage();
  };

  const buildFormData = (textInstruction?: string, isRefine = false) => {
    const formData = new FormData();
    formData.append('anchor', script!.anchor);
    formData.append('scriptType', script!.scriptType || 'short');
    formData.append('thumbnailType', thumbnailType!);
    formData.append('channelName', selectedChannel ? selectedChannel : 'null');
    formData.append('title', script!.heading); 

    if (referenceImage) {
      formData.append('referenceImage', referenceImage);
    }

    if (isRefine && latestThumbnail) {
      formData.append('userInstruction', textInstruction || '');
      formData.append('previousPrompt', latestThumbnail.prompt);
      formData.append('previousImageKey', latestThumbnail.imageKey);
    }
    return formData;
  };

  const handleGenerate = async () => {
    if (!script || isGenerating || !thumbnailType) return;

    // Build the request data BEFORE clearing the UI
    const requestData = buildFormData();

    setIsGenerating(true);
    clearReferenceImage(); // ✅ Clear image instantly from UI

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: hasGenerated ? `🔄 Generating new thumbnail design...` : `🚀 Generate an eye-catching thumbnail!`,
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
      setLatestThumbnail(data);
      setHasGenerated(true);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, loading: false, content: `✨ Thumbnail is ready!\n\nHover on image for downloading.`, imageUrl: data.imageUrl, thumbnailType, isNew: true }
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
    if ((!messageText && !referenceImagePreview) || isGenerating || !latestThumbnail || !script || !thumbnailType) return;

    // Build the request data BEFORE clearing the UI
    const requestData = buildFormData(messageText, true);

    setInputText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsGenerating(true);
    clearReferenceImage(); // ✅ Clear image instantly from UI

    const userMsg: ChatMessage   = { id: `user-${Date.now()}`, role: 'user', content: messageText || "Updated with new reference image." };
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
      setLatestThumbnail(data);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, loading: false, content: `✅ Updated!\n\nWhat else would you like to change?`, imageUrl: data.imageUrl, thumbnailType, isNew: true }
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
      hasGenerated ? handleSendMessage() : handleGenerate();
    }
  };

  if (!script) return null;

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
              <h1 className="text-white font-bold text-sm leading-none">AI Thumbnail Studio</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-semibold tracking-wide">ONLINE</span>
          </div>

          {latestThumbnail && (
            <button onClick={() => handleDownload(latestThumbnail.imageUrl)} className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>

        {/* Script + channel badge */}
        <div className="relative z-10 flex-shrink-0 px-4 sm:px-5 pt-3 pb-2">
          <ScriptBadge
            script={script}
            thumbnailType={thumbnailType}
            selectedChannel={selectedChannel}
            onChangeType={handleChangeType}
            onChannelChange={setSelectedChannel}
          />
        </div>

        {/* Main area (Chat / Selection) */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-5 py-3 pb-[180px] scrollbar-hide">
          {!thumbnailType ? (
            <TypeSelector
              onSelect={handleTypeSelect}
              script={script}
              selectedChannel={selectedChannel}
              onChannelChange={setSelectedChannel}
            />
          ) : !hasGenerated && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-20">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-500/20 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 border border-violet-500/30 flex items-center justify-center">
                    {selectedChannel ? (
                      <img src={CHANNELS.find((c) => c.id === selectedChannel)?.logo} alt="channel logo" className="w-10 h-10 object-contain" />
                    ) : (
                      <Wand2 className="w-9 h-9 text-violet-400" />
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-3xl border border-violet-500/20 animate-ping opacity-30" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-white font-bold text-lg">Ready to generate</h3>
                <p className="text-zinc-500 text-sm">
                  {thumbnailType === 'youtube' ? '▶ YouTube 16:9 (1536×1024)' : '□ Reels 1:1 (1024×1024)'} · {' '}
                  {selectedChannel ? <span className="text-emerald-400">{CHANNELS.find((c) => c.id === selectedChannel)?.label} logo included</span> : <span className="text-zinc-600">No channel logo</span>}
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                message.loading ? (
                  <div key={message.id} className="flex justify-start mb-5" style={{ animation: 'fadeSlideUp 0.35s ease forwards' }}>
                    <div className="flex flex-col gap-2 items-start">
                      <div className="px-4 py-3 bg-zinc-800/90 border border-white/8 text-zinc-200 rounded-2xl rounded-bl-sm">
                        Preparing your graphic...
                      </div>
                      <ChatGptLoader isYoutube={thumbnailType === 'youtube'} />
                    </div>
                  </div>
                ) : (
                  <ChatBubble key={message.id} message={message} onDownload={handleDownload} />
                )
              ))}
              <div ref={chatEndRef} className="h-4" />
            </>
          )}
        </div>

        {/* ── Modern Centered Input Area ──────────────────────────────── */}
        {thumbnailType && (
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
              
              {/* ✅ FIX 1: Image Preview moved INSIDE the regular flow so it stretches the box naturally */}
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
                  onClick={() => hasGenerated ? handleSendMessage() : handleGenerate()}
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

export default ThumbnailGenerationPage;