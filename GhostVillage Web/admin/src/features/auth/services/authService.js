import api from "../../../shared/services/axios";

export const authService = {
  login: async (email, password, rememberMe = false) => {
    try {
      const response = await api.post("/web/auth/login", {
        email,
        password,
        rememberMe,
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  },

  register: async (email, fullName, password, confirmPassword, dateOfBirth) => {
    try {
      const response = await api.post("/web/auth/register", {
        email,
        fullName,
        password,
        confirmPassword,
        dateOfBirth,
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  },

  verify: async (token) => {
    try {
      const response = await api.get("/web/auth/verify", { params: { token } });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Verification failed",
      };
    }
  },

  logout: async () => {
    try {
      await api.post("/web/auth/logout");
      return {
        success: true,
        message: "Logout successful",
      };
    } catch (error) {
      return {
        success: false,
        message: "Logout failed",
      };
    }
  },

  getMe: async () => {
    try {
      const response = await api.get("/web/auth/me");
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: "Failed to fetch user info",
      };
    }
  },

  getCurrentUser: async (token) => {
    try {
      const response = await api.get("/web/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: "Failed to fetch user info",
      };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/web/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send reset link",
      };
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await api.post("/web/auth/reset-password", {
        token,
        password,
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Password reset failed",
      };
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await api.post("/web/auth/change-password", {
        oldPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Password change failed",
      };
    }
  },
};

export default authService;
