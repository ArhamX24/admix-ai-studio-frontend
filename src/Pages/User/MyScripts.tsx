import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FileText, Edit3, Trash2, Loader, Search 
} from 'lucide-react';
import { baseURL } from '@/Utils/URL';

const API_BASE_URL = `${baseURL}/api/v1/scripts`;

interface MyScript {
  id: string;
  heading: string;
  description?: string;
  content: string;
  isVoiceGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

const MyScripts = () => {
  const [scripts, setScripts] = useState<MyScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyScripts();
  }, []);

  const fetchMyScripts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/get-scripts`, {
        withCredentials: true
      });
      setScripts(response.data.scripts || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
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

  const filteredScripts = scripts.filter(script =>
    (script.heading || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (script.content || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = async (e: React.MouseEvent, script: MyScript) => {
    e.stopPropagation();

    await Swal.fire({
      title: '<span style="color: #fff; font-size: 28px; font-weight: 700;">Edit Script</span>',
      html: `
        <div style="padding: 0 20px;">
          <div style="margin-bottom: 20px; text-align: left;">
            <label style="display: block; color: #94a3b8; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
              Script Title
            </label>
            <input 
              id="swal-heading" 
              class="swal2-input" 
              placeholder="Enter script heading"
              style="width: 100%; margin: 0; padding: 12px 16px; font-size: 15px;"
            />
          </div>
          
          <div style="text-align: left;">
            <label style="display: block; color: #94a3b8; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
              Script Content
            </label>
            <textarea 
              id="swal-content" 
              class="swal2-textarea" 
              placeholder="Enter your script content here..."
              rows="12"
              style="width: 100%; margin: 0; padding: 12px 16px; font-size: 14px; line-height: 1.6; resize: vertical; min-height: 250px;"
            ></textarea>
          </div>
        </div>
      `,
      width: '800px',
      background: '#0f172a',
      color: '#fff',
      showCancelButton: true,
      confirmButtonText: '<span style="padding: 0 12px;">💾 Update Script</span>',
      cancelButtonText: '<span style="padding: 0 12px;">✕ Cancel</span>',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#475569',
      buttonsStyling: true,
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'custom-confirm-btn',
        cancelButton: 'custom-cancel-btn'
      },
      didOpen: () => {
        const titleInput = Swal.getPopup()?.querySelector('#swal-heading') as HTMLInputElement;
        const contentInput = Swal.getPopup()?.querySelector('#swal-content') as HTMLTextAreaElement;
        if (titleInput) titleInput.value = script.heading;
        if (contentInput) contentInput.value = script.content;
      },
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const heading = (document.getElementById('swal-heading') as HTMLInputElement)?.value;
        const content = (document.getElementById('swal-content') as HTMLTextAreaElement)?.value;
        
        if (!heading || !content) {
          Swal.showValidationMessage('Please fill all fields');
          return false;
        }

        try {
          await axios.put(`${API_BASE_URL}/update-script/${script.id}`, 
            { heading, content }, 
            { withCredentials: true }
          );
          return true;
        } catch (error: any) {
          Swal.showValidationMessage(
            `Request failed: ${error.response?.data?.message || error.message}`
          );
          return false;
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: '<span style="color: #fff;">Updated Successfully!</span>',
          html: '<p style="color: #94a3b8;">Your script has been updated</p>',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#10b981',
          timer: 2000,
          showConfirmButton: false
        });
        fetchMyScripts();
      }
    });
  };

  const handleDelete = async (e: React.MouseEvent, scriptId: string) => {
    e.stopPropagation();

    if (!scriptId) {
      console.error("Script ID is missing");
      return;
    }

    const result = await Swal.fire({
      title: '<span style="color: #fff; font-size: 24px;">Are you sure?</span>',
      html: '<p style="color: #94a3b8; font-size: 15px;">You won\'t be able to revert this action!</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: '🗑️ Yes, delete it!',
      cancelButtonText: '✕ Cancel',
      background: '#0f172a',
      color: '#fff',
      customClass: {
        popup: 'custom-swal-popup'
      }
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/delete-script/${scriptId}`, {
          withCredentials: true
        });

        Swal.fire({
          icon: 'success',
          title: '<span style="color: #fff;">Deleted!</span>',
          html: '<p style="color: #94a3b8;">Script has been deleted successfully</p>',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#10b981',
          timer: 2000,
          showConfirmButton: false
        });

        setScripts(prev => prev.filter(s => s.id !== scriptId));
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: '<span style="color: #fff;">Error</span>',
          html: `<p style="color: #94a3b8;">${err.response?.data?.message || 'Failed to delete script'}</p>`,
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Scripts</h1>
          <p className="text-slate-400">Manage your script collection</p>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Scripts List */}
        {filteredScripts.length === 0 ? (
          <div className="bg-slate-900 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No scripts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScripts.map((script) => (
              <div
                key={script.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {script.heading}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                      {script.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created: {new Date(script.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded ${
                        script.isVoiceGenerated 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {script.isVoiceGenerated ? 'Voice Generated' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleEdit(e, script)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer z-10"
                      title="Edit"
                    >
                      <Edit3 className="w-5 h-5 pointer-events-none" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, script.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer z-10"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 pointer-events-none" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .custom-swal-popup {
          border-radius: 16px !important;
          border: 1px solid #1e293b !important;
        }
        
        .swal2-input, .swal2-textarea {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
          color: #fff !important;
          border-radius: 10px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        .swal2-input:focus, .swal2-textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
          outline: none !important;
        }
        
        .swal2-input::placeholder, .swal2-textarea::placeholder {
          color: #64748b !important;
        }
        
        .custom-confirm-btn, .custom-cancel-btn {
          border-radius: 10px !important;
          padding: 12px 24px !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          transition: all 0.2s !important;
        }
        
        .custom-confirm-btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
        }
        
        .custom-cancel-btn:hover {
          transform: translateY(-1px) !important;
          background: #334155 !important;
        }
        
        .swal2-validation-message {
          background: #7f1d1d !important;
          color: #fca5a5 !important;
          border: 1px solid #991b1b !important;
          border-radius: 8px !important;
        }
        
        .swal2-title {
          padding: 20px 0 10px 0 !important;
        }
        
        .swal2-html-container {
          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default MyScripts;