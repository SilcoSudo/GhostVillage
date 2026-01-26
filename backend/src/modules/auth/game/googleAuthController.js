import { google } from "googleapis";
import AuthService from "../authService.js";
import { config } from "../../../config/env.js";

// Game uses localhost:8888 as redirect URI (for desktop callback)
const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.gameRedirectUri, // Use game-specific redirect URI
);

/**
 * Get Google OAuth URL for Game Client
 * GET /api/game/auth/google
 * Returns JSON with authUrl
 */
export const getGoogleAuthUrl = async (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    // Wrap response to match APIClient wrapper format: { success, data }
    return res.status(200).json({
      success: true,
      data: { authUrl },  // Data wrapped in 'data' property
    });
  } catch (error) {
    console.error("[GameGoogleAuth] Get Auth URL error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate Google auth URL",
    });
  }
};

/**
 * Handle Google OAuth Callback for Game Client
 * GET /api/game/auth/google/callback?code=...
 * 
 * Game redirects to localhost:8888 which captures the code,
 * then game calls this endpoint to exchange code for tokens
 */
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Authorization code is required",
      });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Find or create user (shared with web)
    const { token, user } = await AuthService.findOrCreateGoogleUser({
      googleId: data.id,
      email: data.email,
      fullname: data.name,
      avatar: data.picture,
    });

    // Check if profile is complete (has dateOfBirth)
    const profileComplete = !!user.dateOfBirth;

    // Get player data if available
    let playerData = null;
    if (profileComplete) {
      // Fetch full player data
      const player = await AuthService.getOrCreatePlayerProfile(
        user._id,
        user.fullname
      );
      playerData = {
        token,
        user: user.toJSON ? user.toJSON() : user,
        player: player.toJSON ? player.toJSON() : player,
      };
    }

    // Wrap response to match APIClient wrapper format: { success, data }
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id || user.id,
          email: user.email,
          dateOfBirth: user.dateOfBirth,
        },
        profileComplete,
        playerData: profileComplete ? playerData : null,
      },
    });
  } catch (error) {
    console.error("[GameGoogleAuth] Callback error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Google authentication failed",
    });
  }
};
