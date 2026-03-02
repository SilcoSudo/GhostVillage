import { createContext, useState, useEffect, useContext } from "react";
import authService from "../../features/auth/services/authService";
import { clearAllAvatarCaches } from "../../shared/utils/avatarCache";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login from saved token on mount
  // Token expiry is handled by JWT verification on backend
  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      // Restore session and verify token with backend
      setToken(savedToken);
      authService
        .getCurrentUser(savedToken)
        .then((result) => {
          if (result.success) {
            setUser(result.user);
          } else {
            // Token invalid or expired, backend will reject it
            localStorage.removeItem("token");
          }
        })
        .catch(() => {
          // Token verification failed, clear storage
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials, rememberMe = false) => {
    const result = await authService.login(
      credentials.email,
      credentials.password,
      rememberMe,
    );

    if (result.success) {
      // Backend generates JWT with expiry based on rememberMe flag
      // No need to store expiry separately - backend verifies token
      setSession(result.token, result.user);
    }

    return result;
  };

  const register = async (formData) => {
    const result = await authService.register(
      formData.email,
      formData.fullName,
      formData.password,
      formData.confirmPassword,
      formData.dateOfBirth,
    );
    // register now only sends verification email; frontend should show message
    return result;
  };

  const setSession = (tokenValue, userValue) => {
    if (!tokenValue || !userValue) return false;
    setToken(tokenValue);
    setUser(userValue);
    localStorage.setItem("token", tokenValue);
    return true;
  };

  const refreshUser = async () => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      const result = await authService.getCurrentUser(savedToken);
      if (result.success) {
        setUser(result.user);
      }
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    // Clear all cached avatars on logout
    clearAllAvatarCaches();

    // Redirect về home sau khi logout
    window.location.href = "/";
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

  const refetchUser = async () => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) return;

    try {
      const result = await authService.getCurrentUser(currentToken);
      if (result.success) {
        setUser(result.user);
      }
    } catch (error) {
      console.error("Failed to refetch user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        setSession,
        refreshUser,
        forgotPassword,
        resetPassword,
        changePassword,
        refetchUser,
        userRole: user?.role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
