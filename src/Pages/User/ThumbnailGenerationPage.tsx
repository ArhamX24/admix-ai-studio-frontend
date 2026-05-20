import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Send, Download, Loader2, Sparkles, RefreshCw,
  ArrowLeft, Wand2, Bot, User, ImageIcon, Zap,
  Youtube, Play, ChevronDown, Check, Tv2,
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '@/Utils/URL';
import BBmix   from "../../Logos/BB MIX LOGO.png";
import BBstory from "../../Logos/BB STORY LOGO.png";
import PDNnews from "../../Logos/PDN NEWS LOGO.png";
import Storyfm from "../../Logos/STORY FM LOGO.png";
import Ycity   from "../../Logos/YCITY LOGO.png";

const API_BASE = `${baseURL}/api/v1/thumbnail`;

// ── Channel config ───────────────────────────────────────────────
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

// ── Suggestion chips ─────────────────────────────────────────────
const suggestions = [
  '🔥 More dramatic',
  '📰 Breaking news style',
  '⚡ High energy composition',
  '🎬 Cinematic lighting',
];

// ── Typing dots ──────────────────────────────────────────────────
const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-0.5 px-1">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 animate-bounce"
        style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
      />
    ))}
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

  // Close on outside click
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
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 bg-zinc-900/80 border transition-all rounded-xl ${
          open
            ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
            : 'border-white/10 hover:border-white/20'
        } ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5'}`}
      >
        {selected ? (
          <>
            <img
              src={selected.logo}
              alt={selected.label}
              className={`object-contain rounded ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
            />
            <span className={`text-zinc-200 font-semibold whitespace-nowrap ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {selected.label}
            </span>
          </>
        ) : (
          <>
            <Tv2 className={`text-zinc-500 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            <span className={`text-zinc-500 whitespace-nowrap ${compact ? 'text-[10px]' : 'text-xs'}`}>
              Select Channel
            </span>
          </>
        )}
        <ChevronDown
          className={`text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${
            compact ? 'w-3 h-3' : 'w-3.5 h-3.5'
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 min-w-[160px] bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/60 z-50"
          style={{ animation: 'fadeSlideUp 0.15s ease forwards' }}
        >
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { onChange(ch.id); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-zinc-800/80 transition-all text-left group ${
                value === ch.id ? 'bg-zinc-800/60' : ''
              }`}
            >
              <img
                src={ch.logo}
                alt={ch.label}
                className="w-5 h-5 object-contain rounded flex-shrink-0"
              />
              <span className="text-zinc-200 text-xs font-medium flex-1">{ch.label}</span>
              {value === ch.id ? (
                <Check className="w-3 h-3 text-violet-400 flex-shrink-0" />
              ) : (
                <div className="w-3 h-3 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Type selector screen ─────────────────────────────────────────
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

    {/* Channel selector */}
    <div className="w-full max-w-sm">
      <p className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wide mb-2 px-1">
        Channel / Brand
      </p>
      <div className="flex justify-start">
        <ChannelDropdown value={selectedChannel} onChange={onChannelChange} />
      </div>
      {!selectedChannel && (
        <p className="text-amber-500/70 text-[10px] mt-1.5 px-1">
          ⚠ Select a channel to embed its logo on the thumbnail
        </p>
      )}
      {selectedChannel && (
        <p className="text-emerald-500/70 text-[10px] mt-1.5 px-1">
          ✓ Logo will be placed in the top-right corner
        </p>
      )}
    </div>

    {/* Format buttons */}
    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
      {/* YouTube */}
      <button
        onClick={() => onSelect('youtube')}
        className="group flex flex-col items-center gap-3 p-5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/8 hover:border-red-500/40 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10"
      >
        <div className="w-full aspect-video bg-gradient-to-br from-red-600/20 to-red-900/30 border border-red-500/20 group-hover:border-red-500/40 rounded-xl flex items-center justify-center transition-all">
          <Youtube className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm">YouTube</p>
          <p className="text-zinc-500 text-[10px] mt-0.5">1536 × 1024 · 16:9</p>
        </div>
      </button>

      {/* Reels/Shorts */}
      <button
        onClick={() => onSelect('reels')}
        className="group flex flex-col items-center gap-3 p-5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/8 hover:border-violet-500/40 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/10"
      >
        <div className="w-full aspect-square bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/20 group-hover:border-violet-500/40 rounded-xl flex items-center justify-center transition-all">
          <Play className="w-8 h-8 text-violet-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-sm">Reels / Shorts</p>
          <p className="text-zinc-500 text-[10px] mt-0.5">1024 × 1024 · 1:1</p>
        </div>
      </button>
    </div>

    {/* Script preview */}
    <div className="w-full max-w-sm px-4 py-3 bg-zinc-900/60 border border-white/6 rounded-xl">
      <p className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wide mb-1">Script</p>
      <p
        className="text-zinc-300 text-xs line-clamp-2 leading-relaxed"
        style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}
      >
        {script.heading}
      </p>
    </div>
  </div>
);

// ── Thumbnail card ───────────────────────────────────────────────
const ThumbnailCard: React.FC<{
  imageUrl: string;
  thumbnailType: ThumbnailType;
  onDownload: (url: string) => void;
  isNew?: boolean;
}> = ({ imageUrl, thumbnailType, onDownload, isNew }) => {
  const [loaded, setLoaded] = useState(false);
  const isYoutube = thumbnailType === 'youtube';

  return (
    <div
      className={`relative mt-3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 group transition-all duration-700 ${
        isNew ? 'animate-[fadeSlideUp_0.5s_ease_forwards]' : ''
      }`}
      style={{ width: isYoutube ? '300px' : '220px' }}
    >
      {!loaded && (
        <div
          className="w-full bg-zinc-800 animate-pulse rounded-2xl"
          style={{ aspectRatio: isYoutube ? '16/9' : '1/1' }}
        />
      )}

      <img
        src={imageUrl}
        alt="Generated thumbnail"
        className={`w-full object-cover block transition-all duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
        style={{ aspectRatio: isYoutube ? '16/9' : '1/1' }}
        onLoad={() => setLoaded(true)}
      />

      {loaded && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4 gap-2">
          <button
            onClick={() => onDownload(imageUrl)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-100 transition-all shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <p className="text-white/50 text-[10px]">
            {isYoutube ? '1536 × 1024 · YouTube' : '1024 × 1024 · Reels'}
          </p>
        </div>
      )}

      {isNew && loaded && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 bg-violet-600 rounded-lg text-white text-[10px] font-bold tracking-wide shadow-lg">
          <Sparkles className="w-2.5 h-2.5" />
          NEW
        </div>
      )}

      {loaded && (
        <div className={`absolute top-2.5 right-2.5 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wide ${
          isYoutube
            ? 'bg-red-600/90 text-white'
            : 'bg-violet-600/90 text-white'
        }`}>
          {isYoutube ? 'YT' : '1:1'}
        </div>
      )}
    </div>
  );
};

// ── Chat bubble ──────────────────────────────────────────────────
const ChatBubble: React.FC<{
  message: ChatMessage;
  onDownload: (url: string) => void;
}> = ({ message, onDownload }) => {
  const isUser   = message.role === 'user';
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
    <div
      className={`flex items-end gap-3 mb-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ animation: 'fadeSlideUp 0.35s ease forwards' }}
    >
      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${
        isUser
          ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600'
          : 'bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot className="w-3.5 h-3.5 text-zinc-300" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white rounded-br-sm shadow-lg shadow-violet-500/20'
            : 'bg-zinc-800/90 border border-white/8 text-zinc-200 rounded-bl-sm backdrop-blur-sm'
        }`}>
          {message.loading ? <TypingDots /> : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          )}
        </div>

        {message.imageUrl && message.thumbnailType && (
          <ThumbnailCard
            imageUrl={message.imageUrl}
            thumbnailType={message.thumbnailType}
            onDownload={onDownload}
            isNew={message.isNew}
          />
        )}
      </div>
    </div>
  );
};

// ── Script + channel badge ───────────────────────────────────────
const ScriptBadge: React.FC<{
  script: ScriptState;
  thumbnailType: ThumbnailType | null;
  selectedChannel: ChannelId | null;
  onChangeType: () => void;
  onChannelChange: (id: ChannelId) => void;
}> = ({ script, thumbnailType, selectedChannel, onChangeType, onChannelChange }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-white/8 rounded-2xl backdrop-blur-md">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
      <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
    </div>

    <div className="min-w-0 flex-1">
      <p
        className="text-zinc-200 text-xs font-semibold leading-snug line-clamp-1"
        style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}
      >
        {script.heading}
      </p>
      <p className="text-zinc-600 text-[10px] mt-0.5 font-medium tracking-wide uppercase">
        {script.scriptType === 'short' ? 'Short · Anchor only' : 'Long · Anchor + Voice Over'}
      </p>
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Channel dropdown (compact) */}
      <ChannelDropdown value={selectedChannel} onChange={onChannelChange} compact />

      {thumbnailType && (
        <button
          onClick={onChangeType}
          title="Change format"
          className={`text-[10px] px-2 py-1 rounded-lg font-bold tracking-wide uppercase border transition-all ${
            thumbnailType === 'youtube'
              ? 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/25'
              : 'bg-violet-500/15 text-violet-400 border-violet-500/20 hover:bg-violet-500/25'
          }`}
        >
          {thumbnailType === 'youtube' ? '▶ YT 16:9' : '□ 1:1'}
        </button>
      )}

      <span className={`text-[10px] px-2 py-1 rounded-lg font-bold tracking-wide uppercase ${
        script.scriptType === 'short'
          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
          : 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
      }`}>
        {script.scriptType}
      </span>
    </div>
  </div>
);

