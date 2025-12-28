import { Router } from 'express';
import { register, login, getProfile, updateProfile, verifyEmail, resendOTP } from './auth.controller';
import { authenticate } from '../../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/verify-email', verifyEmail);
authRoutes.post('/resend-otp', resendOTP);
authRoutes.get('/profile', authenticate, getProfile);
authRoutes.put('/profile', authenticate, updateProfile);

