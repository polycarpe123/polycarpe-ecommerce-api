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
router.post('/profile-image', authenticate, uploadProfileImage, uploadUserProfileImage);
router.post('/product-image', authenticate, uploadProductImage, uploadProductImageHandler);
router.delete('/:filename', authenticate, deleteFile);

export default router;
