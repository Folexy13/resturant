import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRole } from '../entities/User';
import { AppError } from '../utils/AppError';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

const authService = new AuthService();

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = await authService.verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to optionally authenticate (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await authService.verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch {
    // Token invalid, but continue without user
    next();
  }
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Middleware to require manager or admin role
 */
export const requireManager = requireRole(UserRole.MANAGER, UserRole.ADMIN);

/**
 * Middleware to require staff, manager, or admin role
 */
export const requireStaff = requireRole(UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN);

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnerOrAdmin = (getUserIdFromRequest: (req: Request) => string | undefined) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const resourceUserId = getUserIdFromRequest(req);

    if (req.user.role === UserRole.ADMIN || req.user.userId === resourceUserId) {
      return next();
    }

    return next(new AppError('Insufficient permissions', 403));
  };
};