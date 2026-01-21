import { createContext, useState, useEffect } from 'react';
import authService from '../../features/auth/services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login from saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const rememberMeExpiry = localStorage.getItem('rememberMeExpiry');

    if (savedToken && rememberMeExpiry) {
      const expiryDate = new Date(rememberMeExpiry);
      const now = new Date();

      if (now < expiryDate) {
        // Token still valid, restore session
        setToken(savedToken);
        authService.getCurrentUser(savedToken)
          .then(result => {
            if (result.success) {
              setUser(result.user);
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('rememberMeExpiry');
            }
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('rememberMeExpiry');
          })
          .finally(() => setLoading(false));
      } else {
        // Token expired, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMeExpiry');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials, rememberMe = false) => {
    const result = await authService.login(credentials.email, credentials.password, rememberMe);
    
    if (result.success) {
      setUser(result.user);
      setToken(result.token);
      
      // Always save token to localStorage for axios interceptor to work
      localStorage.setItem("token", result.token);

      if (rememberMe) {
        // Save expiry for 30 days
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString());
      } else {
        // For session-only, set short expiry (1 day) to match backend
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString());
      }
    }
    
    return result;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMeExpiry');
  };

  const setSession = (tokenValue, userValue) => {
    setUser(userValue);
    setToken(tokenValue);
    if (tokenValue) localStorage.setItem('token', tokenValue);
    else localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};