// ── Main page ────────────────────────────────────────────────────
const ThumbnailGenerationPage = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  const script = location.state?.script as ScriptState | undefined;

  const [messages,        setMessages]        = useState<ChatMessage[]>([]);
  const [inputText,       setInputText]       = useState('');
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [hasGenerated,    setHasGenerated]    = useState(false);
  const [latestThumbnail, setLatestThumbnail] = useState<ThumbnailResult | null>(null);
  const [thumbnailType,   setThumbnailType]   = useState<ThumbnailType | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelId | null>(null);

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

  // Called when user picks a format from TypeSelector
  const handleTypeSelect = (type: ThumbnailType) => {
    setThumbnailType(type);
  };

  // Called from badge to reset everything and start over
  const handleChangeType = () => {
    setThumbnailType(null);
    setMessages([]);
    setHasGenerated(false);
    setLatestThumbnail(null);
  };

  const handleGenerate = async (type?: ThumbnailType) => {
    const activeType = type ?? thumbnailType;
    if (!script || isGenerating || !activeType) return;

    setIsGenerating(true);

    const channelLabel = selectedChannel
      ? CHANNELS.find((c) => c.id === selectedChannel)?.label
      : null;

    const userMsg: ChatMessage = {
      id:      `user-${Date.now()}`,
      role:    'user',
      content: hasGenerated
        ? `🔄 Naya thumbnail generate karo${channelLabel ? ` (${channelLabel})` : ''}`
        : `🚀 Thumbnail generate karo!${channelLabel ? ` · Channel: ${channelLabel}` : ''}`,
    };

    const loadingId  = `loading-${Date.now()}`;
    const loadingMsg: ChatMessage = { id: loadingId, role: 'assistant', content: '', loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const res = await axios.post(
        `${API_BASE}/generate`,
        {
          anchor:       script.anchor,
          scriptType:   script.scriptType,
          thumbnailType: activeType,
          channelName:  selectedChannel,   // ← new field
        },
        { withCredentials: true }
      );

      const data: ThumbnailResult = res.data.data;
      setLatestThumbnail(data);
      setHasGenerated(true);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                loading: false,
                content: `✨ Thumbnail is ready! (${activeType === 'youtube' ? 'YouTube 16:9' : 'Reels 1:1'})${
                  channelLabel ? `\n📺 Channel: ${channelLabel}` : ''
                }\nHover on image for downloading.`,
                imageUrl:      data.imageUrl,
                thumbnailType: activeType,
                isNew:         true,
              }
            : m
        )
      );
    } catch (err: any) {
      console.error(err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, loading: false, content: '❌ Generation is failed, please try again.' }
            : m
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
    if (!messageText || isGenerating || !latestThumbnail || !script || !thumbnailType) return;

    setInputText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsGenerating(true);

    const userMsg: ChatMessage   = { id: `user-${Date.now()}`, role: 'user', content: messageText };
    const loadingId              = `loading-${Date.now()}`;
    const loadingMsg: ChatMessage = { id: loadingId, role: 'assistant', content: '', loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const res = await axios.post(
        `${API_BASE}/refine`,
        {
          anchor:           script.anchor,
          scriptType:       script.scriptType,
          thumbnailType,
          userInstruction:  messageText,
          previousPrompt:   latestThumbnail.prompt,
          previousImageKey: latestThumbnail.imageKey,
          channelName:      selectedChannel,   // ← new field
        },
        { withCredentials: true }
      );

      const data: ThumbnailResult = res.data.data;
      setLatestThumbnail(data);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                loading:       false,
                content:       `✅ ${data.changes || 'Thumbnail update ho gayi!'}\n\nAur changes chahiye?`,
                imageUrl:      data.imageUrl,
                thumbnailType,
                isNew:         true,
              }
            : m
        )
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, loading: false, content: '❌ Error in editing, please try again.' }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden">

        {/* Ambient bg */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-600/6 rounded-full blur-3xl" />
        </div>

        {/* Top bar */}
        <div className="relative flex-shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/6 bg-black/40 backdrop-blur-xl">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/8 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-700 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <Wand2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm leading-none">Thumbnail Generator</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-semibold tracking-wide">ONLINE</span>
          </div>

          {latestThumbnail && (
            <button
              onClick={() => handleDownload(latestThumbnail.imageUrl)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>

        {/* Script + channel badge */}
        <div className="relative flex-shrink-0 px-4 sm:px-5 pt-3 pb-2">
          <ScriptBadge
            script={script}
            thumbnailType={thumbnailType}
            selectedChannel={selectedChannel}
            onChangeType={handleChangeType}
            onChannelChange={setSelectedChannel}
          />
        </div>

        {/* Main area */}
        <div className="relative flex-1 overflow-y-auto px-4 sm:px-5 py-3 scrollbar-hide">

          {/* Step 1: pick format + channel */}
          {!thumbnailType ? (
            <TypeSelector
              onSelect={handleTypeSelect}
              script={script}
              selectedChannel={selectedChannel}
              onChannelChange={setSelectedChannel}
            />

          ) : !hasGenerated && messages.length === 0 ? (
            /* Step 2: ready to generate */
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-500/20 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 border border-violet-500/30 flex items-center justify-center">
                    {selectedChannel ? (
                      <img
                        src={CHANNELS.find((c) => c.id === selectedChannel)?.logo}
                        alt="channel logo"
                        className="w-10 h-10 object-contain"
                      />
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
                  {selectedChannel
                    ? <span className="text-emerald-400">{CHANNELS.find((c) => c.id === selectedChannel)?.label} logo included</span>
                    : <span className="text-zinc-600">No channel logo</span>
                  }
                </p>
              </div>

              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="relative group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-bold text-sm rounded-2xl transition-all shadow-2xl shadow-violet-500/30 disabled:shadow-none disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  : <><Sparkles className="w-4 h-4" /> Generate Thumbnail</>}
              </button>
            </div>

          ) : (
            <>
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} onDownload={handleDownload} />
              ))}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input area — only shown after format is selected */}
        {thumbnailType && (
          <div className="relative flex-shrink-0 border-t border-white/6 bg-black/40 backdrop-blur-xl px-4 sm:px-5 pt-3 pb-4 space-y-3">
            {hasGenerated && !isGenerating && (
              <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSendMessage(s.replace(/^[^\s]+\s/, ''))}
                    className="flex-shrink-0 px-3 py-1.5 text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-white/8 hover:border-white/15 text-zinc-400 hover:text-zinc-200 rounded-full transition-all whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {hasGenerated ? (
              <div className="flex items-end gap-2">
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  title="Generate new thumbnail"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/8 text-zinc-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Kya change chahiye? (e.g. darker background, more red)"
                    disabled={isGenerating}
                    rows={1}
                    className="w-full bg-zinc-900/80 border border-white/10 hover:border-white/15 focus:border-violet-500/60 text-zinc-100 placeholder-zinc-600 text-sm rounded-xl px-4 py-3 resize-none outline-none transition-all leading-relaxed disabled:opacity-40"
                    style={{ maxHeight: '100px', overflowY: 'auto' }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
                    }}
                  />
                </div>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isGenerating || !inputText.trim()}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-700 hover:from-violet-500 hover:to-fuchsia-600 disabled:from-zinc-800 disabled:to-zinc-800 disabled:cursor-not-allowed text-white transition-all flex-shrink-0 shadow-lg shadow-violet-500/20 disabled:shadow-none"
                >
                  {isGenerating
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              messages.length > 0 && (
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-700 hover:from-violet-500 hover:to-fuchsia-600 disabled:from-zinc-800 disabled:to-zinc-800 text-white font-bold text-sm rounded-xl transition-all shadow-xl shadow-violet-500/25 disabled:cursor-not-allowed"
                >
                  {isGenerating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    : <><Sparkles className="w-4 h-4" /> Generate Thumbnail</>}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ThumbnailGenerationPage;