import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getInsights,
  getInsightById,
  generateInsight,
} from './ai-insight.controller';

export const aiInsightRoutes = Router();

aiInsightRoutes.use(authenticate);

aiInsightRoutes.get('/', getInsights);
aiInsightRoutes.get('/generate', generateInsight);
aiInsightRoutes.get('/:id', getInsightById);

