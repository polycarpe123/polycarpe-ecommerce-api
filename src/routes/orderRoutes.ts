import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getMyOrder,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/accessControl';
import {
  validateCreateOrder,
  validateOrderStatus,
  validateMongoId
} from '../middleware/validation.js';

const router = Router();

// Customer routes (Protected)
router.post('/', authenticate, validateCreateOrder, createOrder);
router.get('/', authenticate, getMyOrders);
router.get('/:id', authenticate, validateMongoId, getMyOrder);
router.patch('/:id/cancel', authenticate, validateMongoId, cancelMyOrder);

export default router;