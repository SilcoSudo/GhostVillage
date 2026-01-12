import nodemailer from "nodemailer";
import { config } from "../config/env.js";

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
  // If using Gmail, you might need to enable "Less secure app access"
  // or use an App Password if 2-Factor Authentication is enabled.
});

// Function to send a verification email
const sendVerificationEmail = async (toEmail, verificationLink) => {
  const imageSrc = `${config.appUrl.replace(/\/+$/, "")}/game_logo.jpg`;

  const mailOptions = {
    from: config.email.from,
    to: toEmail,
    subject: "Welcome to GhostVillage! Please Verify Your Email",
    html: `
    <div style="margin: 0; padding: 0; width: 100%; background-color: #1a1a1a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center" style="padding: 40px 0; background: linear-gradient(135deg, #1a1a1a 0%, #8B0000 100%);">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                        <!-- Logo -->
                        <tr>
                            <td align="center" style="padding: 0 0 30px 0;">
                                <img src="${imageSrc}" alt="GhostVillage Logo" style="width: 150px; height: auto; display: block;">
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td align="center" style="padding: 0 40px 40px 40px;">
                                <h1 style="color: #FFD700; font-size: 24px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">
                                    Welcome to GhostVillage!
                                </h1>
                                <p style="color: #E0E0E0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                                    Thank you for registering. Please click the button below to verify your email address and activate your account.
                                </p>
                                <!-- CTA Button -->
                                <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <a href="${verificationLink}" target="_blank" style="display: inline-block; padding: 12px 35px; background-color: #8B0000; color: #FFD700; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px; border: 2px solid #FFD700; transition: all 0.2s ease;">
                                                Verify Email
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #D4AF37; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                    If you're having trouble with the button, please copy and paste this link into your browser:
                                    <br>
                                    <a href="${verificationLink}" target="_blank" style="color: #FFD700; text-decoration: underline; word-break: break-all;">
                                        ${verificationLink}
                                    </a>
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 30px 0 0 0;">
                                <p style="font-size: 12px; color: #E0E0E0;">
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

export const MailService = {
  sendVerificationEmail,
};

export default MailService;
