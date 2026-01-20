import { Router } from 'express';
import {
  uploadUserProfileImage,
  uploadProductImageHandler,
  deleteFile
} from '../controllers/uploadController';
import {
  uploadProfileImageCloudinary,
  uploadProductImageCloudinary,
  handleCloudinaryError
} from '../middleware/cloudinaryUpload';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/upload/profile-image:
 *   post:
 *     summary: Upload user profile image (Cloudinary)
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
 *     responses:
 *       200:
 *         description: Image uploaded to Cloudinary successfully
 */
router.post(
  '/profile-image',
  authenticate,
  uploadProfileImageCloudinary,
  handleCloudinaryError,
  uploadUserProfileImage
);

/**
 * @swagger
 * /api/upload/product-image:
 *   post:
 *     summary: Upload product image (Cloudinary)
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
 *     responses:
 *       200:
 *         description: Product image uploaded to Cloudinary successfully
 */
router.post(
  '/product-image',
  authenticate,
  uploadProductImageCloudinary,
  handleCloudinaryError,
  uploadProductImageHandler
);

/**
 * @swagger
 * /api/upload/{publicId}:
 *   delete:
 *     summary: Delete image from Cloudinary
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public_id (e.g., ecommerce-api/profiles/profile-123456)
 *     responses:
 *       200:
 *         description: File deleted from Cloudinary
 */
router.delete('/:publicId(*)', authenticate, deleteFile);

export default router;