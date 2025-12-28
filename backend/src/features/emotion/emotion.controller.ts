import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const createEmotionSchema = z.object({
  transactionId: z.string().optional(),
  emotionType: z.enum([
    'happy',
    'sad',
    'anxious',
    'excited',
    'neutral',
    'stressed',
  ]),
  intensity: z.number().min(1).max(10).default(5),
  notes: z.string().optional(),
});

export const createEmotion = async (req: AuthRequest, res: Response) => {
  try {
    const data = createEmotionSchema.parse(req.body);

    // If transactionId is provided, verify it belongs to user
    if (data.transactionId) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: data.transactionId,
          userId: req.userId!,
        },
      });

      if (!transaction) {
        throw new AppError('Transaction not found', 404);
      }
    }

    const emotion = await prisma.emotion.create({
      data: {
        ...data,
        userId: req.userId!,
      },
      include: {
        transaction: true,
      },
    });

    res.status(201).json({
      success: true,
      data: emotion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const getEmotions = async (req: AuthRequest, res: Response) => {
  const { emotionType, startDate, endDate } = req.query;

  const where: any = {
    userId: req.userId!,
  };

  if (emotionType) where.emotionType = emotionType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const emotions = await prisma.emotion.findMany({
    where,
    include: {
      transaction: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: emotions,
  });
};

export const getEmotionById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const emotion = await prisma.emotion.findFirst({
    where: {
      id,
      userId: req.userId!,
    },
    include: {
      transaction: true,
    },
  });

  if (!emotion) {
    throw new AppError('Emotion not found', 404);
  }

  res.json({
    success: true,
    data: emotion,
  });
};

export const updateEmotion = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updateSchema = z.object({
    emotionType: z
      .enum(['happy', 'sad', 'anxious', 'excited', 'neutral', 'stressed'])
      .optional(),
    intensity: z.number().min(1).max(10).optional(),
    notes: z.string().optional(),
  });

  try {
    const data = updateSchema.parse(req.body);

    const emotion = await prisma.emotion.updateMany({
      where: {
        id,
        userId: req.userId!,
      },
      data,
    });

    if (emotion.count === 0) {
      throw new AppError('Emotion not found', 404);
    }

    const updatedEmotion = await prisma.emotion.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      data: updatedEmotion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const getEmotionStats = async (req: AuthRequest, res: Response) => {
  const emotions = await prisma.emotion.groupBy({
    by: ['emotionType'],
    where: {
      userId: req.userId!,
    },
    _count: {
      id: true,
    },
    _avg: {
      intensity: true,
    },
  });

  res.json({
    success: true,
    data: emotions,
  });
};

