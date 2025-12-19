import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createWallet,
  getUserWallets,
  getWalletById,
  updateWallet,
  deleteWallet,
} from './wallet.controller';

export const walletRoutes = Router();

walletRoutes.use(authenticate);

walletRoutes.post('/', createWallet);
walletRoutes.get('/', getUserWallets);
walletRoutes.get('/:id', getWalletById);
walletRoutes.put('/:id', updateWallet);
walletRoutes.delete('/:id', deleteWallet);

