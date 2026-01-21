import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import NewsAgent from './Pages/User/NewsAgent.tsx';
import SpeechAgent from './Pages/User/SpeechAgent.tsx';
import ProfilePage from './Pages/User/ProfilePage.tsx';
import { Login } from './Pages/Auth/login-1.tsx';
import { BeamsBackground } from './Components/ui/beams-background.tsx';
import VideoAgent from './Pages/User/VideoAgent.tsx';
import HistoryPage from './Pages/User/HistoryPage.tsx';
import { store } from './Store/store.ts';
import { Provider } from 'react-redux';
import ScriptWriter from './Pages/User/ScriptWriter.tsx';
import ScriptsList from './Pages/User/ScriptList.tsx';
import MyScripts from './Pages/User/MyScripts.tsx';
import ProtectedRoute from './Components/ProtectedRoute.tsx';
import { AuthProvider } from './Contexts/AuthContext.tsx';
import AdminPanel from './Pages/Admin/AdminPanel.tsx';
import AvatarPage from './Pages/User/AvatarPage.tsx';

const AppRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider> 
        <BeamsBackground children={<App />} />
      </AuthProvider>
    ),
    children: [
      { path: "/login", element: <Login /> },
      {
        path: "/news-agent",
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'NEWS_GENERATOR']}>
            <NewsAgent />
          </ProtectedRoute>
        )
      },
      {
        path: "/voice-over-agent",
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'AUDIO_GENERATOR', 'VOICE_GENERATOR']}>
            <SpeechAgent />
          </ProtectedRoute>
        )
      },
      {
        path: "/video-agent",
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'VIDEO_GENERATOR']}>
            <VideoAgent />
          </ProtectedRoute>
        )
      },
      {
        path: "/script-writer",
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SCRIPT_WRITER']}>
            <ScriptWriter />
          </ProtectedRoute>
        )
      },
      {
        path: "/scripts-list",
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'VOICE_GENERATOR']}>
            <ScriptsList />
          </ProtectedRoute>
        )
      },
      {
        path: "/my-scripts",
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SCRIPT_WRITER']}>
            <MyScripts />
          </ProtectedRoute>
        )
      },
      {
        path: "/history",
        element: (
          <ProtectedRoute> {/* All auth users can see history */}
            <HistoryPage />
          </ProtectedRoute>
        )
      },
      {
        path: "/view-profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )
      },
      {
        path: "/admin-panel",
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminPanel />
          </ProtectedRoute>
        )
      }, 
      {
        path: "/select-avatar",
        element: <AvatarPage/>
      }
    ]
  }
]);



// Wrap your entire app with AuthProvider
createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <RouterProvider router={AppRouter} />
    </Provider>
);

