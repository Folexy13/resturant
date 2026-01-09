import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { EmailService } from '../services/EmailService';
import { UserRole } from '../entities/User';
import { AppError } from '../utils/AppError';

export class AuthController {
  private authService: AuthService;
  private emailService: EmailService;

  constructor() {
    this.authService = new AuthService();
    this.emailService = new EmailService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password, phone, role } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError('Invalid email format', 400);
      }

      // Validate password strength
      if (password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      // Only allow customer role for self-registration
      const allowedRole = role === UserRole.CUSTOMER ? UserRole.CUSTOMER : UserRole.CUSTOMER;

      const result = await this.authService.register({
        name,
        email,
        password,
        phone,
        role: allowedRole,
      });

      // Send welcome email
      await this.emailService.sendWelcomeEmail(name, email);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const result = await this.authService.login({ email, password });

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      await this.authService.logout(req.user.userId);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const user = await this.authService.getUserById(req.user.userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { name, phone } = req.body;

      const user = await this.authService.updateUser(req.user.userId, { name, phone });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters long', 400);
      }

      await this.authService.changePassword(req.user.userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoints
  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.authService.getAllUsers(page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { userId } = req.params;
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        throw new AppError('Invalid role', 400);
      }

      const user = await this.authService.updateUserRole(userId, role, req.user.userId);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };

  deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { userId } = req.params;

      await this.authService.deactivateUser(userId, req.user.userId);

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Staff registration (admin only)
  registerStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, password, phone, role, restaurantId } = req.body;

      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400);
      }

      // Validate role is staff, manager, or admin
      if (![UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN].includes(role)) {
        throw new AppError('Invalid role for staff registration', 400);
      }

      const result = await this.authService.register({
        name,
        email,
        password,
        phone,
        role,
        restaurantId,
      });

      res.status(201).json({
        success: true,
        message: 'Staff member registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}