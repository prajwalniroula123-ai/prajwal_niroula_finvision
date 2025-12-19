import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';
import axios from 'axios';

const prisma = new PrismaClient();

const initiatePaymentSchema = z.object({
  amount: z.number().positive(),
  walletId: z.string(),
  gateway: z.enum(['esewa', 'khalti']),
  description: z.string().optional(),
});

export const initiatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const data = initiatePaymentSchema.parse(req.body);

    // Verify wallet belongs to user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: data.walletId,
        userId: req.userId!,
      },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // TODO: Integrate with actual eSewa/Khalti APIs
    // This is a placeholder implementation
    const paymentData = {
      amount: data.amount,
      walletId: data.walletId,
      gateway: data.gateway,
      description: data.description,
      userId: req.userId!,
    };

    // In real implementation, call eSewa/Khalti API here
    // const response = await axios.post(`${gatewayUrl}/initiate`, paymentData);

    res.json({
      success: true,
      data: {
        paymentId: `payment_${Date.now()}`,
        ...paymentData,
        message: 'Payment initiated. Redirect to gateway for completion.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const verifySchema = z.object({
    paymentId: z.string(),
    transactionId: z.string(),
    gateway: z.enum(['esewa', 'khalti']),
  });

  try {
    const data = verifySchema.parse(req.body);

    // TODO: Verify payment with eSewa/Khalti API
    // const response = await axios.post(`${gatewayUrl}/verify`, data);

    // For now, simulate successful verification
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: req.userId!,
        walletType: data.gateway,
      },
    });

    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        walletId: wallet.id,
        amount: 0, // Should come from payment verification
        type: 'expense',
        paymentMethod: data.gateway,
        status: 'completed',
        description: 'Payment via ' + data.gateway,
      },
    });

    res.json({
      success: true,
      data: {
        verified: true,
        transaction,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  const { gateway, limit = '20' } = req.query;

  const where: any = {
    userId: req.userId!,
    paymentMethod: gateway as string,
  };

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      wallet: true,
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
  });

  res.json({
    success: true,
    data: transactions,
  });
};

