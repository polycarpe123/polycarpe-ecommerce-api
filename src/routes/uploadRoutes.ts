import { Router } from 'express';
import {
  uploadUserProfileImage,
  uploadProductImageHandler,
  deleteFile
} from '../controllers/uploadController';
import {
  uploadProfileImage,
  uploadProductImage
} from '../middleware/upload';
import { authenticate } from '../middleware/auth';

const router = Router();

// Upload routes (protected)
/**
 * @swagger
 * tags:
 *   name: File Upload
 *   description: File upload and management endpoints
 */

/**
 * @swagger
 * /api/upload/profile:
 *   post:
 *     summary: Upload user profile image
 *     description: Upload a profile image for the authenticated user
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       400:
 *         description: No file uploaded or invalid file type
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
 *                   example: "No file uploaded"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/profile-image', authenticate, uploadProfileImage, uploadUserProfileImage);

/**
 * @swagger
 * /api/upload/product:
 *   post:
 *     summary: Upload product image
 *     description: Upload an image for a product (Admin/Vendor only)
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF)
 *     responses:
 *       200:
 *         description: Product image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/FileUploadResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Product image uploaded successfully"
 *                     data:
 *                       properties:
 *                         url:
 *                           example: "/uploads/products/1642345678901-product.jpg"
 *       400:
 *         description: No file uploaded or invalid file type
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
 *                   example: "No file uploaded"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/product-image', authenticate, uploadProductImage, uploadProductImageHandler);

/**
 * @swagger
 * /api/upload/{filename}:
 *   delete:
 *     summary: Delete uploaded file
 *     description: Delete a previously uploaded file
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the file to delete
 *         example: "1642345678901-profile.jpg"
 *       - in: query
 *         name: folder
 *         required: false
 *         schema:
 *           type: string
 *           enum: [profiles, products, documents]
 *         description: Folder where the file is located
 *         example: "profiles"
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileDeleteResponse'
 *       404:
 *         description: File not found
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
 *                   example: "File not found"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:filename', authenticate, deleteFile);

export default router;
