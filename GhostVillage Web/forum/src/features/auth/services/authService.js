import api from "../../../shared/services/axios";

export const authService = {
  login: async (email, password, rememberMe = false) => {
    try {
      const response = await api.post("/auth/login", {
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
      const response = await api.post("/auth/register", {
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
      const response = await api.get("/auth/verify", { params: { token } });
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
      await api.post("/auth/logout");
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
      const response = await api.get("/auth/me");
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
      const response = await api.get("/auth/me", {
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
};

export default authService;
