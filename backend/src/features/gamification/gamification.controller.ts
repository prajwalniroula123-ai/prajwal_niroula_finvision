import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export const getRewards = async (req: AuthRequest, res: Response) => {
  const rewards = await prisma.reward.findMany({
    where: {
      userId: req.userId!,
    },
    orderBy: { earnedAt: 'desc' },
  });

  res.json({
    success: true,
    data: rewards,
  });
};

export const getAchievements = async (req: AuthRequest, res: Response) => {
  const achievements = await prisma.achievement.findMany({
    where: {
      userId: req.userId!,
    },
    orderBy: { unlockedAt: 'desc' },
  });

  res.json({
    success: true,
    data: achievements,
  });
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  const [totalRewards, totalPoints, achievements] = await Promise.all([
    prisma.reward.count({
      where: { userId: req.userId! },
    }),
    prisma.reward.aggregate({
      where: { userId: req.userId! },
      _sum: { points: true },
    }),
    prisma.achievement.count({
      where: { userId: req.userId! },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalRewards,
      totalPoints: totalPoints._sum.points || 0,
      totalAchievements: achievements,
    },
  });
};

export const checkAndAwardAchievements = async (
  req: AuthRequest,
  res: Response
) => {
  // Check for various achievement conditions
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: {
      transactions: true,
      wallets: true,
      achievements: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const newAchievements = [];

  // Check savings milestone
  const totalSavings = user.wallets.reduce(
    (sum, w) => sum + Number(w.balance),
    0
  );
  if (totalSavings >= 10000) {
    const exists = user.achievements.some(
      (a) => a.achievementType === 'savings_milestone_10k'
    );
    if (!exists) {
      const achievement = await prisma.achievement.create({
        data: {
          userId: req.userId!,
          achievementType: 'savings_milestone_10k',
          title: 'Savings Champion',
          description: 'Reached 10,000 in total savings',
          icon: '💰',
        },
      });
      newAchievements.push(achievement);
    }
  }

  // Check transaction streak (simplified)
  const transactionCount = user.transactions.length;
  if (transactionCount >= 50) {
    const exists = user.achievements.some(
      (a) => a.achievementType === 'transaction_master'
    );
    if (!exists) {
      const achievement = await prisma.achievement.create({
        data: {
          userId: req.userId!,
          achievementType: 'transaction_master',
          title: 'Transaction Master',
          description: 'Completed 50 transactions',
          icon: '📊',
        },
      });
      newAchievements.push(achievement);
    }
  }

  res.json({
    success: true,
    data: {
      newAchievements,
      message:
        newAchievements.length > 0
          ? 'New achievements unlocked!'
          : 'No new achievements',
    },
  });
};

