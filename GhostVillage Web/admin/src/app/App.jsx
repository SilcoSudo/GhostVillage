import { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from '../shared/components/layout/Header';
import SidebarNav from '../shared/components/layout/SidebarNav';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import UserManagementPage from '../pages/UserManagementPage';
import ReportedPostPage from '../pages/ReportedPostPage';
import ReportedCommentPage from '../pages/ReportedCommentPage';
import SupportTicketPage from '../pages/SupportTicketPage';
import AnnouncementPage from '../pages/AnnouncementPage';
import WikiPage from '../pages/WikiPage';
import MonsterManagementPage from '../pages/MonsterManagementPage';
import MapManagementPage from '../pages/MapManagementPage';
import ProtectedRoute from './router/ProtectedRoute';
import '../shared/assets/styles/theme.css';

function AppContent() {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  
  // Pages where we don't show Header and Sidebar
  const authPages = ['/login'];
  const showLayout = !authPages.includes(location.pathname);

  return (
    <div className="app-container">
      {showLayout && <Header />}
      <div className="app-layout">
        {showLayout && <SidebarNav />}
        <main className={`main-content ${showLayout ? 'with-sidebar' : ''}`}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
            <Route path="/support-tickets" element={<ProtectedRoute><SupportTicketPage /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><AnnouncementPage /></ProtectedRoute>} />
            <Route path="/wiki" element={<ProtectedRoute><WikiPage /></ProtectedRoute>} />
            <Route path="/monsters" element={<ProtectedRoute><MonsterManagementPage /></ProtectedRoute>} />
            <Route path="/maps" element={<ProtectedRoute><MapManagementPage /></ProtectedRoute>} />
            <Route path="/reports/posts" element={<ProtectedRoute><ReportedPostPage /></ProtectedRoute>} />
            <Route path="/reports/comments" element={<ProtectedRoute><ReportedCommentPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><div style={{ padding: '20px' }}><h1>Reports</h1></div></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><div style={{ padding: '20px' }}><h1>Settings</h1></div></ProtectedRoute>} />
            <Route path="/report-bug" element={<ProtectedRoute><div style={{ padding: '20px' }}><h1>Report Bug</h1></div></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
