import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/Contexts/AuthContext';
import { 
  Newspaper, Megaphone, CameraIcon as CameraIconComponent, 
  FileText, Mic, History, LogOut, Menu, X, Loader2 , Settings
} from 'lucide-react';
import logo from "../../public/logo.jpg";
import Swal from 'sweetalert2'; // ✅ Import SweetAlert
import axios from 'axios';
import { baseURL } from '@/Utils/URL';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  role?: string;
}

const Sidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = useCallback((): MenuItem[] => {
    if (!user) return [];
    
    // Admin check
    if (user.role === 'ADMIN' || user.assignedRole === 'ADMIN') {
      return [
        { icon: Settings, label: 'Admin Panel', path: '/admin-panel' },
        { icon: Newspaper, label: 'News Agent', path: '/news-agent', role: 'NEWS_GENERATOR' },
        { icon: Megaphone, label: 'Voice Over Agent', path: '/voice-over-agent', role: 'AUDIO_GENERATOR' },
        { icon: FileText, label: 'Script Writer', path: '/script-writer', role: 'SCRIPT_WRITER' },
        { icon: Mic, label: 'Scripts List', path: '/scripts-list', role: 'VOICE_GENERATOR' },
        { icon: CameraIconComponent, label: 'Video Creator', path: '/video-agent', role: 'VIDEO_GENERATOR' }
      ];
    }

    // Initialize empty array
    const menuItems: MenuItem[] = [];
    const userRoles: string[] = [user.role]; 

    if (user.assignedRole) {
        userRoles.push(user.assignedRole);
    }

    if (userRoles.includes('NEWS_GENERATOR')) {
      menuItems.push({ icon: Newspaper, label: 'News Agent', path: '/news-agent' });
    }
    if (userRoles.includes('SCRIPT_WRITER')) {
      menuItems.push({ icon: FileText, label: 'Script Writer', path: '/script-writer' });
      menuItems.push({ icon: FileText, label: 'My Scripts', path: '/my-scripts' });
    }
    if (userRoles.includes('VOICE_GENERATOR') || userRoles.includes('AUDIO_GENERATOR')) {
      menuItems.push({ icon: Mic, label: 'Scripts List', path: '/scripts-list' });
      menuItems.push({ icon: Megaphone, label: 'Voice Over Agent', path: '/voice-over-agent' });
    }
    if (userRoles.includes('VIDEO_GENERATOR')) {
      menuItems.push({ icon: CameraIconComponent, label: 'Video Creator', path: '/video-agent' });
    }
    
    if (menuItems.length === 0) {
      menuItems.push({ icon: Newspaper, label: 'News Agent', path: '/news-agent' });
    }
    
    return menuItems;
  }, [user]);

  // ✅ Updated Logout Handler with SweetAlert2
  const handleLogout = useCallback(async () => {
    // 1. Confirm intention (Optional, remove if you want instant logout)
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your session.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, logout!',
      background: '#1f2937', // Dark mode background
      color: '#fff'
    });

    if (!result.isConfirmed) return;

    setIsLoggingOut(true);

    try {
      // 2. Call Backend to clear cookies
      await axios.post(`${baseURL}/api/v1/auth/logout`, {}, { withCredentials: true });

      // 3. Clear Local Context & Storage
      await logout();

      // 4. Success Alert
      Swal.fire({
        title: 'Logged Out!',
        text: 'See you next time.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#1f2937',
        color: '#fff'
      });
      
    } catch (error) {
      console.error("Logout failed", error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to logout properly',
        icon: 'error',
        background: '#1f2937',
        color: '#fff'
      });
      // Force local logout anyway
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (!user) return null;

  const menuItems = getMenuItems();

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen bg-gray-900 
        transition-all duration-300 ease-in-out z-40
        flex flex-col group
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64
        lg:translate-x-0 lg:w-20 lg:hover:w-64
        border-r border-gray-800 shadow-xl
      `}>
        <div className="flex items-center h-16 w-full border-b border-gray-800 flex-shrink-0 px-4 overflow-hidden">
          <img src={logo} alt="AI Studio Logo" className="w-12 h-12 object-contain" />
        </div>

        <nav className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  group/item relative flex items-center gap-4 px-4 py-3 
                  rounded-lg transition-all duration-200 overflow-hidden
                  ${isActive 
                    ? 'text-white bg-gray-800' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <IconComponent size={22} className="flex-shrink-0 transition-transform group-hover/item:scale-110" />
                <span className="whitespace-nowrap font-medium transition-all duration-200">
                  {item.label}
                </span>
                <div className={`
                  absolute left-0 top-0 h-full w-1 
                  bg-gradient-to-b from-yellow-400 via-orange-500 to-purple-600 
                  transition-transform duration-200
                  ${isActive ? 'translate-x-0' : '-translate-x-full group-hover/item:translate-x-0'}
                `} />
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-2 flex-shrink-0">
          <Link
            to="/history"
            onClick={() => setMobileOpen(false)}
            className={`
              group/history relative flex items-center gap-4 px-4 py-3 w-full cursor-pointer
              rounded-lg transition-all duration-200 overflow-hidden
              ${location.pathname === '/history' 
                ? 'text-white bg-gray-800' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            <History size={22} className="flex-shrink-0 transition-transform group-hover/history:scale-110" />
            <span className="whitespace-nowrap font-medium transition-all duration-200">History</span>
            <div className={`
              absolute left-0 top-0 h-full w-1 
              bg-gradient-to-b from-yellow-400 via-orange-500 to-purple-600 
              transition-transform duration-200
              ${location.pathname === '/history' ? 'translate-x-0' : '-translate-x-full group-hover/history:translate-x-0'}
            `} />
          </Link>
        </div>

        <div className="px-4 pb-3 flex-shrink-0">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="
              group/logout relative flex items-center gap-4 px-4 py-3 w-full cursor-pointer
              text-gray-400 hover:text-white hover:bg-gray-800 
              rounded-lg transition-all duration-200 overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isLoggingOut ? (
              <Loader2 size={22} className="flex-shrink-0 animate-spin" />
            ) : (
              <LogOut size={22} className="flex-shrink-0 transition-transform group-hover/logout:scale-110" />
            )}
            <span className="whitespace-nowrap font-medium transition-all duration-200">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;