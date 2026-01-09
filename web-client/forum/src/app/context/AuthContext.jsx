import { createContext, useState } from 'react';
import authService from '../../features/auth/services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = async (credentials) => {
    const result = await authService.login(credentials.identifier, credentials.password);
    
    if (result.success) {
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('token', result.token);
    }
    
    return result;
  };

  const register = async (formData) => {
    const result = await authService.register(
      formData.email,
      formData.username,
      formData.password,
      formData.confirmPassword
    );
    
    if (result.success) {
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('token', result.token);
    }
    
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
