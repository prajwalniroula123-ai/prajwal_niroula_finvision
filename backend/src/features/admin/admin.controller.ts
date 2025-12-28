import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// Get all users with pagination, filtering, search
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    limit = '10',
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }

  // Get users with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            wallets: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
};

// Get detailed user information including transactions
export const getUserById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      avatar: true,
      role: true,
      isEmailVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          transactions: true,
          wallets: true,
          emotions: true,
          rewards: true,
        },
      },
      wallets: {
        select: {
          id: true,
          balance: true,
          currency: true,
          walletType: true,
          isActive: true,
        },
      },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          type: true,
          category: true,
          description: true,
          status: true,
          transactionDate: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user,
  });
};

// Get user's financial statistics
export const getUserStats = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Get transaction statistics
  const [totalIncome, totalExpense, transactionCount, walletStats] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: id, type: 'income' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: id, type: 'expense' },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { userId: id },
    }),
    prisma.wallet.aggregate({
      where: { userId: id },
      _sum: { balance: true },
    }),
  ]);

  const stats = {
    totalBalance: walletStats._sum.balance || 0,
    totalIncome: totalIncome._sum.amount || 0,
    totalExpense: totalExpense._sum.amount || 0,
    netBalance: (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
    transactionCount,
  };

  res.json({
    success: true,
    data: stats,
  });
};

// Get platform-wide statistics
export const getPlatformStats = async (req: AuthRequest, res: Response) => {
  const [userStats, transactionStats, walletStats] = await Promise.all([
    prisma.user.aggregate({
      _count: { id: true },
      where: { isActive: true },
    }),
    prisma.transaction.aggregate({
      _count: { id: true },
      _sum: { amount: true },
      where: { status: 'completed' },
    }),
    prisma.wallet.aggregate({
      _sum: { balance: true },
    }),
  ]);

  // Get recent registrations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentRegistrations = await prisma.user.count({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // Get monthly transaction volume (current month)
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyTransactions = await prisma.transaction.count({
    where: {
      createdAt: { gte: currentMonth },
      status: 'completed',
    },
  });

  res.json({
    success: true,
    data: {
      totalUsers: userStats._count.id,
      totalTransactions: transactionStats._count.id,
      totalTransactionVolume: transactionStats._sum.amount || 0,
      totalWalletBalance: walletStats._sum.balance || 0,
      recentRegistrations,
      monthlyTransactions,
      activeUsers: userStats._count.id, // Assuming all active users are counted
    },
  });
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = z.object({
    isActive: z.boolean(),
  });

  try {
    const { isActive } = updateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0].message,
      });
    }
    throw error;
  }
};

// Delete user (soft delete by setting inactive)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Soft delete by deactivating
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
};
