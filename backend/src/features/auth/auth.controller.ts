import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';
import { emailService } from '../../services/email.service';
import { otpService } from '../../services/otp.service';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

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

    // Generate OTP
    const otp = otpService.createOTP();

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with OTP
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        otpCode: otp.code,
        otpExpiresAt: otp.expiresAt,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    // Send OTP email
    try {
      await emailService.sendOTPEmail(data.email, otp.code);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      data: { user },
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
      { userId: user.id, email: user.email, role: user.role },
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
          role: user.role,
          isEmailVerified: user.isEmailVerified,
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
      role: true,
      isEmailVerified: true,
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
        role: true,
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

const verifyEmailSchema = z.object({
  email: z.string().email(),
  otpCode: z.string().min(5).max(6),
});

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = verifyEmailSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email already verified', 400);
    }

    // Validate OTP
    const isValidOTP = otpService.validateOTP(user.otpCode, user.otpExpiresAt, otpCode);

    if (!isValidOTP) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    // Update user as verified and clear OTP
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isEmailVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: { user: updatedUser, token },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

const resendOtpSchema = z.object({
  email: z.string().email(),
});

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = resendOtpSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email already verified', 400);
    }

    // Generate new OTP
    const otp = otpService.createOTP();

    // Update user with new OTP
    await prisma.user.update({
      where: { email },
      data: {
        otpCode: otp.code,
        otpExpiresAt: otp.expiresAt,
      },
    });

    // Send OTP email
    try {
      await emailService.sendOTPEmail(email, otp.code);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      throw new AppError('Failed to send verification email', 500);
    }

    res.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

