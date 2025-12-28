import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const createWalletSchema = z.object({
  walletType: z.enum(['esewa', 'khalti', 'internal']),
  walletNumber: z.string().optional(),
  currency: z.string().default('NPR'),
});

export const createWallet = async (req: AuthRequest, res: Response) => {
  try {
    const data = createWalletSchema.parse(req.body);

    const wallet = await prisma.wallet.create({
      data: {
        ...data,
        userId: req.userId!,
      },
    });

    res.status(201).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const getUserWallets = async (req: AuthRequest, res: Response) => {
  const wallets = await prisma.wallet.findMany({
    where: {
      userId: req.userId!,
      isActive: true,
    },
    include: {
      transactions: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  res.json({
    success: true,
    data: wallets,
  });
};

export const getWalletById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const wallet = await prisma.wallet.findFirst({
    where: {
      id,
      userId: req.userId!,
    },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }

  res.json({
    success: true,
    data: wallet,
  });
};

export const updateWallet = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = z.object({
    walletNumber: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  try {
    const data = updateSchema.parse(req.body);

    const wallet = await prisma.wallet.updateMany({
      where: {
        id,
        userId: req.userId!,
      },
      data,
    });

    if (wallet.count === 0) {
      throw new AppError('Wallet not found', 404);
    }

    const updatedWallet = await prisma.wallet.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      data: updatedWallet,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const deleteWallet = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const wallet = await prisma.wallet.updateMany({
    where: {
      id,
      userId: req.userId!,
    },
    data: {
      isActive: false,
    },
  });

  if (wallet.count === 0) {
    throw new AppError('Wallet not found', 404);
  }

  res.json({
    success: true,
    message: 'Wallet deactivated successfully',
  });
};

