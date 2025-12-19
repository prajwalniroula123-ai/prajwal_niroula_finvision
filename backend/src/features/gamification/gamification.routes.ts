import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getRewards,
  getAchievements,
  getUserStats,
  checkAndAwardAchievements,
} from './gamification.controller';

export const gamificationRoutes = Router();

gamificationRoutes.use(authenticate);

gamificationRoutes.get('/rewards', getRewards);
gamificationRoutes.get('/achievements', getAchievements);
gamificationRoutes.get('/stats', getUserStats);
gamificationRoutes.post('/check-achievements', checkAndAwardAchievements);

