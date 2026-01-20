import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../database/cloudinary';
import { Request } from 'express';

// Profile Image Storage
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'crud-api/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      public_id: `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// Product Image Storage
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'crud-api/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      public_id: `product-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// Document Storage
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'crud-api/documents',
      allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'],
      resource_type: 'raw' as const,
      public_id: `document-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Multer configurations
export const uploadProfileImageCloudinary = multer({
  storage: profileImageStorage,
  limits: { 
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  }
}).single('profileImage');

export const uploadProductImageCloudinary = multer({
  storage: productImageStorage,
  limits: { 
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  }
}).single('productImage');

export const uploadMultipleProductImagesCloudinary = multer({
  storage: productImageStorage,
  limits: { 
    fileSize: MAX_IMAGE_SIZE,
    files: 5
  }
}).array('productImages', 5);

export const uploadDocumentCloudinary = multer({
  storage: documentStorage,
  limits: { 
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1
  }
}).single('document');

// Error handler for Cloudinary uploads
export const handleCloudinaryError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB for images`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 5 files'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'File upload failed'
    });
  }
  next();
};