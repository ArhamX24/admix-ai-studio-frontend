import { useEffect, useRef, useCallback, useState } from "react";
import { Play, Volume2, Loader, Download, Pause, RefreshCw } from "lucide-react";
import axios from "axios";
import { useLocation } from "react-router";
import { baseURL } from "@/Utils/URL";


const API_BASE_URL = `${baseURL}/api/v1/speech`;

interface Voice {
  id: string;
  voiceId: string;
  name: string;
  description?: string;
  language: string;
  accent?: string;
  isCustom: boolean;
  createdAt: string;
  previewUrl?: string;
  category?: string;
  labels?: any;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description: string;
  labels: {
    accent?: string;
    descriptive?: string;
    age?: string;
    gender?: string;
    use_case?: string;
    language?: string;
  };
  preview_url: string;
  category: string;
}

interface TransformedVoice extends Voice {
  previewUrl?: string;
  category?: string;
  labels?: any;
}

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;

      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export function SpeechGenerator() {
  const [value, setValue] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<TransformedVoice | null>(null);
  const [hindiVoices, setHindiVoices] = useState<TransformedVoice[]>([]);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentSpeechId, setCurrentSpeechId] = useState<string | null>(null);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 120,
    maxHeight: 300,
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const location = useLocation();
  const scriptFromState = location.state?.script;

  useEffect(() => {
    fetchHindiVoices();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (mainAudioRef.current) {
        mainAudioRef.current.pause();
        mainAudioRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const fetchHindiVoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const elevenResponse = await axios.get(`${API_BASE_URL}/voices/existing`);
      const elevenVoicesList = elevenResponse.data.data || [];
      
      const transformedElevenVoices: TransformedVoice[] = elevenVoicesList
        .map((v: ElevenLabsVoice) => {
          let voiceLanguage = 'en';
          
          if (v.labels?.language) {
            const labelLang = v.labels.language.toLowerCase();
            if (labelLang === 'hi' || labelLang === 'hindi') {
              voiceLanguage = 'hi';
            } else if (labelLang === 'en' || labelLang === 'english') {
              voiceLanguage = 'en';
            } else {
              voiceLanguage = labelLang;
            }
          }
          
          return {
            id: v.voice_id,
            voiceId: v.voice_id,
            name: v.name,
            description: v.description,
            language: voiceLanguage,
            accent: v.labels?.accent || '',
            isCustom: false,
            createdAt: new Date().toISOString(),
            previewUrl: v.preview_url,
            category: v.category,
            labels: v.labels
          };
        })
        .filter((v: TransformedVoice) => v.language === 'hi');
      
      setHindiVoices(transformedElevenVoices);
      
      if (transformedElevenVoices.length > 0) {
        setSelectedVoice(transformedElevenVoices[0]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch voices';
      setError(errorMessage);
      console.error('Error fetching Hindi voices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setValue('');
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (mainAudioRef.current) {
      mainAudioRef.current.pause();
      mainAudioRef.current = null;
    }
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    setCurrentAudioUrl(null);
    setCurrentSpeechId(null);
    setPlaying(false);
    setGenerating(false);
    setPlayingPreview(null);
    setError(null);
    
    adjustHeight(true);
  };

  const playPreview = (previewUrl: string, voiceId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingPreview === voiceId) {
      setPlayingPreview(null);
      return;
    }

    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setPlayingPreview(voiceId);

    audio.play();
    audio.onended = () => {
      setPlayingPreview(null);
      audioRef.current = null;
    };
  };

  useEffect(() => {
  const savedScript = localStorage.getItem('selectedScript');
  if (savedScript) {
    const script = JSON.parse(savedScript);
    setValue(script.content);
    localStorage.removeItem('selectedScript');
  } else if (scriptFromState) {
    setValue(scriptFromState.content);
  }
}, [scriptFromState]);

  const handlePlayPause = async () => {
    if (playing && mainAudioRef.current) {
      mainAudioRef.current.pause();
      setPlaying(false);
      return;
    }

    if (currentAudioUrl && mainAudioRef.current) {
      mainAudioRef.current.play();
      setPlaying(true);
      return;
    }

    if (!value.trim()) {
      setError('Please enter some text');
      return;
    }

    if (!selectedVoice) {
      setError('Please select a voice');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/generate`, {
        text: value,
        voiceId: selectedVoice.voiceId,
        language: 'multilingual',
        scriptId: scriptFromState?.id || null,
        isElevenLabsVoice: true,
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      });

      if (response.data.status === 'processing') {
        const eventId = response.data.eventId;
        setCurrentSpeechId(eventId);
        
        pollIntervalRef.current = setInterval(async () => {
          try {
            const historyResponse = await axios.get(`${API_BASE_URL}/history/?limit=1`);
            const latestSpeech = historyResponse.data.speeches[0];
            
            if (latestSpeech && latestSpeech.status === 'COMPLETED') {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              
              const audioUrl = latestSpeech.audioFilePath;
              setCurrentAudioUrl(audioUrl);
              
              const audio = new Audio(audioUrl);
              mainAudioRef.current = audio;
              
              audio.play();
              setPlaying(true);
              setGenerating(false);
              
              audio.onended = () => setPlaying(false);
              audio.onerror = () => {
                setError('Failed to play audio');
                setPlaying(false);
                setGenerating(false);
              };
            } else if (latestSpeech && latestSpeech.status === 'FAILED') {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              setError('Speech generation failed');
              setGenerating(false);
            }
          } catch (err: any) {
            console.error('Polling error:', err);
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setGenerating(false);
      
      if (err.response) {
        setError(`Error: ${err.response.data?.error || err.response.data?.message || 'Server error'}`);
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Error generating speech');
      }
    }
  };

  const handleDownload = async () => {
    if (!currentAudioUrl) {
      setError('No audio to download. Please generate speech first.');
      return;
    }

    try {
      const response = await fetch(currentAudioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download audio');
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
          <Volume2 className="w-16 h-16 text-blue-400 relative" />
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight">Voice Over Generator</h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className={`w-full max-w-5xl mb-6 border rounded-xl px-5 py-4 text-sm backdrop-blur-sm ${
          error.includes('successfully') 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-5xl">
        <div className="relative bg-transparent backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
          
          {/* Top Controls Bar */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-transparent">
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg">
                <span className="text-sm font-semibold text-blue-400">Hindi Voices</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                disabled={!value && !currentAudioUrl}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  !value && !currentAudioUrl
                    ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white shadow-lg hover:shadow-slate-700/50'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                New Chat
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  disabled={generating || !value.trim() || loading || !selectedVoice}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg ${
                    generating || !value.trim() || loading || !selectedVoice
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      : playing
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-orange-500/50' // Pause State
                      : currentAudioUrl
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/50' // Resume/Play State
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-blue-500/50' // Generate State
                  }`}
                >
                  {generating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : playing ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : currentAudioUrl ? (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Generate</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!currentAudioUrl}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg ${
                    !currentAudioUrl
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/50'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Textarea Section */}
          <div className="p-6 bg-transparent">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
                setCurrentAudioUrl(null);
                setPlaying(false);
                if (mainAudioRef.current) {
                  mainAudioRef.current.pause();
                }
              }}
              placeholder="Type or paste your Hindi text here..."
              className="w-full px-4 py-3 resize-none bg-slate-900/50 border border-slate-700/50 rounded-2xl text-white text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-500 min-h-[120px] transition-all"
              style={{ overflow: "hidden" }}
            />
          </div>

          {/* Voice Selection Section */}
          <div className="border-t border-slate-700/50 p-6 bg-transparent">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Select Voice</h3>
                  <p className="text-xs text-slate-400">{hindiVoices.length} Hindi voices available</p>
                </div>
              </div>
            </div>
            
            {loading ? (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader className="w-10 h-10 animate-spin text-blue-500 mb-3" />
    <p className="text-slate-400 text-sm">Loading voices...</p>
  </div>
) : hindiVoices.length === 0 ? (
  <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-700/50">
    <Volume2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
    <p className="text-slate-400 text-base font-medium">No Hindi voices available</p>
    <p className="text-slate-500 text-sm mt-1">Please check your connection</p>
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-custom">
    {hindiVoices.map((voice) => (
      <div
        key={voice.id}
        className={`group relative flex flex-col gap-3 p-4 rounded-xl transition-all border cursor-pointer ${
          selectedVoice?.id === voice.id
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-400 shadow-lg shadow-blue-500/30'
            : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 hover:shadow-lg'
        }`}
        onClick={() => {
          setSelectedVoice(voice);
          setCurrentAudioUrl(null);
          setPlaying(false);
          if (mainAudioRef.current) {
            mainAudioRef.current.pause();
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedVoice(voice);
            setCurrentAudioUrl(null);
            setPlaying(false);
            if (mainAudioRef.current) {
              mainAudioRef.current.pause();
            }
          }
        }}
      >
        {/* Voice Info */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${
              selectedVoice?.id === voice.id ? 'text-white' : 'text-slate-200'
            }`}>
              {voice.name}
            </p>
            {voice.accent && (
              <p className={`text-xs mt-1 truncate ${
                selectedVoice?.id === voice.id ? 'text-blue-100' : 'text-slate-400'
              }`}>
                {voice.accent}
              </p>
            )}
          </div>
          
          {/* ✅ FIXED: Preview button OUTSIDE card */}
          {voice.previewUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPreview(voice.previewUrl!, voice.id);
              }}
              className={`flex-shrink-0 p-2 rounded-lg transition-all ml-2 ${
                selectedVoice?.id === voice.id
                  ? 'bg-white/20 hover:bg-white/30'
                  : 'bg-slate-700/50 hover:bg-slate-600'
              }`}
              aria-label={`Play preview for ${voice.name}`}
            >
              {playingPreview === voice.id ? (
                <Loader className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Volume2 className={`w-4 h-4 ${
                  selectedVoice?.id === voice.id ? 'text-white' : 'text-slate-400'
                }`} />
              )}
            </button>
          )}
        </div>

        {/* Selected indicator */}
        {selectedVoice?.id === voice.id && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    ))}
  </div>
)}

          </div>

          {/* Enhanced Scrollbar Styles */}
          <style>{`
            .scrollbar-custom::-webkit-scrollbar {
              width: 8px;
            }
            .scrollbar-custom::-webkit-scrollbar-track {
              background: rgba(15, 23, 42, 0.3);
              border-radius: 4px;
            }
            .scrollbar-custom::-webkit-scrollbar-thumb {
              background: rgba(59, 130, 246, 0.5);
              border-radius: 4px;
              transition: background 0.2s;
            }
            .scrollbar-custom::-webkit-scrollbar-thumb:hover {
              background: rgba(59, 130, 246, 0.7);
            }
            
            /* Firefox */
            .scrollbar-custom {
              scrollbar-width: thin;
              scrollbar-color: rgba(59, 130, 246, 0.5) rgba(15, 23, 42, 0.3);
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export default SpeechGenerator;
