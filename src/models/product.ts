import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  images: string[];
  categoryId: mongoose.Types.ObjectId;
  inStock: boolean;
  quantity: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    images: {  
    type: [String],
    default: []
  },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ inStock: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

export interface CreateProductDto {
  name: string;
  price: number;
  description?: string;
  categoryId: string;
  inStock: boolean;
  quantity: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  description?: string;
  categoryId?: string;
  inStock?: boolean;
  quantity?: number;
}