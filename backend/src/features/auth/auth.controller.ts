import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: false },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          isAdmin: user.isAdmin,
        },
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      avatar: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
  });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const updateSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phoneNumber: z.string().optional(),
    avatar: z.string().url().optional(),
  });

  try {
    const data = updateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        isAdmin: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

