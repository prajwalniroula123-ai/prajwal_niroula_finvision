import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export const getInsights = async (req: AuthRequest, res: Response) => {
  const { insightType, limit = '10' } = req.query;

  const where: any = {
    userId: req.userId!,
  };

  if (insightType) where.insightType = insightType;

  const insights = await prisma.aIInsight.findMany({
    where,
    include: {
      transaction: true,
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string),
  });

  res.json({
    success: true,
    data: insights,
  });
};

export const getInsightById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const insight = await prisma.aIInsight.findFirst({
    where: {
      id,
      userId: req.userId!,
    },
    include: {
      transaction: true,
    },
  });

  if (!insight) {
    throw new AppError('Insight not found', 404);
  }

  res.json({
    success: true,
    data: insight,
  });
};

export const generateInsight = async (req: AuthRequest, res: Response) => {
  // TODO: Implement AI insight generation using OpenAI API or TensorFlow.js
  // This is a placeholder that analyzes recent transactions

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId: req.userId!,
    },
    include: {
      emotion: true,
    },
    orderBy: { transactionDate: 'desc' },
    take: 10,
  });

  // Simple analysis (replace with actual AI)
  const totalExpense = recentTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const avgEmotionIntensity =
    recentTransactions
      .filter((t) => t.emotion)
      .reduce((sum, t) => sum + (t.emotion?.intensity || 0), 0) /
    recentTransactions.filter((t) => t.emotion).length || 0;

  let insightType = 'recommendation';
  let title = 'Spending Analysis';
  let description = `You've spent ${totalExpense} in recent transactions. `;

  if (avgEmotionIntensity > 7) {
    description +=
      'Your emotional spending intensity is high. Consider tracking emotions before making purchases.';
    insightType = 'warning';
  } else {
    description += 'Keep up the good work with mindful spending!';
  }

  const insight = await prisma.aIInsight.create({
    data: {
      userId: req.userId!,
      insightType,
      title,
      description,
      confidence: 0.75,
    },
  });

  res.json({
    success: true,
    data: insight,
    message: 'Insight generated successfully',
  });
};

