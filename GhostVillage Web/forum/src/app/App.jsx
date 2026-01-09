import { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from '../shared/components/layout/Header';
import SidebarNav from '../shared/components/layout/SidebarNav';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import HomePage from '../pages/HomePage';
import ProtectedRoute from './router/ProtectedRoute';
import '../shared/assets/styles/theme.css';

function AppContent() {
  const { token } = useContext(AuthContext);
  const isAuthenticated = !!token;

  return (
    <div className="app-container">
      {isAuthenticated && <Header />}
      <div className="app-layout">
        {isAuthenticated && <SidebarNav />}
        <main className={`main-content ${isAuthenticated ? 'with-sidebar' : ''}`}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
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
