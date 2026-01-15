import mongoose, { Schema, Document } from 'mongoose';

export interface ITokenBlacklist extends Document {
  token: string;
  expiresAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - auto delete when expired
  }
});

export const TokenBlacklist = mongoose.model<ITokenBlacklist>('TokenBlacklist', TokenBlacklistSchema);