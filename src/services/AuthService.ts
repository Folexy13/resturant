import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/User';
import { AppDataSource } from '../config/database';
import { AppError } from '../utils/AppError';
import config from '../config';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  restaurantId?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  private userRepository: Repository<User>;
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.jwtSecret = config.jwtSecret || 'your-super-secret-jwt-key-change-in-production';
    this.jwtRefreshSecret = config.jwtRefreshSecret || 'your-super-secret-refresh-key-change-in-production';
    this.accessTokenExpiry = config.jwtExpiresIn || '15m';
    this.refreshTokenExpiry = config.jwtRefreshExpiresIn || '7d';
  }

  async register(data: RegisterData): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Create new user
    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: data.role || UserRole.CUSTOMER,
      restaurantId: data.restaurantId,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  async login(data: LoginData): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
    // Find user with password
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: data.email })
      .getOne();

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLoginAt = new Date();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await this.userRepository.save(user);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: undefined });
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as TokenPayload;

      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 403);
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Save new refresh token
      user.refreshToken = tokens.refreshToken;
      await this.userRepository.save(user);

      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return payload;
    } catch {
      throw new AppError('Invalid or expired access token', 401);
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Don't allow updating sensitive fields directly
    delete data.password;
    delete data.refreshToken;
    delete data.role;

    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await this.userRepository.save(user);
  }

  async updateUserRole(userId: string, role: UserRole, adminId: string): Promise<User> {
    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    if (!admin || !admin.isAdmin()) {
      throw new AppError('Only admins can update user roles', 403);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.role = role;
    return this.userRepository.save(user);
  }

  async deactivateUser(userId: string, adminId: string): Promise<void> {
    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    if (!admin || !admin.isAdmin()) {
      throw new AppError('Only admins can deactivate users', 403);
    }

    await this.userRepository.update(userId, { isActive: false, refreshToken: undefined });
  }

  async getAllUsers(page: number = 1, limit: number = 20): Promise<{ users: Partial<User>[]; total: number; pages: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users: users.map(u => u.toJSON()),
      total,
      pages: Math.ceil(total / limit),
    };
  }

  private generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry,
    } as jwt.SignOptions);

    // Parse expiry time to seconds
    const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}