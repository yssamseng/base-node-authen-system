/**
 * Email sending service
 * Handles email sending via SMTP or Gmail with HTML templates
 * @module services/email-sending
 */

import nodemailer from 'nodemailer';
import APP_CONFIG from '../config/app-config.js';
import { appLogger } from '../utils/app-logger.util.js';
import { getVerificationEmailTemplate, getPasswordResetEmailTemplate } from '../templates/email.template.js';

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
    const html = getVerificationEmailTemplate(userName, verificationUrl).replace('{{APP_NAME}}', this.fromName);
    return await this.sendEmail(to, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to, resetToken, userName = null) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password';
    const html = getPasswordResetEmailTemplate(userName, resetUrl).replace('{{APP_NAME}}', this.fromName);
    return await this.sendEmail(to, subject, html);
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
