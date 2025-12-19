import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './features/auth/auth.routes';
import { walletRoutes } from './features/wallet/wallet.routes';
import { transactionRoutes } from './features/transaction/transaction.routes';
import { emotionRoutes } from './features/emotion/emotion.routes';
import { aiInsightRoutes } from './features/ai-insight/ai-insight.routes';
import { gamificationRoutes } from './features/gamification/gamification.routes';
import { paymentRoutes } from './features/payment/payment.routes';
import { chatRoutes } from './features/chat/chat.routes';

dotenv.config();

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
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/ai-insights', aiInsightRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

