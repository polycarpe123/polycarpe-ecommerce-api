import { Request, Response } from 'express';
import { User } from '../models/user';
import cloudinary from '../database/cloudinary';

// Upload profile image to Cloudinary
export const uploadUserProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Get Cloudinary URL from multer-storage-cloudinary
    const fileUrl = (req.file as any).path; // Cloudinary URL

    // Update user profile with image URL
    const user = await User.findById(req.userId);
    if (user) {
      // Delete old image from Cloudinary if exists
      if (user.profileImage) {
        try {
          const publicId = extractPublicId(user.profileImage);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }

      user.profileImage = fileUrl;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl, // This is the Cloudinary URL
        cloudinaryId: (req.file as any).filename
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

// Upload product image to Cloudinary
export const uploadProductImageHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    // Get Cloudinary URL
    const fileUrl = (req.file as any).path;

    res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        cloudinaryId: (req.file as any).filename
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

// Delete file from Cloudinary
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId } = req.params; // Cloudinary public_id

    if (!publicId) {
      res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
      return;
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully from Cloudinary'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found in Cloudinary'
      });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
};

// Helper function to extract public_id from Cloudinary URL
const extractPublicId = (url: string): string | null => {
  try {
    // Extract public_id from Cloudinary URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
      // Get everything after version number
      const pathParts = parts.slice(uploadIndex + 2);
      const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension
      return publicId;
    }
    return null;
  } catch (err) {
    return null;
  }
};