import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';
// import OpenAI from 'openai'; // Uncomment when OpenAI API key is available

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const sendMessageSchema = z.object({
  message: z.string().min(1),
});

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = sendMessageSchema.parse(req.body);

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        userId: req.userId!,
        message,
        isFromUser: true,
      },
    });

    // TODO: Integrate with OpenAI API for AI chatbot responses
    // For now, return a placeholder response
    const aiResponse = `I understand you're asking: "${message}". As your financial assistant, I can help you with:
    - Analyzing your spending patterns
    - Providing savings recommendations
    - Explaining financial concepts
    - Setting financial goals
    
    Please note: Full AI integration is pending OpenAI API setup.`;

    // In production, use OpenAI:
    // const completion = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo",
    //   messages: [
    //     {
    //       role: "system",
    //       content: "You are a helpful financial assistant for FinVision. Provide concise, actionable financial advice."
    //     },
    //     { role: "user", content: message }
    //   ],
    // });
    // const aiResponse = completion.choices[0].message.content;

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        userId: req.userId!,
        message: aiResponse,
        isFromUser: false,
      },
    });

    res.json({
      success: true,
      data: {
        userMessage,
        aiMessage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(error.errors[0].message, 400);
    }
    throw error;
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  const { limit = '50' } = req.query;

  const messages = await prisma.chatMessage.findMany({
    where: {
      userId: req.userId!,
    },
    orderBy: { createdAt: 'asc' },
    take: parseInt(limit as string),
  });

  res.json({
    success: true,
    data: messages,
  });
};

export const clearChatHistory = async (req: AuthRequest, res: Response) => {
  await prisma.chatMessage.deleteMany({
    where: {
      userId: req.userId!,
    },
  });

  res.json({
    success: true,
    message: 'Chat history cleared successfully',
  });
};

