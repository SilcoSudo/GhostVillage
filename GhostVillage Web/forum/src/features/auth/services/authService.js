import api from '../../../shared/services/axios';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/web/auth/login', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },

  register: async (email, username, password, confirmPassword) => {
    try {
      const response = await api.post('/web/auth/register', {
        email,
        username,
        password,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/web/auth/logout');
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  },

  getMe: async () => {
    try {
      const response = await api.get('/web/auth/me');
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch user info'
      };
    }
  }
};

export default authService;
