/**
 * User utility functions
 * Provides helper functions for user-related operations
 * @module utils/user
 */

/**
 * Find user with auth data
 * Common query pattern used across multiple services
 * @param {Object} User - User model
 * @param {Object} UserAuth - UserAuth model
 * @param {Object} criteria - Search criteria (email, userId, etc.)
 * @param {string} criteriaField - Field name for criteria (default: 'criteria')
 * @returns {Promise<Object|null>} User with auth data or null
 */
export const findUserWithAuth = async (User, UserAuth, criteria) => {
  // Dynamic import to avoid circular dependency
  const { findOne } = await import('../utils/db.util.js');

  return findOne(User, {
    criteria,
    include: [{
      model: UserAuth,
      as: 'auth'
    }]
  });
};

/**
 * Get display name from user
 * @param {Object} user - User object with firstName and lastName
 * @param {string} fallback - Fallback name (default: username)
 * @returns {string} Display name
 */
export const getDisplayName = (user, fallback = null) => {
  if (!user) return '';
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || fallback || user.username || '';
};
