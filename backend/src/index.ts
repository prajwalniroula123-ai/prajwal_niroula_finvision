import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './features/auth/auth.routes';
import { adminRoutes } from './features/admin/admin.routes';
import { walletRoutes } from './features/wallet/wallet.routes';
import { transactionRoutes } from './features/transaction/transaction.routes';
import { emotionRoutes } from './features/emotion/emotion.routes';
import { aiInsightRoutes } from './features/ai-insight/ai-insight.routes';
import { gamificationRoutes } from './features/gamification/gamification.routes';
import { paymentRoutes } from './features/payment/payment.routes';
import { chatRoutes } from './features/chat/chat.routes';
import { seedDatabase } from './seed';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'FinVision API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/ai-insights', aiInsightRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('🔌 Connected to MongoDB Atlas');

  // Seed database on server startup
  await seedDatabase();
});

