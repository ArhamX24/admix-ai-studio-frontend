import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mic, Loader, CheckCircle, Clock, X, Trash2, Newspaper } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '@/Utils/URL';

const API_BASE_URL = `${baseURL}/api/v1/scripts`;

interface SavedScript {
  id: string;
  heading: string;
  description: string;
  anchor: string;
  voiceOver: string;
  thumbnail: string;
  scriptType: 'short' | 'long' | null;
  newsIds: string[];
  isVoiceGenerated: boolean;
  createdAt: string;
}

// ── Icons ──────────────────────────────────────────────────────
const AnchorIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5" />
  </svg>
);

const MicIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

// ── Script Card ────────────────────────────────────────────────
const ScriptCard: React.FC<{
  script: SavedScript;
  onView: (script: SavedScript) => void;
  onDelete: (id: string) => void;
  onGenerateVoice: (script: SavedScript) => void;
}> = ({ script, onView, onDelete, onGenerateVoice }) => {
  return (
    <div
      onClick={() => onView(script)}
      className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 flex flex-col gap-4"
    >
      {/* Top row — type badge + status + delete */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {script.scriptType && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              script.scriptType === 'short'
                ? 'bg-blue-600/20 text-blue-400'
                : 'bg-violet-600/20 text-violet-400'
            }`}>
              {script.scriptType === 'short' ? 'Short' : 'Long'}
            </span>
          )}
          {script.isVoiceGenerated ? (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-full font-semibold border border-emerald-500/20">
              <CheckCircle className="w-3 h-3" />
              Voice Done
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-500/15 text-amber-400 rounded-full font-semibold border border-amber-500/20">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(script.id);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Heading */}
      <div>
        <h3 className="text-zinc-100 font-semibold text-sm leading-snug line-clamp-2 mb-1"
          style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}>
          {script.heading}
        </h3>
        {script.thumbnail && (
          <p className="text-zinc-500 text-xs line-clamp-1"
            style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}>
            {script.thumbnail}
          </p>
        )}
      </div>

      {/* Anchor + VO preview */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2 bg-zinc-800/60 rounded-xl p-3">
          <span className="flex-shrink-0 mt-0.5 text-blue-400"><AnchorIcon /></span>
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2"
            style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}>
            {script.anchor}
          </p>
        </div>
        <div className="flex items-start gap-2 bg-zinc-800/60 rounded-xl p-3">
          <span className="flex-shrink-0 mt-0.5 text-violet-400"><MicIcon /></span>
          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2"
            style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}>
            {script.voiceOver}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{new Date(script.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}</span>
          {script.newsIds?.length > 0 && (
            <span className="flex items-center gap-1">
              <Newspaper className="w-3 h-3" />
              {script.newsIds.length} news
            </span>
          )}
        </div>

        {/* ✅ Action buttons */}
        <div className="flex items-center gap-2">
          {/* View button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(script);
            }}
            className="flex z-10 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            View
          </button>

          {/* Generate Voice button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateVoice(script);
            }}
            disabled={script.isVoiceGenerated}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              script.isVoiceGenerated
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            {script.isVoiceGenerated ? 'Generated' : 'Generate Voice'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Modal ──────────────────────────────────────────────────────
const ScriptModal: React.FC<{
  script: SavedScript;
  onClose: () => void;
  onGenerateVoice: (script: SavedScript) => void;
}> = ({ script, onClose, onGenerateVoice }) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        style={{ zIndex: 100000 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-800 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {script.scriptType && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    script.scriptType === 'short'
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-violet-600/20 text-violet-400'
                  }`}>
                    {script.scriptType === 'short' ? 'Short Script' : 'Long Script'}
                  </span>
                )}
                {script.isVoiceGenerated && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    Voice Done
                  </span>
                )}
              </div>
              <h2
                className="text-white font-bold text-lg leading-snug line-clamp-2"
                style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}
              >
                {script.heading}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Thumbnail */}
          {/* {script.thumbnail && (
            <div className="flex items-start gap-3 px-4 py-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl">
              <span className="text-xs font-bold text-yellow-400 tracking-widest mt-0.5 flex-shrink-0">THUMBNAIL</span>
              <p
                className="text-zinc-300 text-sm leading-relaxed"
                style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}
              >
                {script.thumbnail}
              </p>
            </div>
          )} */}

          {/* Anchor */}
          <div className="rounded-xl border border-blue-900/40 bg-zinc-900/60 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
              <span className="text-blue-400"><AnchorIcon /></span>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Anchor Script</span>
            </div>
            <p
              className="p-4 text-zinc-300 text-sm leading-7 whitespace-pre-wrap"
              style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}
            >
              {script.anchor}
            </p>
          </div>

          {/* Voice Over */}
          <div className="rounded-xl border border-violet-900/40 bg-zinc-900/60 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
              <span className="text-violet-400"><MicIcon /></span>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Voice Over Script</span>
            </div>
            <p
              className="p-4 text-zinc-300 text-sm leading-7 whitespace-pre-wrap"
              style={{ fontFamily: "'Noto Sans Devanagari', Arial, sans-serif" }}
            >
              {script.voiceOver}
            </p>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
            <span>Saved on {new Date(script.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}</span>
            {script.newsIds?.length > 0 && (
              <span className="flex items-center gap-1">
                <Newspaper className="w-3 h-3" />
                {script.newsIds.length} news used
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors text-sm"
          >
            Close
          </button>
          <button
            onClick={() => onGenerateVoice(script)}
            disabled={script.isVoiceGenerated}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              script.isVoiceGenerated
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20'
            }`}
          >
            <Mic className="w-4 h-4" />
            {script.isVoiceGenerated ? 'Voice Already Generated' : 'Generate Voice'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────
const ScriptsList = () => {
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<SavedScript | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/saved`, {
        withCredentials: true,
      });
      setScripts(response.data.data || []);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Scripts loading error',
        background: '#18181b',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Script?',
      text: 'Script will be deleted permanently. Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#18181b',
      color: '#fff',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/delete/${id}`, { withCredentials: true });
      setScripts((prev) => prev.filter((s) => s.id !== id));
      if (selectedScript?.id === id) setSelectedScript(null);
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Script deleted successfully.',
        background: '#18181b',
        color: '#fff',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Cannot delete the script',
        background: '#18181b',
        color: '#fff',
      });
    }
  };

  const handleGenerateVoice = (script: SavedScript) => {
    if (script.isVoiceGenerated) {
      Swal.fire({
        icon: 'info',
        title: 'Already Done',
        text: 'Script voice is already generated.',
        background: '#18181b',
        color: '#fff',
      });
      return;
    }
    setSelectedScript(null);
    navigate('/voice-over-agent', { state: { script } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader className="w-10 h-10 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Saved Scripts</h1>
              <p className="text-zinc-500 text-sm">
                {scripts.length} scripts saved •{' '}
                {scripts.filter((s) => !s.isVoiceGenerated).length} pending voice
              </p>
            </div>
            <button
              onClick={fetchScripts}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition-all self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Empty state */}
          {scripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5">
                <FileText className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-zinc-300 font-semibold text-lg mb-2">No scripts found</h3>
              <p className="text-zinc-500 text-sm mb-6">
                Go to the AI News page and select news to generate a script.
              </p>
              <button
                onClick={() => navigate('/ai-news')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Go to Ai News Page→
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scripts.map((script) => (
                <ScriptCard
                  key={script.id}
                  script={script}
                  onView={setSelectedScript}
                  onDelete={handleDelete}
                  onGenerateVoice={handleGenerateVoice}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      

      {/* Modal */}
      {selectedScript && (
        <ScriptModal
          script={selectedScript}
          onClose={() => setSelectedScript(null)}
          onGenerateVoice={handleGenerateVoice}
        />
      )}
    </>
  );
};

export default ScriptsList;