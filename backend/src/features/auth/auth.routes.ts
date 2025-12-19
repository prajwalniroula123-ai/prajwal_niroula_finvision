import { Router } from 'express';
import { register, login, getProfile, updateProfile } from './auth.controller';
import { authenticate } from '../../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/profile', authenticate, getProfile);
authRoutes.put('/profile', authenticate, updateProfile);

