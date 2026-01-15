import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate JWT token
export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any
  };
  
  return jwt.sign(payload, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Generate reset token
export const generateResetToken = (): string => {
  const options: SignOptions = {
    expiresIn: '1h'
  };
  
  return jwt.sign({ purpose: 'reset' }, JWT_SECRET, options);
};