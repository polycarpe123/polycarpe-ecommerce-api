import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Upload profile image
export const uploadUserProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const fileUrl = `/uploads/profiles/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
};

// Upload product image
export const uploadProductImageHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const fileUrl = `/uploads/products/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
};

// Delete file
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const { folder } = req.query; // 'profiles', 'products', or 'documents'

    const uploadPath = process.env.UPLOAD_PATH || 'uploads';
    const filePath = path.join(uploadPath, folder as string || '', filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
      return;
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
};
