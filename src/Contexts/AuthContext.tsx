import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { baseURL } from '@/Utils/URL';

// Types
interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'VIDEO_GENERATOR' | 'NEWS_GENERATOR' | 'VOICE_GENERATOR' | 'SCRIPT_WRITER';
  assignedRole: string | null;
  isActive?: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Global Axios Config: Always send cookies
axios.defaults.withCredentials = true;

const getRoleRedirectPath = (role: string | null): string => {
  switch (role) {
    case 'SCRIPT_WRITER': return '/script-writer';
    case 'VOICE_GENERATOR': return '/scripts-list';
    case 'VIDEO_GENERATOR': return '/video-agent';
    case 'AUDIO_GENERATOR': return '/voice-over-agent';
    case 'NEWS_GENERATOR': return '/news-agent';
    case 'ADMIN': return '/news-agent';
    default: return '/news-agent';
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 1. Check Auth (Cookie Only)
  // We just ask the backend "Who am I?". The browser sends the cookie automatically.
  const checkAuth = useCallback(async () => {
    try {
      // Note: We use the /me endpoint which is protected by authenticateToken
      const response = await axios.get<AuthResponse>(
        `${baseURL}/api/v1/auth/me`
      );

      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      // 401 or 403 means cookie is missing or invalid
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ 2. Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await axios.post<AuthResponse>(
        `/api/v1/auth/login`,
        { email, password }
      );

      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        
        // Redirect logic
        const redirectPath = getRoleRedirectPath(response.data.user.role);
        navigate(redirectPath, { replace: true });
        
        return { success: true };
      }
      
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: any) {
      console.log(error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ✅ 3. Logout
  const logout = useCallback(async () => {
    try {
      await axios.post(`/api/v1/auth/logout`);
    } catch (e) {
      console.error("Logout API failed", e);
    }
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // ✅ 4. Interceptor for Expired Token (Safety Net)
  // If the 30-day token DOES expire, force logout
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setUser(null);
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
             navigate('/login');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

  // Run checkAuth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};