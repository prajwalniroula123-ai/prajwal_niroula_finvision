import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const createTransactionSchema = z.object({
  walletId: z.string(),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().optional(),
  description: z.string().optional(),
  paymentMethod: z.enum(['esewa', 'khalti', 'cash', 'card']).optional(),
  transactionDate: z.string().datetime().optional(),
});

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const data = createTransactionSchema.parse(req.body);

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

    // Update wallet balance
    const balanceChange = data.type === 'income' ? data.amount : -data.amount;
    const newBalance = Number(wallet.balance) + balanceChange;

    if (newBalance < 0 && data.type !== 'income') {
      throw new AppError('Insufficient balance', 400);
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          amount: data.amount,
          userId: req.userId!,
          transactionDate: data.transactionDate
            ? new Date(data.transactionDate)
            : new Date(),
        },
      });

      await tx.wallet.update({
        where: { id: data.walletId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  const { type, category, startDate, endDate, limit = '50', offset = '0' } = req.query;

  const where: any = {
    userId: req.userId!,
  };

  if (type) where.type = type;
  if (category) where.category = category;
  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.gte = new Date(startDate as string);
    if (endDate) where.transactionDate.lte = new Date(endDate as string);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      wallet: true,
      emotion: true,
      aiInsight: true,
    },
    orderBy: { transactionDate: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });

  res.json({
    success: true,
    data: transactions,
  });
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId: req.userId!,
    },
    include: {
      wallet: true,
      emotion: true,
      aiInsight: true,
    },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  res.json({
    success: true,
    data: transaction,
  });
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = z.object({
    category: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'completed', 'failed']).optional(),
  });

  try {
    const data = updateSchema.parse(req.body);

    const transaction = await prisma.transaction.updateMany({
      where: {
        id,
        userId: req.userId!,
      },
      data,
    });

    if (transaction.count === 0) {
      throw new AppError('Transaction not found', 404);
    }

    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      data: updatedTransaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId: req.userId!,
    },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  // Reverse wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { id: transaction.walletId },
  });

  if (wallet) {
    const balanceChange =
      transaction.type === 'income' ? -transaction.amount : transaction.amount;
    const newBalance = Number(wallet.balance) + balanceChange;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: { id },
      });

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: newBalance },
      });
    });
  }

  res.json({
    success: true,
    message: 'Transaction deleted successfully',
  });
};

export const getTransactionStats = async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  const where: any = {
    userId: req.userId!,
  };

  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.gte = new Date(startDate as string);
    if (endDate) where.transactionDate.lte = new Date(endDate as string);
  }

  const [totalIncome, totalExpense, transactions] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, type: 'income' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: 'expense' },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { ...where, type: 'expense' },
      _sum: { amount: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalIncome: totalIncome._sum.amount || 0,
      totalExpense: totalExpense._sum.amount || 0,
      netBalance:
        (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
      categoryBreakdown: transactions,
    },
  });
};

