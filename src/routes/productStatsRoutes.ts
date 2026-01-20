import { Router } from 'express';
import {
  getProductStats,
  getTopProducts,
  getLowStockProducts,
  getPriceDistribution
} from '../controllers/productStatsController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/accessControl';

const router = Router();

/**
 * @swagger
 * /api/products/stats:
 *   get:
 *     summary: Get product statistics by category
 *     tags: [Product Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product statistics
 */
router.get('/stats', authenticate, requireAdmin, getProductStats);

/**
 * @swagger
 * /api/products/top:
 *   get:
 *     summary: Get top products by price
 *     tags: [Product Stats]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top products
 */
router.get('/top', getTopProducts);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Product Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Low stock products
 */
router.get('/low-stock', authenticate, requireAdmin, getLowStockProducts);

/**
 * @swagger
 * /api/products/price-distribution:
 *   get:
 *     summary: Get price distribution
 *     tags: [Product Stats]
 *     responses:
 *       200:
 *         description: Price distribution
 */
router.get('/price-distribution', getPriceDistribution);

export default router;
