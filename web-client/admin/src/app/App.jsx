import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import SidebarNav from '../shared/components/layout/SidebarNav';
import LoginPage from '../features/auth/pages/LoginPage';
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
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '20px' }}>
                      <h1>Ghost Village Admin Dashboard</h1>
                      <p>Admin panel content coming soon...</p>
                    </div>
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
