import express from 'express';
const router = express.Router();
import * as userProfileController from '../controllers/user-profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateUpdateProfile } from '../validators/user-profile.validator.js';

// Protected user profile routes
router.get('/profile', authenticate, userProfileController.getProfile);
router.put('/profile', authenticate, validateUpdateProfile, userProfileController.updateProfile);

export default router;