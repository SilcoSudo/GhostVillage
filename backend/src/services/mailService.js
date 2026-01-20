import nodemailer from "nodemailer";
import { config } from "../config/env.js";

const { email } = config;

// Build transporter options so Gmail (service) and custom SMTP both work
const transporter = nodemailer.createTransport({
  service: email.service,
  host: email.host,
  port: email.port,
  secure: email.secure,
  auth: {
    user: email.auth.user,
    pass: email.auth.pass,
  },
});

// Function to send a verification email
const sendVerificationEmail = async (toEmail, verificationLink) => {
  const imageSrc = `${config.appUrl.replace(/\/+$/, "")}/game_logo.jpg`;

  const mailOptions = {
    from: config.email.from,
    to: toEmail,
    subject: "Welcome to GhostVillage! Please Verify Your Email",
    html: `
    <div style="margin: 0; padding: 0; width: 100%; background-color: #0D0D0D; font-family: 'Courier New', Courier, monospace;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #121212 0%, #520000 100%);">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                        <!-- Logo -->
                        <tr>
                            <td align="center" style="padding: 0 0 30px 0;">
                                <img src="${imageSrc}" alt="GhostVillage Logo" style="width: 150px; height: auto; display: block; filter: sepia(0.5) contrast(1.2);">
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td align="center" style="padding: 0 40px 40px 40px;">
                                <h1 style="color: #B5A642; font-size: 26px; margin: 0 0 20px 0; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 2px;">
                                    Welcome to GhostVillage!
                                </h1>
                                <p style="color: #B5A642; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                                    Thank you for registering. Please click the button below to verify your email address and activate your account.
                                </p>
                                <!-- CTA Button -->
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #520000 0%, #990000 100%); color: #B5A642; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 4px; border: 2px solid #B5A642; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                                                Verify Email
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #B5A642; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                    If you're having trouble with the button, please copy and paste this link into your browser:
                                    <br>
                                    <a href="${verificationLink}" target="_blank" style="color: #B5A642; text-decoration: underline; word-break: break-all;">
                                        ${verificationLink}
                                    </a>
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 30px 0 0 0;">
                                <p style="font-size: 11px; color: #B5A642; text-transform: uppercase; letter-spacing: 1px;">
                                    If you did not create an account with GhostVillage, please ignore this email.
                                    <br><br>
                                    &copy; ${new Date().getFullYear()} GhostVillage. All Rights Reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending verification email to ${toEmail}:`, error);
    // Rethrow or handle error as needed
    throw new Error("Failed to send verification email.");
  }
};

// Function to send a reset password email
const sendResetPasswordEmail = async (toEmail, resetLink) => {
  const imageSrc = `${config.appUrl.replace(/\/+$/, "")}/game_logo.jpg`;

  const mailOptions = {
    from: config.email.from,
    to: toEmail,
    subject: "Reset Your GhostVillage Password",
    html: `
    <div style="margin: 0; padding: 0; width: 100%; background-color: #0D0D0D; font-family: 'Courier New', Courier, monospace;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #121212 0%, #520000 100%);">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                        <!-- Logo -->
                        <tr>
                            <td align="center" style="padding: 0 0 30px 0;">
                                <img src="${imageSrc}" alt="GhostVillage Logo" style="width: 150px; height: auto; display: block; filter: sepia(0.5) contrast(1.2);">
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td align="center" style="padding: 0 40px 40px 40px;">
                                <h1 style="color: #B5A642; font-size: 26px; margin: 0 0 20px 0; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 2px;">
                                    Reset Password
                                </h1>
                                <p style="color: #B5A642; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                                    We received a request to reset your password. Click the button below to set a new password.
                                </p>
                                <!-- CTA Button -->
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #520000 0%, #990000 100%); color: #B5A642; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 4px; border: 2px solid #B5A642; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #B5A642; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                    If you did not request a password reset, please ignore this email.
                                    <br><br>
                                    This link will expire in 10 minutes.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 30px 0 0 0;">
                                <p style="font-size: 11px; color: #B5A642; text-transform: uppercase; letter-spacing: 1px;">
                                    &copy; ${new Date().getFullYear()} GhostVillage. All Rights Reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Reset password email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending reset password email to ${toEmail}:`, error);
    throw new Error("Failed to send reset password email.");
  }
};

export const MailService = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};

export default MailService;
