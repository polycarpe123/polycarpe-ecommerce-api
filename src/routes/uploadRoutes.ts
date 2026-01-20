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
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile-image', authenticate, uploadProfileImage, uploadUserProfileImage);





router.post('/profile-image', authenticate, uploadProfileImage, uploadUserProfileImage);
router.post('/product-image', authenticate, uploadProductImage, uploadProductImageHandler);
router.delete('/:filename', authenticate, deleteFile);

export default router;
