import { useState } from 'react';
import { FileText, Save, Loader, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { baseURL } from '@/Utils/URL';

const API_BASE_URL = `${baseURL}/api/v1`;

const ScriptWriter = () => {
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveScript = async () => {
    if (!heading.trim() || !content.trim()) {
      setError('Heading and content are required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post(`${API_BASE_URL}/scripts/create`, {
        heading: heading.trim(),
        description: description.trim(),
        content: content.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        setHeading('');
        setDescription('');
        setContent('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.log(err);
      
      setError(err.response?.data?.error || 'Failed to save script');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="flex flex-col items-center gap-2 mb-8 pt-8">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
          <FileText className="w-16 h-16 text-emerald-400 relative" />
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight">Script Writer</h1>
        <p className="text-base text-slate-400">Create scripts for voice generation</p>
      </div>

      {error && (
        <div className="w-full max-w-4xl mb-6 border rounded-xl px-5 py-4 text-sm backdrop-blur-sm bg-red-500/10 border-red-500/30 text-red-400">
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="w-full max-w-4xl mb-6 border rounded-xl px-5 py-4 text-sm backdrop-blur-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Script saved successfully!</span>
        </div>
      )}

      <div className="w-full max-w-4xl">
        <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-8">
          
          <div className="mb-6">
            <label className="text-white font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Script Heading
            </label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Enter a catchy headline for your script..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white text-base focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500 transition-all"
              maxLength={200}
            />
            <p className="text-xs text-slate-500 mt-2">{heading.length}/200 characters</p>
          </div>

          <div className="mb-8">
            <label className="block text-white font-semibold mb-3">Script Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your script here...&#10;&#10;भारत विविधता में एकता का देश है। यहाँ की संस्कृति, परंपरा और भाषा पूरी दुनिया में प्रसिद्ध है।"
              className="w-full px-4 py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white text-base focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500 transition-all min-h-[400px] resize-y"
              maxLength={5000}
            />
            <p className="text-xs text-slate-500 mt-2">{content.length}/5000 characters</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveScript}
              disabled={saving || !heading.trim() || !content.trim()}
              className={`px-8 py-3.5 rounded-xl text-base font-bold transition-all flex items-center gap-3 shadow-lg ${
                saving || !heading.trim() || !content.trim()
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/50 hover:scale-105'
              }`}
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Script</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptWriter;
