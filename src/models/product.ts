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
      trim: true,
      index: true,
      minlength: [2, 'Product name must be at least 2 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      index: true
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
      required: [true, 'Category is required'],
      index: true
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

// Compound indexes
ProductSchema.index({ categoryId: 1, inStock: 1 });
ProductSchema.index({ price: 1, createdAt: -1 });

// Text index for search
ProductSchema.index({ name: 'text', description: 'text' });



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