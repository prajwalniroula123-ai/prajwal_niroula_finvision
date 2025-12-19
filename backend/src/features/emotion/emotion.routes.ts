import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createEmotion,
  getEmotions,
  getEmotionById,
  updateEmotion,
  getEmotionStats,
} from './emotion.controller';

export const emotionRoutes = Router();

emotionRoutes.use(authenticate);

emotionRoutes.post('/', createEmotion);
emotionRoutes.get('/', getEmotions);
emotionRoutes.get('/stats', getEmotionStats);
emotionRoutes.get('/:id', getEmotionById);
emotionRoutes.put('/:id', updateEmotion);

