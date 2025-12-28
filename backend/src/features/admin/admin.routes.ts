import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getUserStats,
  getPlatformStats,
  updateUserStatus,
  deleteUser,
} from './admin.controller';
import { authenticate, requireAdmin } from '../../middleware/auth';

export const adminRoutes = Router();

// All admin routes require authentication and admin role
adminRoutes.use(authenticate);
adminRoutes.use(requireAdmin);

// User management routes
adminRoutes.get('/users', getAllUsers);
adminRoutes.get('/users/:id', getUserById);
adminRoutes.get('/users/:id/stats', getUserStats);
adminRoutes.put('/users/:id/status', updateUserStatus);
adminRoutes.delete('/users/:id', deleteUser);

// Platform statistics
adminRoutes.get('/stats', getPlatformStats);
