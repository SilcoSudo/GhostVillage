import AuthService from '../authService.js';

/**
 * Game Auth Controller
 * Handles authentication for game clients (game players)
 * 
 * Note: Game registration is handled through Web Auth
 * Only game-side login logic is implemented here
 */

export const loginGame = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Step 1: Authenticate with User credentials (web auth)
    const { token, user } = await AuthService.loginWeb(email, password);

    // Step 2: Get or create Player profile for this user
    const player = await AuthService.getOrCreatePlayerProfile(user._id, displayName);

    return res.status(200).json({
      success: true,
      message: 'Game login successful',
      token,
      user,
      player
    });
  } catch (error) {
    console.error('Game Login error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

export const logoutGame = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

export const getMeGame = async (req, res) => {
  try {
    const playerId = req.user?.userId;
    if (!playerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const player = await AuthService.getPlayerById(playerId);
    return res.status(200).json({
      success: true,
      player
    });
  } catch (error) {
    console.error('Get Me error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized'
    });
  }
};
