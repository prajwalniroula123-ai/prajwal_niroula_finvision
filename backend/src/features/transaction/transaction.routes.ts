import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from './transaction.controller';

export const transactionRoutes = Router();

transactionRoutes.use(authenticate);

transactionRoutes.post('/', createTransaction);
transactionRoutes.get('/', getTransactions);
transactionRoutes.get('/stats', getTransactionStats);
transactionRoutes.get('/:id', getTransactionById);
transactionRoutes.put('/:id', updateTransaction);
transactionRoutes.delete('/:id', deleteTransaction);

