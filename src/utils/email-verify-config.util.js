/**
 * Email verification configuration utility
 * Provides centralized access to email verification settings
 * @module utils/email-verify-config
 */

import APP_CONFIG from '../config/app-config.js';

const { enabled, expiryHours, allowUnverifiedLogin, resendCooldownMinutes, maxAttempts, requireForLogin, requireForProfile, requireForSensitive } = APP_CONFIG.emailVerification;

// Email verification configuration object with helper methods
const emailVerifyConfig = {
  // Enable/disable email verification feature
  enabled,

  // Email verification settings
  settings: {
    // Token expiration time in hours
    tokenExpirationHours: expiryHours,

    // Allow login without email verification
    allowUnverifiedLogin,

    // Resend verification email cooldown in minutes
    resendCooldownMinutes,

    // Maximum verification attempts
    maxVerificationAttempts: maxAttempts,

    // Require email verification for certain features
    requireVerificationFor: {
      login: requireForLogin,
      profileUpdate: requireForProfile,
      sensitiveActions: requireForSensitive
    }
  },

  // Get current status
  isEnabled() {
    return this.enabled;
  },

  // Check if login requires email verification
  isLoginVerificationRequired() {
    return this.enabled && this.settings.requireVerificationFor.login;
  },

  // Get token expiration in hours
  getTokenExpirationHours() {
    return this.settings.tokenExpirationHours;
  },

  // Check if unverified login is allowed
  isUnverifiedLoginAllowed() {
    return !this.enabled || this.settings.allowUnverifiedLogin;
  },

  // Get resend cooldown in milliseconds
  getResendCooldownMs() {
    return this.settings.resendCooldownMinutes * 60 * 1000;
  },

  // Get maximum verification attempts
  getMaxVerificationAttempts() {
    return this.settings.maxVerificationAttempts;
  },

  // Check if verification is required for profile update
  isProfileVerificationRequired() {
    return this.enabled && this.settings.requireVerificationFor.profileUpdate;
  },

  // Check if verification is required for sensitive actions
  isSensitiveActionVerificationRequired() {
    return this.enabled && this.settings.requireVerificationFor.sensitiveActions;
  },

  // Get configuration summary
  getConfigSummary() {
    return {
      enabled: this.enabled,
      loginRequired: this.isLoginVerificationRequired(),
      unverifiedLoginAllowed: this.isUnverifiedLoginAllowed(),
      tokenExpirationHours: this.getTokenExpirationHours(),
      resendCooldownMinutes: this.settings.resendCooldownMinutes,
      maxVerificationAttempts: this.getMaxVerificationAttempts(),
      requireForProfile: this.isProfileVerificationRequired(),
      requireForSensitive: this.isSensitiveActionVerificationRequired()
    };
  }
};

export default emailVerifyConfig;
