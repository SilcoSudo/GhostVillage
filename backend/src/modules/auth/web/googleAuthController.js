import { google } from "googleapis";
import AuthService from "../authService.js";
import { config } from "../../../config/env.js";

const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri,
);

/**
 * Get Google OAuth URL
 * GET /api/web/auth/google
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

    return res.status(200).json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error("Get Google Auth URL error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Google auth URL",
    });
  }
};

/**
 * Handle Google OAuth Callback
 * GET /api/web/auth/google/callback
 */
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${config.frontendUrl}/login?error=no_code`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Find or create user
    const { token, user } = await AuthService.findOrCreateGoogleUser({
      googleId: data.id,
      email: data.email,
      fullname: data.name,
      avatar: data.picture,
    });

    // Check if user needs to complete profile (no dateOfBirth)
    if (!user.dateOfBirth) {
      return res.redirect(
        `${config.frontendUrl}/complete-profile?token=${token}`,
      );
    }

    // Redirect to frontend with token
    return res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error("Google Callback error:", error);
    return res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
  }
};
