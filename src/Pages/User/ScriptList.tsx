import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mic, Loader, CheckCircle, Clock, X } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '@/Utils/URL';

const API_BASE_URL = `${baseURL}/api/v1/scripts`;

interface Script {
  id: string;
  heading: string;
  description: string;
  content: string;
  isVoiceGenerated: boolean;
  createdAt: string;
}

const ScriptsList = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/get-scripts-for-voice-over`, {
        withCredentials: true
      });
      console.log('Fetched scripts:', response.data); // Debug log
      setScripts(response.data.scripts || []);
    } catch (err: any) {
      console.error('Error fetching scripts:', err); // Debug log
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to fetch scripts',
        background: '#0f172a',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVoice = (script: Script) => {
    console.log('Generate voice clicked for script:', script); // Debug log
    
    if (script.isVoiceGenerated) {
      Swal.fire({
        icon: 'info',
        title: 'Already Generated',
        text: 'This script already has voice generated.',
        background: '#0f172a',
        color: '#fff'
      });
      return;
    }

    // Close modal if open
    if (showModal) {
      setShowModal(false);
      setSelectedScript(null);
    }
    
    console.log('Navigating to voice-over-agent with script:', script);
    
    // Navigate to voice-over-agent with script data in state
    navigate('/voice-over-agent', { 
      state: { 
        script
      } 
    });
  };

  const viewScriptContent = (script: Script, e: React.MouseEvent) => {
    console.log('View script clicked:', script); // Debug log
    e.preventDefault();
    e.stopPropagation();
    setSelectedScript(script);
    setShowModal(true);
  };

  const closeModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Closing modal'); // Debug log
    setShowModal(false);
    setSelectedScript(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader className="w-12 h-12 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600/20 rounded-2xl mb-4">
              <FileText className="w-8 h-8 text-violet-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Available Scripts</h1>
            <p className="text-slate-400">
              {scripts.length} scripts • {scripts.filter(s => !s.isVoiceGenerated).length} pending voice generation
            </p>
          </div>

          {/* Scripts Grid */}
          {scripts.length === 0 ? (
            <div className="bg-slate-900 rounded-2xl p-20 text-center">
              <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-xl text-slate-400">No scripts available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-slate-900 border rounded-2xl p-6 transition-all hover:border-violet-500/50 cursor-pointer border-slate-800 hover:shadow-lg hover:shadow-violet-500/10"
                  onClick={(e) => viewScriptContent(script, e)}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="w-6 h-6 text-violet-400" />
                    {script.isVoiceGenerated ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                        <Clock className="w-3 h-3" />
                        Pending
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {script.heading}
                  </h3>
                  
                  {script.content && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {script.content}
                    </p>
                  )}

                  <p className="text-slate-500 text-xs mb-4">
                    Created: {new Date(script.createdAt).toLocaleDateString()}
                  </p>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGenerateVoice(script);
                    }}
                    disabled={script.isVoiceGenerated}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all relative z-10 ${
                      script.isVoiceGenerated
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 hover:scale-105 cursor-pointer'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Mic className="w-5 h-5" />
                    {script.isVoiceGenerated ? 'Voice Generated' : 'Generate Voice'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Script Modal - Portal to body */}
      {showModal && selectedScript && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            zIndex: 99999
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal(e);
            }
          }}
        >
          <div 
            className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-800 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 100000 }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-white truncate">{selectedScript.heading}</h2>
                  {selectedScript.description && (
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{selectedScript.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => closeModal(e)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] bg-slate-900">
              <div className="bg-slate-950 rounded-xl p-6 border border-slate-800">
                <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {selectedScript.content}
                </pre>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>Created: {new Date(selectedScript.createdAt).toLocaleDateString()}</span>
                  {selectedScript.isVoiceGenerated && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Voice Generated
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex gap-3">
              <button
                onClick={(e) => closeModal(e)}
                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleGenerateVoice(selectedScript);
                }}
                disabled={selectedScript.isVoiceGenerated}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all relative z-10 ${
                  selectedScript.isVoiceGenerated
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 hover:scale-105 cursor-pointer'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <Mic className="w-5 h-5" />
                {selectedScript.isVoiceGenerated ? 'Voice Already Generated' : 'Generate Voice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScriptsList;