import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../database/cloudinary';
import { Request } from 'express';

// Profile Image Storage
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'ecommerce-api/profiles',
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
      folder: 'ecommerce-api/products',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      public_id: `product-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// Category Image Storage
const categoryImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'ecommerce-api/categories',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      public_id: `category-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// Document Storage (PDF, Word, Excel, etc.)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'ecommerce-api/documents',
      allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'],
      resource_type: 'raw' as const, // Important for non-image files
      public_id: `document-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// File size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// File filter for images
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// File filter for documents
const documentFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, CSV, and TXT files are allowed.'));
  }
};

// Multer configurations for Cloudinary

// Profile Image Upload (Single)
export const uploadProfileImageCloudinary = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  }
}).single('file');

// Product Image Upload (Single)
export const uploadProductImageCloudinary = multer({
  storage: productImageStorage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  }
}).single('file');

// Category Image Upload (Single)
export const uploadCategoryImageCloudinary = multer({
  storage: categoryImageStorage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  }
}).single('file');

// Multiple Product Images Upload (Up to 5)
export const uploadMultipleProductImagesCloudinary = multer({
  storage: productImageStorage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: MAX_IMAGE_SIZE,
    files: 5
  }
}).array('files', 5);

// Document Upload (Single)
export const uploadDocumentCloudinary = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: { 
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1
  }
}).single('file');

// Error handler for Cloudinary uploads
export const handleCloudinaryError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB for images and ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB for documents`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 5 files'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name. Use "file" for single uploads or "files" for multiple uploads'
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