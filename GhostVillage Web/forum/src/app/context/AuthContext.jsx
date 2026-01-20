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
      
      // Always save token to localStorage for axios interceptor to work, 
      // but managed expiry differs
      localStorage.setItem("token", result.token);

      if (rememberMe) {
        // Save expiry for 30 days
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString());
      } else {
        // For session-only, we store it in sessionStorage OR just don't set local expiry
        // Choosing to set a short local expiry (1 day) to match backend
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        localStorage.setItem('rememberMeExpiry', expiryDate.toISOString());
      }
    }
    
    return result;
  };

  const register = async (formData) => {
    const result = await authService.register(
      formData.email,
      formData.fullName,
      formData.password,
      formData.confirmPassword,
      formData.dateOfBirth
    );
    // register now only sends verification email; frontend should show message
    return result;
  };

  const setSession = (tokenValue, userValue) => {
    setUser(userValue);
    setToken(tokenValue);
    if (tokenValue) localStorage.setItem('token', tokenValue);
    else localStorage.removeItem('token');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMeExpiry');
    sessionStorage.removeItem('token');
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const resetPassword = async (token, newPassword) => {
    return await authService.resetPassword(token, newPassword);
  };

  const changePassword = async (oldPassword, newPassword) => {
    return await authService.changePassword(oldPassword, newPassword);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout, 
      setSession,
      forgotPassword,
      resetPassword,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
