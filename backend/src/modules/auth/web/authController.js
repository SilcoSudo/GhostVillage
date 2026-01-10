import AuthService from '../authService.js';

/**
 * Web Auth Controller
 * Handles authentication for web clients (forum users)
 */

export const registerWeb = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validation
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const { token, user } = await AuthService.registerWeb(email, password);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Web Register error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

export const loginWeb = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const { token, user } = await AuthService.loginWeb(email, password);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    console.error('Web Login error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

export const logoutWeb = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

export const getMeWeb = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await AuthService.getUserById(userId);
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get Me error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized'
    });
  }
};
