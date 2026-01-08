import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import SidebarNav from '../shared/components/layout/SidebarNav';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ProtectedRoute from './router/ProtectedRoute';
import '../shared/assets/styles/theme.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app-container" style={{ display: 'flex' }}>
          {isAuthenticated && <SidebarNav />}
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '20px' }}>
                      <h1>Welcome to Ghost Village Forum!</h1>
                      <p>Forum content coming soon...</p>
                    </div>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
