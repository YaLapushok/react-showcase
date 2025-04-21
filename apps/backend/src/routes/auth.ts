import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

// POST /api/auth/register
router.post('/register', authController.register);

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', authController.verifyEmail);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password/:token
// router.post('/reset-password/:token', authController.resetPassword);

export default router; 