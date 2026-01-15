declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    user?: any;
  }
}
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User, IUser, UserResponse, RegisterDto, LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, UpdateUserDto, UserRole } from '../models/user';
import { TokenBlacklist } from '../models/TokenBlackList';
import { generateToken } from '../utility/jwt';

// Helper function to exclude password from response
const excludePassword = (user: IUser): UserResponse => {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt
  };
};

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role }: RegisterDto = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Only allow customer registration by default
    // Admin must create vendor/admin accounts
    const userRole = role && role === UserRole.CUSTOMER ? role : UserRole.CUSTOMER;

    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: userRole
    });

    const token = generateToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: excludePassword(newUser),
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDto = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: excludePassword(user),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
};

// Get Profile (authenticated user)
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId; // Set by authenticate middleware

    const user = await User.findById(userId).select('-password -resetToken -resetTokenExpiry');
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      // Add token to blacklist
      await TokenBlacklist.create({
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
};

// Change Password (authenticated user)
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword }: ChangePasswordDto = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
      return;
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email }: ForgotPasswordDto = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour from now
    await user.save();

    // In production, send email with reset link
    // For now, just return the token (this is unnecessary in production!)
    console.log('Reset Token:', resetToken);
    console.log('Reset Link:', `http://localhost:3000/reset-password?token=${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'A password reset link has been sent',
    
      resetToken: resetToken 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword }: ResetPasswordDto = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() } // Token not expired
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
      return;
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
};

// Get all users (ADMIN ONLY)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password -resetToken -resetTokenExpiry');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
};

// Get single user (ADMIN ONLY)
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password -resetToken -resetTokenExpiry');
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
};

// Update user (ADMIN ONLY)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role }: UpdateUserDto = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Email already in use'
        });
        return;
      }
      user.email = email.toLowerCase();
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (role) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: excludePassword(user)
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
};

// Delete user (ADMIN ONLY)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.userId === id) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
      return;
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};