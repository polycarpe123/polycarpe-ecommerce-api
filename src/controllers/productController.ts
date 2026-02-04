/// <reference path="../../express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { Cart } from '../models/cart';
import { User, UserRole } from '../models/user';
import { createNotification } from '../utils/notificationUtils';

// Helper function to transform product data for frontend
const transformProduct = (product: any) => {
  return {
    id: product._id,
    name: product.name,
    slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
    sku: product.sku || `PRD-${product._id}`,
    price: product.price,
    oldPrice: product.oldPrice || null,
    description: product.description || '',
    images: product.images || [],
    category: product.categoryId?.name || (typeof product.categoryId === 'string' ? product.categoryId : 'Uncategorized'),
    stock: product.quantity || product.stock || 0,
    status: product.status || 'active',
    featured: product.featured || false,
    rating: product.rating || 0,
    reviews: product.reviews || 0,
    tags: product.tags || [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // PAGINATION
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // FILTERING
    const filter: any = {};
    
    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }
    
    if (req.query.featured !== undefined) {
      filter.featured = req.query.featured === 'true';
    }
    
    if (req.query.inStock !== undefined) {
      filter.inStock = req.query.inStock === 'true';
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseFloat(req.query.minPrice as string);
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseFloat(req.query.maxPrice as string);
      }
    }

    // SEARCH (using text index)
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    // SORTING
    const sortBy = req.query.sortBy as string || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortBy] = order;

    // Execute query
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform products for frontend
    const transformedProducts = products.map(transformProduct);

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      data: transformedProducts
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
    });
  }
};

// Enhanced getAllUsers with pagination and sorting
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // PAGINATION
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // FILTERING
    const filter: any = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    // SORTING
    const sortBy = req.query.sortBy as string || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortBy] = order;

    // Execute query
    const users = await User.find(filter)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
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

// Get single product - PUBLIC
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('categoryId', 'name description')
      .populate('createdBy', 'firstName lastName email role');

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transformProduct(product)
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product'
    });
  }
};

// Create product - VENDOR or ADMIN
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId || !req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { name, price, description, categoryId, inStock, quantity, featured } = req.body;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found'
      });
      return;
    }

    // Generate slug and SKU
    const slug = req.body.slug || name.toLowerCase().replace(/\s+/g, '-');
    const sku = req.body.sku || `PRD-${Date.now()}`;

    const newProduct = await Product.create({
      name: name.trim(),
      slug,
      sku,
      price,
      description: description?.trim(),
      categoryId,
      inStock,
      quantity,
      featured: featured || false,
      createdBy: req.userId
    });

    // Create notification for new product
    await createNotification.product.created(name.trim(), newProduct._id.toString());

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: transformProduct(newProduct)
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
};

// Update product - VENDOR (own products) or ADMIN (all products)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId || !req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;
    const { name, price, description, categoryId, inStock, quantity } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    // RBAC: Vendors can only update their own products
    if (req.user.role === UserRole.VENDOR && product.createdBy.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own products.'
      });
      return;
    }

    // If updating category, check if it exists
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found'
        });
        return;
      }
      product.categoryId = categoryId as any;
    }

    // Update fields
    if (name) product.name = name.trim();
    if (price !== undefined) product.price = price;
    if (description !== undefined) product.description = description.trim();
    if (inStock !== undefined) product.inStock = inStock;
    if (quantity !== undefined) product.quantity = quantity;

    await product.save();

    // Create notification for product update
    await createNotification.product.updated(product.name, product._id.toString());

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
};

// Delete product - VENDOR (own products) or ADMIN (all products)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId || !req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    // RBAC: Vendors can only delete their own products
    if (req.user.role === UserRole.VENDOR && product.createdBy.toString() !== req.userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own products.'
      });
      return;
    }

    // Remove product from all carts
    await Cart.updateMany(
      { 'items.productId': id },
      { 
        $pull: { items: { productId: id } } 
      }
    );

    // Recalculate totals for affected carts
    const affectedCarts = await Cart.find({ 'items.productId': id });
    for (const cart of affectedCarts) {
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      await cart.save();
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
};

// Get vendor's own products - VENDOR ONLY
export const getMyProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId || !req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (req.user.role !== UserRole.VENDOR) {
      res.status(403).json({
        success: false,
        error: 'This endpoint is only for vendors'
      });
      return;
    }

    const products = await Product.find({ createdBy: req.userId })
      .populate('categoryId', 'name description');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
    });
  }
};