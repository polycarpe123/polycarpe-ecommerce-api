/// <reference path="../../express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/review';
import { Product } from '../models/product';
import mongoose from 'mongoose';

// Create review
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { productId, rating, comment } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      res.status(400).json({
        success: false,
        error: 'You have already reviewed this product'
      });
      return;
    }

    const review = await Review.create({
      productId,
      userId,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name price');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create review'
    });
  }
};

// Get product reviews with user info
export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
      return;
    }

    const reviews = await Review.find({ productId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews'
    });
  }
};

// Get user's reviews with product info
export const getMyReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const reviews = await Review.find({ userId })
      .populate('productId', 'name price description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews'
    });
  }
};