import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isStrongPassword = (password: string): boolean => {
  return password.length >= 8;
};

// Validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate registration
export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({
      success: false,
      error: 'All fields are required'
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
    return;
  }

  if (!isStrongPassword(password)) {
    res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long'
    });
    return;
  }

  if (firstName.trim().length < 2 || lastName.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: 'First name and last name must be at least 2 characters'
    });
    return;
  }

  next();
};

// Validate login
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
    return;
  }

  next();
};

// Validate category
export const validateCategory = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Category name is required'
    });
    return;
  }

  if (name.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: 'Category name must be at least 2 characters'
    });
    return;
  }

  next();
};

// Validate product
export const validateProduct = (req: Request, res: Response, next: NextFunction): void => {
  const { name, price, categoryId, inStock, quantity } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Product name is required'
    });
    return;
  }

  if (price === undefined || typeof price !== 'number' || price < 0) {
    res.status(400).json({
      success: false,
      error: 'Valid price is required'
    });
    return;
  }

  if (!categoryId || !isValidObjectId(categoryId)) {
    res.status(400).json({
      success: false,
      error: 'Valid category ID is required'
    });
    return;
  }

  if (typeof inStock !== 'boolean') {
    res.status(400).json({
      success: false,
      error: 'inStock must be a boolean'
    });
    return;
  }

  if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
    res.status(400).json({
      success: false,
      error: 'Valid quantity is required'
    });
    return;
  }

  next();
};

// Validate cart item
export const validateCartItem = (req: Request, res: Response, next: NextFunction): void => {
  const { productId, quantity } = req.body;

  if (!productId || !isValidObjectId(productId)) {
    res.status(400).json({
      success: false,
      error: 'Valid product ID is required'
    });
    return;
  }

  if (quantity === undefined || typeof quantity !== 'number' || quantity < 1) {
    res.status(400).json({
      success: false,
      error: 'Quantity must be at least 1'
    });
    return;
  }

  next();
};

// Validate MongoDB ObjectId in params
export const validateUUID = (req: Request, res: Response, next: NextFunction): void => {
  const { id, itemId } = req.params;
  const idToValidate = id || itemId;

  if (idToValidate && !isValidObjectId(idToValidate)) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
    return;
  }

  next();
};

// Validate password change
export const validatePasswordChange = (req: Request, res: Response, next: NextFunction): void => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
    return;
  }

  if (!isStrongPassword(newPassword)) {
    res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters long'
    });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({
      success: false,
      error: 'New password must be different from current password'
    });
    return;
  }

  next();
};

// Validate forgot password
export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    res.status(400).json({
      success: false,
      error: 'Valid email is required'
    });
    return;
  }

  next();
};

// Validate reset password
export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Reset token is required'
    });
    return;
  }

  if (!newPassword || !isStrongPassword(newPassword)) {
    res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters long'
    });
    return;
  }

  next();
};

export const validateCreateOrder = (req: Request, res: Response, next: NextFunction): void => {
  const { shippingAddress } = req.body;

  if (shippingAddress && typeof shippingAddress !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Shipping address must be a string'
    });
    return;
  }

  if (shippingAddress && shippingAddress.trim().length < 10) {
    res.status(400).json({
      success: false,
      error: 'Shipping address must be at least 10 characters'
    });
    return;
  }

  next();
};

export const validateOrderStatus = (req: Request, res: Response, next: NextFunction): void => {
  const { status } = req.body;

  if (!status) {
    res.status(400).json({
      success: false,
      error: 'Status is required'
    });
    return;
  }

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
    return;
  }

  next();
};

export const validateMongoId = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
    return;
  }

  next();
};

export const validateReview = (req: Request, res: Response, next: NextFunction): void => {
  const { productId, rating, comment } = req.body;

  if (!productId) {
    res.status(400).json({
      success: false,
      error: 'Product ID is required'
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({
      success: false,
      error: 'Invalid product ID'
    });
    return;
  }

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({
      success: false,
      error: 'Rating must be between 1 and 5'
    });
    return;
  }

  if (!comment || comment.trim().length < 10) {
    res.status(400).json({
      success: false,
      error: 'Comment must be at least 10 characters'
    });
    return;
  }

  next();
};