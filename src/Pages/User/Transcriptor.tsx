import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Copy, PlayCircle, Search, CheckCheck, Loader2, Globe2, ChevronLeft } from 'lucide-react';
import { baseURL } from '@/Utils/URL';
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/hooks'
import { setTranscript } from '@/lib/Slice/transcriptSlice'
import { Sparkles } from 'lucide-react'

interface TranscriptSegment {
  id: string | number;
  startTime: string;
  text: string;
}

interface TranscriptData {
  title: string;
  thumbnailUrl: string;
}

// 1. Helper to extract YouTube video ID
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// 2. INTELLIGENT GROUPER: Merges tiny phrase-level segments into readable paragraphs
const groupSegments = (segments: TranscriptSegment[]) => {
  if (!segments || segments.length === 0) return [];
  
  const timeToSeconds = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const grouped: TranscriptSegment[] = [];
  let currentGroup = { ...segments[0], text: segments[0].text.trim() };

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const currentSec = timeToSeconds(currentGroup.startTime);
    const nextSec = timeToSeconds(seg.startTime);
    
    // Group segments if they are within 15 seconds of each other AND the paragraph isn't too long
    // OR if they share the exact same timestamp (fixes the [01:24] issue)
    if ((nextSec - currentSec < 15 && currentGroup.text.length < 350) || currentGroup.startTime === seg.startTime) {
      currentGroup.text += ' ' + seg.text.trim();
    } else {
      grouped.push(currentGroup);
      currentGroup = { ...seg, text: seg.text.trim() };
    }
  }
  grouped.push(currentGroup);
  
  // Clean up any weird double spaces caused by merging
  return grouped.map((g, index) => ({ 
    ...g, 
    id: index, // Re-index them cleanly
    text: g.text.replace(/\s+/g, ' ').trim() 
  }));
};

