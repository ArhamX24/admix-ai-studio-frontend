import React, { useState, useEffect } from 'react';
import { Volume2, Play, Download, Trash2, Loader, Pause, RefreshCw } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '@/Utils/URL';

const API_BASE_URL = `${baseURL}/api/v1/speech`;

interface SpeechHistory {
  id: string;
  text: string;
  audioFilePath: string;
  createdAt: string;
  fileSize: number;
  status: string;
  duration?: number;
  language: string;
  voice: {
    name: string;
    voiceId: string;
  } | null;
}

const HistoryPage = () => {
  const [speechHistory, setSpeechHistory] = useState<SpeechHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSpeechHistory();
    
    // Cleanup audio on unmount
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.src = '';
      }
    };
  }, []);

  const fetchSpeechHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/history`, {
        withCredentials: true
      });
      console.log('Speech history response:', response.data);
      setSpeechHistory(response.data.speeches || []);
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to fetch audio history',
        background: '#0f172a',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '<span style="color: #fff;">Are you sure?</span>',
      html: '<p style="color: #94a3b8;">This audio will be permanently deleted</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: '🗑️ Yes, delete it!',
      cancelButtonText: '✕ Cancel',
      background: '#0f172a',
      color: '#fff'
    });

    if (!result.isConfirmed) return;

    try {
      // Stop playing if this audio is currently playing
      if (playingId === id && audioRef) {
        audioRef.pause();
        setPlayingId(null);
      }

      await axios.post(`${API_BASE_URL}/delete`, {
        speechId: id
      }, {
        withCredentials: true
      });

      setSpeechHistory(speechHistory.filter((s) => s.id !== id));

      Swal.fire({
        icon: 'success',
        title: '<span style="color: #fff;">Deleted!</span>',
        html: '<p style="color: #94a3b8;">Audio has been deleted successfully</p>',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#10b981',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error: any) {
      console.error('Delete failed:', error);
      Swal.fire({
        icon: 'error',
        title: '<span style="color: #fff;">Error</span>',
        html: `<p style="color: #94a3b8;">${error.response?.data?.error || 'Failed to delete audio'}</p>`,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
    }
  };

// 1. Better Cleanup using useEffect
  // We need to track the audio instance in a way that is accessible during cleanup
  useEffect(() => {
    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.onerror = null; // Prevent error alert during unmount
        audioRef.src = '';
      }
    };
  }, [audioRef]); // Add audioRef dependency so cleanup works

  const handlePlay = (id: string, url: string) => {
    // If clicking the same audio that's playing, pause it
    if (playingId === id && audioRef) {
      audioRef.pause();
      setPlayingId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef) {
      audioRef.pause();
      // ✅ FIX: Nullify listeners before clearing src to prevent fake errors
      audioRef.onerror = null; 
      audioRef.onended = null;
      audioRef.src = '';
    }

    // Create new audio and play
    const audio = new Audio(url);
    setAudioRef(audio);
    setPlayingId(id);

    audio.onended = () => {
      setPlayingId(null);
    };

    // ✅ Only show error if it happens during actual loading/playback
    audio.onerror = () => {
      // Check if we are merely cleaning up (src is empty)
      if (audio.src === '' || audio.src === window.location.href) return;
      

      Swal.fire({
        icon: 'error',
        title: 'Audio Error',
        text: 'Failed to load audio file',
        background: '#0f172a',
        color: '#fff'
      });
      setPlayingId(null);
    };

    audio.play().catch(err => {
      // Ignore "The play() request was interrupted" errors which happen when switching tracks fast
      if (err.name !== 'AbortError') {
        console.error('Play error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Playback Error',
          text: 'Failed to play audio',
          background: '#0f172a',
          color: '#fff'
        });
      }
      setPlayingId(null);
    });
  };

  const handleDownload = async (url: string, text: string) => {
    try {
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech-${Date.now()}.mp3`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Download Started',
        text: 'Your audio file is downloading',
        background: '#0f172a',
        color: '#fff',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Download error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Error',
        text: 'Failed to download audio file',
        background: '#0f172a',
        color: '#fff'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 mb-8 pt-8">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
          <Volume2 className="w-16 h-16 text-purple-400 relative" />
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight">Voice Over History</h1>
        <p className="text-base text-slate-400">View and manage your generated audio</p>
      </div>

      {/* Stats Bar */}
      {!loading && speechHistory.length > 0 && (
        <div className="w-full max-w-6xl mb-6">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-slate-400 text-sm">Total Audio</p>
                <p className="text-white text-2xl font-bold">{speechHistory.length}</p>
              </div>
              <div className="h-12 w-px bg-slate-700"></div>
            </div>
            <button
              onClick={fetchSpeechHistory}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="w-full max-w-6xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-12 h-12 animate-spin text-purple-500 mb-4" />
            <p className="text-slate-400">Loading audio history...</p>
          </div>
        ) : speechHistory.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-20 text-center">
            <Volume2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-slate-400 font-medium mb-2">No audio generated yet</p>
            <p className="text-sm text-slate-500">Start by generating your first audio</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {speechHistory.map((speech) => (
              <div
                key={speech.id}
                className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl border transition-all ${
                  playingId === speech.id
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'border-slate-700/50 hover:border-purple-500/50'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          playingId === speech.id
                            ? 'bg-purple-500/30'
                            : 'bg-purple-500/20'
                        }`}>
                          <Volume2 className={`w-5 h-5 ${
                            playingId === speech.id ? 'text-purple-300' : 'text-purple-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {speech.voice?.name || 'Unknown Voice'}
                          </h3>
                          {playingId === speech.id && (
                            <p className="text-purple-400 text-xs font-medium">Now Playing...</p>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4 bg-slate-950/50 rounded-lg p-3">
                        {speech.text}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          📅 {new Date(speech.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          📦 {formatFileSize(speech.fileSize)}
                        </span>
                        {speech.duration && (
                          <span className="flex items-center gap-1">
                            ⏱️ {formatDuration(speech.duration)}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          speech.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : speech.status === 'PROCESSING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {speech.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePlay(speech.id, speech.audioFilePath)}
                        className={`p-3 rounded-lg transition-all ${
                          playingId === speech.id
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                            : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                        }`}
                        title={playingId === speech.id ? 'Pause' : 'Play'}
                      >
                        {playingId === speech.id ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(speech.audioFilePath, speech.text)}
                        className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(speech.id)}
                        className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;