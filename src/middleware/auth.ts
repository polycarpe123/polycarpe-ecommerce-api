import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utility/jwt';
import { TokenBlacklist } from '../models/TokenBlackList';
import { User } from '../models/user';

// Authenticate user
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided. Please login.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted (logged out)
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      res.status(401).json({
        success: false,
        error: 'Token has been invalidated. Please login again.'
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Attach user to request
    req.user = user as any;
    req.userId = user._id.toString();

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      const blacklistedToken = await TokenBlacklist.findOne({ token });
      if (!blacklistedToken) {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId);
        
        if (user) {
          req.user = user as any;
          req.userId = user._id.toString();
        }
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};
