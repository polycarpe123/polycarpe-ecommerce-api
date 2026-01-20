import { Request, Response } from 'express';
import cloudinary from '../database/cloudinary';

// Upload profile image
export const uploadProfileImageToCloudinary = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const file = req.file as any; // Cloudinary adds extra properties

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        publicId: file.filename,
        url: file.path,
        secureUrl: file.path,
        format: file.format,
        width: file.width,
        height: file.height,
        size: file.size,
        originalName: file.originalname
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image to Cloudinary'
    });
  }
};

// Upload product image
export const uploadProductImageToCloudinary = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const file = req.file as any;

    res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully',
      data: {
        publicId: file.filename,
        url: file.path,
        secureUrl: file.path,
        format: file.format,
        width: file.width,
        height: file.height,
        size: file.size,
        originalName: file.originalname
      }
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image to Cloudinary'
    });
  }
};

// Upload multiple product images
export const uploadMultipleProductImagesToCloudinary = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
      return;
    }

    const uploadedFiles = req.files.map((file: any) => ({
      publicId: file.filename,
      url: file.path,
      secureUrl: file.path,
      format: file.format,
      width: file.width,
      height: file.height,
      size: file.size,
      originalName: file.originalname
    }));

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} product images uploaded successfully`,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Upload multiple images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images to Cloudinary'
    });
  }
};

// Upload document
export const uploadDocumentToCloudinary = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const file = req.file as any;

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        publicId: file.filename,
        url: file.path,
        secureUrl: file.path,
        format: file.format,
        size: file.size,
        originalName: file.originalname,
        resourceType: 'raw'
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document to Cloudinary'
    });
  }
};

// Delete file from Cloudinary
export const deleteCloudinaryFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    if (!publicId) {
      res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
      return;
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as string
    });

    if (result.result === 'ok' || result.result === 'not found') {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully from Cloudinary',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to delete file from Cloudinary'
      });
    }
  } catch (error) {
    console.error('Delete Cloudinary file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file from Cloudinary'
    });
  }
};

// Get file info from Cloudinary
export const getCloudinaryFileInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    if (!publicId) {
      res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
      return;
    }

    // Get resource info from Cloudinary
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType as string
    });

    res.status(200).json({
      success: true,
      data: {
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        type: result.type,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        size: result.bytes,
        createdAt: result.created_at
      }
    });
  } catch (error: any) {
    console.error('Get Cloudinary file info error:', error);
    if (error.error && error.error.http_code === 404) {
      res.status(404).json({
        success: false,
        error: 'File not found in Cloudinary'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get file info from Cloudinary'
      });
    }
  }
};

// Generate transformation URL
export const generateTransformedUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicId } = req.params;
    const { width, height, crop = 'fill', quality = 'auto' } = req.query;

    if (!publicId) {
      res.status(400).json({
        success: false,
        error: 'Public ID is required'
      });
      return;
    }

    const transformations: any = {
      quality: quality as string
    };

    if (width) transformations.width = Number(width);
    if (height) transformations.height = Number(height);
    if (crop) transformations.crop = crop as string;

    const transformedUrl = cloudinary.url(publicId, transformations);

    res.status(200).json({
      success: true,
      data: {
        publicId,
        originalUrl: cloudinary.url(publicId),
        transformedUrl,
        transformations
      }
    });
  } catch (error) {
    console.error('Generate transformed URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate transformed URL'
    });
  }
};
