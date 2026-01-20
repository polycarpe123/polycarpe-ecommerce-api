import { Router } from 'express';
import {
  uploadProfileImageToCloudinary,
  uploadProductImageToCloudinary,
  uploadMultipleProductImagesToCloudinary,
  uploadDocumentToCloudinary,
  deleteCloudinaryFile,
  getCloudinaryFileInfo,
  generateTransformedUrl
} from '../controllers/cloudinaryController';
import {
  uploadProfileImageCloudinary,
  uploadProductImageCloudinary,
  uploadMultipleProductImagesCloudinary,
  uploadDocumentCloudinary,
  handleCloudinaryError
} from '../middleware/cloudinaryUpload';
import { authenticate } from '../middleware/auth';

const router = Router();

// Upload routes (all protected)
router.post(
  '/profile-image',
  authenticate,
  (req, res, next) => {
    uploadProfileImageCloudinary(req, res, (err) => {
      if (err) {
        return handleCloudinaryError(err, req, res, next);
      }
      next();
    });
  },
  uploadProfileImageToCloudinary
);

router.post(
  '/product-image',
  authenticate,
  (req, res, next) => {
    uploadProductImageCloudinary(req, res, (err) => {
      if (err) {
        return handleCloudinaryError(err, req, res, next);
      }
      next();
    });
  },
  uploadProductImageToCloudinary
);

router.post(
  '/product-images',
  authenticate,
  (req, res, next) => {
    uploadMultipleProductImagesCloudinary(req, res, (err) => {
      if (err) {
        return handleCloudinaryError(err, req, res, next);
      }
      next();
    });
  },
  uploadMultipleProductImagesToCloudinary
);

router.post(
  '/document',
  authenticate,
  (req, res, next) => {
    uploadDocumentCloudinary(req, res, (err) => {
      if (err) {
        return handleCloudinaryError(err, req, res, next);
      }
      next();
    });
  },
  uploadDocumentToCloudinary
);

// File management routes
router.get('/info/:publicId', authenticate, getCloudinaryFileInfo);
router.get('/transform/:publicId', authenticate, generateTransformedUrl);
router.delete('/:publicId', authenticate, deleteCloudinaryFile);

export default router;
