/**
 * Email template utilities
 * Provides HTML templates for transactional emails
 * @module templates/email
 */

/**
 * Get common email styles
 * @returns {string} CSS styles for email templates
 */
const getEmailStyles = () => `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f4f4f4;
  }
  .container {
    background-color: white;
    border-radius: 10px;
    padding: 30px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  .header {
    text-align: center;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  .button {
    display: inline-block;
    padding: 12px 24px;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    margin: 20px 0;
  }
  .button:hover {
    opacity: 0.9;
  }
  .warning {
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 15px;
    border-radius: 5px;
    margin: 20px 0;
  }
  .footer {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    font-size: 12px;
    color: #666;
    text-align: center;
  }
`;

/**
 * Get common email footer
 * @param {string} fromName - Application name
 * @returns {string} HTML footer
 */
const getEmailFooter = (fromName) => `
  <div class="footer">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
  </div>
`;

/**
 * Get email verification template
 * @param {string|null} userName - User's display name
 * @param {string} verificationUrl - Email verification URL
 * @returns {string} HTML email content
 */
export const getVerificationEmailTemplate = (userName, verificationUrl) => {
  const greeting = userName ? `Hi ${userName},` : 'Hello,';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        ${getEmailStyles()}
        .header {
          border-bottom: 2px solid #007bff;
        }
        .button {
          background-color: #007bff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email Address</h1>
        </div>

        <p>${greeting}</p>
        <p>Thank you for registering! To complete your registration and activate your account, please verify your email address by clicking the button below:</p>

        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${verificationUrl}</p>

        <p><strong>Important:</strong></p>
        <ul>
          <li>This verification link will expire in <strong>24 hours</strong>.</li>
          <li>If you didn't create an account, you can safely ignore this email.</li>
        </ul>

        ${getEmailFooter('{{APP_NAME}}')}
      </div>
    </body>
    </html>
  `;
};

/**
 * Get password reset template
 * @param {string|null} userName - User's display name
 * @param {string} resetUrl - Password reset URL
 * @returns {string} HTML email content
 */
export const getPasswordResetEmailTemplate = (userName, resetUrl) => {
  const greeting = userName ? `Hi ${userName},` : 'Hello,';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        ${getEmailStyles()}
        .header {
          border-bottom: 2px solid #dc3545;
        }
        .button {
          background-color: #dc3545;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>

        <p>${greeting}</p>
        <p>We received a request to reset your password. If you made this request, click the button below to reset your password:</p>

        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${resetUrl}</p>

        <div class="warning">
          <strong>Security Notice:</strong>
          <ul>
            <li>This reset link will expire in <strong>1 hour</strong>.</li>
            <li>If you didn't request this password reset, please ignore this email.</li>
            <li>Never share this link with anyone.</li>
          </ul>
        </div>

        ${getEmailFooter('{{APP_NAME}}')}
      </div>
    </body>
    </html>
  `;
};
