import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
} from './chat.controller';

export const chatRoutes = Router();

chatRoutes.use(authenticate);

chatRoutes.post('/message', sendMessage);
chatRoutes.get('/history', getChatHistory);
chatRoutes.delete('/history', clearChatHistory);

