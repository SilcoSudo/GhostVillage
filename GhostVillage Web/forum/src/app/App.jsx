import { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from '../shared/components/layout/Header';
import SidebarNav from '../shared/components/layout/SidebarNav';
import MainLayout from '../shared/components/layout/MainLayout';
import AuthLayout from '../shared/components/layout/AuthLayout';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import RegistrationSuccessPage from '../features/auth/pages/RegistrationSuccessPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import HomePage from '../pages/HomePage';
import '../shared/assets/styles/theme.css';

function AppContent() {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  
  // Các trang không hiển thị Header và Sidebar
  const authPages = ['/login', '/register', '/registration-success', '/verify-email'];
  const showLayout = !authPages.includes(location.pathname);

  return (
    <div className="app-container">
      {showLayout && <Header />}
      <div className="app-layout">
        {showLayout && <SidebarNav />}
        <main className={`main-content ${showLayout ? 'with-sidebar' : ''}`}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/registration-success" element={<RegistrationSuccessPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route 
              path="/" 
              element={<HomePage />}
            />
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
