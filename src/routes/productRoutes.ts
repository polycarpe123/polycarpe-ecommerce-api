import { Router } from 'express';
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
} from '../controllers/productController';
import { validateProduct, validateUUID } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { requireVendorOrAdmin } from '../middleware/accessControl';

const router = Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with optional filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', validateUUID, getProduct);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create product (Vendor or Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', authenticate, requireVendorOrAdmin, validateProduct, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product (Own products for Vendor, all for Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               inStock:
 *                 type: boolean
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       403:
 *         description: Can only update own products (Vendor)
 */
router.put('/:id', authenticate, requireVendorOrAdmin, validateUUID, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product (Own products for Vendor, all for Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Can only delete own products (Vendor)
 */
router.delete('/:id', authenticate, requireVendorOrAdmin, validateUUID, deleteProduct);

/**
 * @swagger
 * /api/products/vendor/my-products:
 *   get:
 *     summary: Get vendor's own products (Vendor only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vendor's products
 *       403:
 *         description: This endpoint is only for vendors
 */
router.get('/vendor/my-products', authenticate, getMyProducts);

export default router;