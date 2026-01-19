import { Router } from 'express';
import {
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/accessControl';
import {
  validateOrderStatus,
  validateMongoId
} from '../middleware/validation';

const router = Router();

// Admin routes (Protected + Admin only)
router.get('/', authenticate, requireAdmin, getAllOrders);
router.patch('/:id/status', authenticate, requireAdmin, validateMongoId, validateOrderStatus, updateOrderStatus);

export default router;
