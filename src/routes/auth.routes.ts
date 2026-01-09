import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// Public routes (with rate limiting)
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh-token', authLimiter, authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

// Admin routes
router.get('/users', authenticate, requireAdmin, authController.getAllUsers);
router.post('/users/staff', authenticate, requireAdmin, authController.registerStaff);
router.put('/users/:userId/role', authenticate, requireAdmin, authController.updateUserRole);
router.delete('/users/:userId', authenticate, requireAdmin, authController.deactivateUser);

export default router;