import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  price: number;
  oldPrice?: number;
  description?: string;
  images: string[];
  categoryId: mongoose.Types.ObjectId;
  inStock: boolean;
  quantity: number;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  featured: boolean;
  rating: number;
  reviews: number;
  tags: string[];
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
    slug: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      trim: true
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      index: true
    },
    oldPrice: {
      type: Number,
      min: [0, 'Old price cannot be negative']
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
    stock: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active'
    },
    featured: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0
    },
    tags: {
      type: [String],
      default: []
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
  slug?: string;
  sku?: string;
  price: number;
  oldPrice?: number;
  description?: string;
  categoryId: string;
  inStock: boolean;
  quantity: number;
  featured?: boolean;
  tags?: string[];
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  oldPrice?: number;
  description?: string;
  categoryId?: string;
  inStock?: boolean;
  quantity?: number;
  featured?: boolean;
  status?: 'active' | 'inactive' | 'draft';
  tags?: string[];
}