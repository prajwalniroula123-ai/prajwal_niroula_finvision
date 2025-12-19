import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { userId: string; email: string; isAdmin: boolean };

    req.userId = decoded.userId;
    req.user = decoded;

    next();
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isAdmin) {
    throw new AppError('Admin access required', 403);
  }
  next();
};

