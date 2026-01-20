import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads';
const createUploadDirs = () => {
  const dirs = [
    uploadDir,
    path.join(uploadDir, 'profiles'),
    path.join(uploadDir, 'products'),
    path.join(uploadDir, 'documents')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

createUploadDirs();

// Configure storage
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let folder = 'uploads';
    
    // Determine folder based on file field name
    if (file.fieldname === 'profileImage') {
      folder = path.join(uploadDir, 'profiles');
    } else if (file.fieldname === 'productImage') {
      folder = path.join(uploadDir, 'products');
    } else if (file.fieldname === 'document') {
      folder = path.join(uploadDir, 'documents');
    }
    
    cb(null, folder);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Create unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
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
  cb: FileFilterCallback
) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, and Excel files are allowed.'));
  }
};

// Max file size (5MB default)
const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

// Multer configurations
export const uploadProfileImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxFileSize }
}).single('file');

export const uploadProductImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxFileSize }
}).single('file');

export const uploadMultipleProductImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxFileSize }
}).array('files', 5); // Max 5 images

export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: maxFileSize }
}).single('file');