const Transcriptor = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [fullSegments, setFullSegments] = useState<TranscriptSegment[]>([]);
  const [displayedSegments, setDisplayedSegments] = useState<TranscriptSegment[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPollingRef = useRef<boolean>(false);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // 1-by-1 STREAMING EFFECT (Adjusted for larger paragraphs)
  useEffect(() => {
    if (fullSegments.length > displayedSegments.length) {
      // Since segments are now large paragraphs, we stream them 1 at a time
      const timer = setTimeout(() => {
        setDisplayedSegments(prev => [
          ...prev, 
          fullSegments[prev.length]
        ]);
      }, 150); // Speed of paragraph generation
      
      return () => clearTimeout(timer);
    }
  }, [fullSegments, displayedSegments]);

  // Auto-scroll
  useEffect(() => {
    if (isLoading && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedSegments, isLoading]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;

    setIsLoading(true);
    isPollingRef.current = true;
    setLoadingMessage('Initializing video analysis...');
    setTranscriptData(null);
    setFullSegments([]);
    setDisplayedSegments([]);

    try {
      const initResponse = await fetch(`${baseURL}/api/v1/transcript/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });
      
      const initResult = await initResponse.json();
      
      if (!initResult.success || !initResult.jobId) {
        throw new Error(initResult.error || 'Failed to start job');
      }

      setTranscriptData({
        title: initResult.title || "Processing Video...",
        thumbnailUrl: ""
      });

      const jobId = initResult.jobId;
      let isCompleted = false;

      while (!isCompleted && isPollingRef.current) {
        setLoadingMessage('AI is transcribing audio...');
        await delay(3000); 

        if (!isPollingRef.current) break;

        const statusResponse = await fetch(`${baseURL}/api/v1/transcript/status/${jobId}`);
        const statusResult = await statusResponse.json();

        if (!statusResult.success) throw new Error('Error checking status');

        if (['SUCCEEDED', 'COMPLETED', 'DONE', 'SUCCESS'].includes(statusResult.status)) {
          isCompleted = true;
          
          if (statusResult.data) {
             setTranscriptData({
                title: statusResult.data.title,
                thumbnailUrl: statusResult.data.thumbnailUrl
             });
             // APPLIED THE GROUPER HERE:
             const grouped = groupSegments(statusResult.data.segments || []);
             setFullSegments(grouped);
          }
        } else if (['FAILED', 'ERROR', 'CANCELED'].includes(statusResult.status)) {
          throw new Error('Processing failed for this video link.');
        }
      }
    } catch (error: any) {
      if (isPollingRef.current) {
         console.error("Transcription error:", error);
         alert(error.message || "An unexpected error occurred during processing.");
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCopySegment = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

 const handleCopyAll = () => {
  const fullText = fullSegments.map(seg => seg.text).join('\n\n');
  navigator.clipboard.writeText(fullText);
  setIsCopiedAll(true);
  setTimeout(() => setIsCopiedAll(false), 2000);
};

 const resetState = () => {
  isPollingRef.current = false; 
  setTranscriptData(null); 
  setVideoUrl('');
  setSearchQuery('');
  setFullSegments([]);
  setDisplayedSegments([]);
};

const handleCreateScript = () => {
  const fullText = fullSegments.map(seg => seg.text).join(' ');
  dispatch(setTranscript(fullText));
  navigate('/script-writer');
};

  const filteredSegments = displayedSegments.filter(seg => 
    seg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ytId = getYouTubeId(videoUrl);

  // VIEW 1: LANDING SCREEN
  if (!transcriptData) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Video Transcriptor
          </h1>
          <form onSubmit={handleGenerate} className="w-full mt-8">
            <div className={`relative flex items-center bg-[#111] rounded-2xl p-2 border transition-all duration-300 shadow-2xl ${isLoading ? 'border-purple-500/50 shadow-purple-500/10' : 'border-zinc-800 focus-within:border-purple-500'}`}>
              <div className="pl-4 text-zinc-500"><Globe2 size={20} /></div>
              <input 
                type="url"
                required
                disabled={isLoading}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste a video link here..." 
                className="bg-transparent flex-1 p-4 outline-none text-white placeholder-zinc-600 text-[15px] disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl p-4 flex items-center justify-center transition-all disabled:opacity-80"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // VIEW 2: DASHBOARD SCREEN
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">
      
      {/* Left Column */}
      <div className="w-full lg:w-[35%] flex flex-col gap-4">
        <div className="flex justify-start items-center px-1">
           <button onClick={resetState} className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] px-4 py-2 rounded-lg text-sm transition-colors border border-zinc-800/80">
              <ChevronLeft size={16} /> Back
           </button>
        </div>

        <div className="bg-[#0a0a0a] border border-zinc-800/80 rounded-[1.5rem] overflow-hidden shadow-xl">
          
          {/* DYNAMIC PLAYER CONTAINER */}
          <div className="aspect-video bg-black flex items-center justify-center relative group w-full">
            {ytId ? (
                <iframe 
                    src={`https://www.youtube.com/embed/${ytId}`} 
                    title="YouTube video player" 
                    className="w-full h-full absolute top-0 left-0"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            ) : (
                <>
                    {transcriptData.thumbnailUrl && (
                        <img src={transcriptData.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover opacity-80" />
                    )}
                    <PlayCircle className="w-16 h-16 text-purple-600 absolute z-10 drop-shadow-lg opacity-90" />
                </>
            )}
          </div>
          
          <div className="p-6">
            <h2 className="font-semibold text-[16px] line-clamp-2 leading-snug text-zinc-200">
              {transcriptData.title}
            </h2>
            <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-[#141414] rounded-full border border-zinc-800 text-xs text-zinc-400">
              <Globe2 size={14} className="shrink-0" />
              <span className="truncate">{videoUrl}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-[65%] bg-[#0a0a0a] border border-zinc-800/80 rounded-[1.5rem] flex flex-col h-[85vh] shadow-xl p-5 md:p-8 relative">
        
        {/* Toggle Buttons */}
        <div className="flex bg-[#141414] p-1.5 rounded-xl w-fit mb-6 border border-zinc-800/50">
          <button className="bg-purple-600/20 text-purple-400 px-8 py-2 rounded-lg text-[14px] font-medium border border-purple-500/30 transition-all">
            Transcript
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div className="flex items-center gap-4 md:gap-6">
        <h3 className="text-[17px] font-bold flex items-center gap-3 text-zinc-100">
            Transcript
            {isLoading ? (
              <span className="text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-semibold animate-pulse border border-purple-800/50">Transcribing</span>
            ) : (
              <span className="text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-semibold border border-purple-800/50">Ready</span>
            )}
        </h3>
    </div>
    
    <div className="flex items-center gap-3 w-full sm:w-auto">
        <button onClick={handleCopyAll} className="flex items-center justify-center gap-2 text-zinc-400 hover:text-white text-[13px] font-medium transition-colors bg-[#111] px-4 py-2 rounded-lg border border-zinc-800">
          {isCopiedAll ? <CheckCheck size={15} className="text-purple-400"/> : <Copy size={15} />}
          Copy All
        </button>
        {/* CREATE SCRIPT BUTTON */}
        {!isLoading && fullSegments.length > 0 && (
          <button onClick={handleCreateScript} className="flex items-center justify-center gap-2 text-white text-[13px] font-bold transition-colors bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg shadow-lg shadow-purple-500/20">
            <Sparkles size={15} />
            Create Script
          </button>
        )}
    </div>
</div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Type to search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] border border-zinc-800 rounded-[2rem] py-3 pl-12 pr-4 text-[14px] outline-none focus:border-purple-600/50 focus:ring-1 focus:ring-purple-600/50 transition-all text-zinc-200 placeholder-zinc-500"
          />
        </div>

        {/* Transcript List WITH CUSTOM SCROLLBAR CLASS ADDED */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-2 mac-scrollbar">
          
          {filteredSegments.length === 0 && !isLoading && fullSegments.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-sm">
                Waiting for transcript data...
              </div>
          )}

          {filteredSegments?.map((segment) => (
            <div key={segment.id} className="flex gap-4 md:gap-6 group rounded-xl p-3 hover:bg-[#141414] transition-colors relative">
              <div className="w-[70px] shrink-0 pt-0.5">
                <span className="text-zinc-500 text-[13px] font-medium tracking-wide">
                  {segment.startTime}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-zinc-300 text-[14px] leading-relaxed pr-8">
                  {segment.text}
                </p>
              </div>
              <div className="absolute right-4 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleCopySegment(segment.text, segment.id)} className="p-1.5 text-zinc-500 hover:text-purple-400 bg-black/50 rounded-md border border-zinc-800">
                  {copiedId === segment.id ? <CheckCheck size={14} className="text-purple-400"/> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
             <div className="flex gap-4 md:gap-6 rounded-xl p-3 opacity-70">
                <div className="w-[70px] shrink-0 pt-0.5">
                   <div className="h-3 w-10 bg-zinc-800 rounded animate-pulse"></div>
                </div>
                <div className="flex-1 flex flex-col gap-2 pt-1">
                   <div className="h-3 w-3/4 bg-zinc-800 rounded animate-pulse"></div>
                   <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse delay-150"></div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transcriptor;