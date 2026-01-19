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

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Customer order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     description: Creates a new order from the user's current cart items and clears the cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order placed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cart empty, product out of stock, or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Cart is empty. Cannot create order."
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product no longer exists
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, validateCreateOrder, createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders
 *     description: Retrieves all orders for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, getMyOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get single order
 *     description: Retrieves details of a specific order owned by the user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, validateMongoId, getMyOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel pending order
 *     description: Cancels a pending order and restores product inventory
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order cancelled successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cannot cancel order (invalid ID or non-pending status)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Cannot cancel order with status: shipped. Only pending orders can be cancelled."
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/cancel', authenticate, validateMongoId, cancelMyOrder);

export default router;