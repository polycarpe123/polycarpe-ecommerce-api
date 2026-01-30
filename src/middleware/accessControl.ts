/// <reference path="../../express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user';

// Check if user has required role
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
      return;
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole(UserRole.ADMIN);

// Vendor or Admin middleware
export const requireVendorOrAdmin = requireRole(UserRole.VENDOR, UserRole.ADMIN);

// Any authenticated user (Customer, Vendor, or Admin)
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }
  next();
};

// Check if user owns the resource or is admin
export const checkOwnershipOrAdmin = (resourceCreatorId: string, req: Request): boolean => {
  if (!req.user) return false;
  
  // Admin can access anything
  if (req.user.role === UserRole.ADMIN) return true;
  
  // Check ownership
  return req.user._id.toString() === resourceCreatorId;
};