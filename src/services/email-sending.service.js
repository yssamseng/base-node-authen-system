/**
 * Email sending service
 * Handles email sending via SMTP or Gmail with HTML templates
 * @module services/email-sending
 */

import nodemailer from 'nodemailer';
import APP_CONFIG from '../config/app-config.js';
import { appLogger } from '../utils/app-logger.util.js';

/**
 * Email service class for sending emails via SMTP or Gmail
 */
class EmailService {
  /**
   * Create email service instance
   * Initializes transporter based on provider configuration
   */
  constructor() {
    this.transporter = null;
    const { provider, from, fromName, frontendUrl } = APP_CONFIG.email;

    this.emailProvider = provider;
    this.fromEmail = from || 'noreply@example.com';
    this.fromName = fromName;
    this.frontendUrl = frontendUrl;
    this.testMode = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on provider
   * @private
   */
  initializeTransporter() {
    try {
      if (this.emailProvider === 'gmail') {
        this.initializeGmailTransporter();
      } else {
        this.initializeSmtpTransporter();
      }
    } catch (error) {
      appLogger.logEmail('initialization_failed', false, { error: error.message, provider: this.emailProvider });
      this.testMode = true;
    }
  }

  /**
   * Initialize Gmail transporter
   * @private
   */
  initializeGmailTransporter() {
    const { gmail } = APP_CONFIG.email;

    // Check for Gmail configuration
    if (!gmail.user || !gmail.appPassword) {
      appLogger.logEmail('gmail_config_missing', false, { provider: 'gmail' });
      this.testMode = true;
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmail.user,
        pass: gmail.appPassword
      }
    });

    this.fromEmail = gmail.user;
    appLogger.logEmail('gmail_configured', true, { provider: 'gmail' });
    this.verifyConnection();
  }

  /**
   * Initialize SMTP transporter
   * @private
   */
  initializeSmtpTransporter() {
    const { smtp, from } = APP_CONFIG.email;

    // Check for SMTP configuration
    if (!smtp.host || !smtp.user || !smtp.pass) {
      appLogger.logEmail('smtp_config_missing', false, { provider: 'smtp' });
      this.testMode = true;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass
      },
      tls: {
        rejectUnauthorized: smtp.rejectUnauthorized
      }
    });

    this.fromEmail = from || smtp.user;
    appLogger.logEmail('smtp_configured', true, { provider: 'smtp' });
    this.verifyConnection();
  }

  /**
   * Verify email connection
   * @private
   */
  verifyConnection() {
    this.transporter.verify((error) => {
      if (error) {
        appLogger.logEmail('connection_failed', false, { error: error.message, provider: this.emailProvider });
        this.testMode = true;
      } else {
        appLogger.logEmail('connection_ready', true, { provider: this.emailProvider });
        this.testMode = false;
      }
    });
  }

  /**
   * Send email with subject and HTML content
   */
  async sendEmail(to, subject, html, text = null) {
    if (this.testMode) {
      appLogger.logEmail('test_mode_skip', true, { to, subject, preview: html.substring(0, 200) });
      return { messageId: 'test-mode-id', testMode: true, provider: this.emailProvider };
    }

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      appLogger.logEmail('sent', true, { provider: this.emailProvider, messageId: result.messageId, to });
      return { ...result, provider: this.emailProvider };
    } catch (error) {
      appLogger.logEmail('send_failed', false, { error: error.message, provider: this.emailProvider, to });
      throw error;
    }
  }

  /**
   * Convert HTML to plain text
   * @private
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(to, verificationToken, userName = null) {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    const subject = 'Verify Your Email Address';
    const html = this.getVerificationEmailTemplate(userName, verificationUrl);

    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to, resetToken, userName = null) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const subject = 'Reset Your Password';
    const html = this.getPasswordResetEmailTemplate(userName, resetUrl);

    return await this.sendEmail(to, subject, html);
  }

  getVerificationEmailTemplate(userName, verificationUrl) {
    const greeting = userName ? `Hi ${userName},` : 'Hello,';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
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
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #0056b3;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
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

          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailTemplate(userName, resetUrl) {
    const greeting = userName ? `Hi ${userName},` : 'Hello,';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
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
            border-bottom: 2px solid #dc3545;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #dc3545;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #c82333;
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

          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get current email provider information
   */
  getProviderInfo() {
    return {
      provider: this.emailProvider,
      fromEmail: this.fromEmail,
      testMode: this.testMode,
      configured: !this.testMode
    };
  }
}

// Create and export singleton instance
const EmailSendingService = new EmailService();
export default EmailSendingService;
