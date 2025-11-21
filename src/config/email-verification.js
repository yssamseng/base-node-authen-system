// Email verification configuration
const emailVerificationConfig = {
  // Enable/disable email verification feature
  enabled: process.env.EMAIL_VERIFICATION_ENABLED === 'true',

  // Email verification settings
  settings: {
    // Token expiration time in hours
    tokenExpirationHours: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS) || 24,

    // Allow login without email verification
    allowUnverifiedLogin: process.env.ALLOW_UNVERIFIED_LOGIN === 'true',

    // Resend verification email cooldown in minutes
    resendCooldownMinutes: parseInt(process.env.VERIFICATION_RESEND_COOLDOWN) || 5,

    // Maximum verification attempts
    maxVerificationAttempts: parseInt(process.env.MAX_VERIFICATION_ATTEMPTS) || 3,

    // Require email verification for certain features
    requireVerificationFor: {
      login: process.env.REQUIRE_EMAIL_VERIFICATION_FOR_LOGIN === 'true',
      profileUpdate: process.env.REQUIRE_EMAIL_VERIFICATION_FOR_PROFILE === 'true',
      sensitiveActions: process.env.REQUIRE_EMAIL_VERIFICATION_FOR_SENSITIVE === 'true'
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

export default emailVerificationConfig;