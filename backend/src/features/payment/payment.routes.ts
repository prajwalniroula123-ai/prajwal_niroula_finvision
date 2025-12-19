import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  initiatePayment,
  verifyPayment,
  getPaymentHistory,
} from './payment.controller';

export const paymentRoutes = Router();

paymentRoutes.use(authenticate);

paymentRoutes.post('/initiate', initiatePayment);
paymentRoutes.post('/verify', verifyPayment);
paymentRoutes.get('/history', getPaymentHistory);

