import { Request, Response } from 'express';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { Cart } from '../models/cart';
import { UserRole } from '../models/user';

// Get all products - PUBLIC
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, inStock, minPrice, maxPrice } = req.query;

    const query: any = {};

    if (categoryId && typeof categoryId === 'string') {
      query.categoryId = categoryId;
    }

    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && typeof minPrice === 'string') {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice && typeof maxPrice === 'string') {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    const products = await Product.find(query)
      .populate('categoryId', 'name description')
      .populate('createdBy', 'firstName lastName email role');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
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
      data: product
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

    const { name, price, description, categoryId, inStock, quantity } = req.body;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        error: 'Category not found'
      });
      return;
    }

    const newProduct = await Product.create({
      name: name.trim(),
      price,
      description: description?.trim(),
      categoryId,
      inStock,
      quantity,
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
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