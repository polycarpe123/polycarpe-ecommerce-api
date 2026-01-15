import { Request, Response } from 'express';
import { Cart, ICart, AddToCartDto, UpdateCartItemDto } from '../models/cart';
import { Product } from '../models/product';

// Helper function to calculate cart total
const calculateCartTotal = (cart: ICart): number => {
  return cart.items.reduce((sum, item) => sum + item.subtotal, 0);
};

// Get user's cart (PROTECTED)
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    let cart = await Cart.findOne({ userId: req.userId }).populate('items.productId', 'name price inStock quantity');

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await Cart.create({
        userId: req.userId,
        items: [],
        total: 0
      });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cart'
    });
  }
};

// Add item to cart (PROTECTED)
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { productId, quantity }: AddToCartDto = req.body;

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      });
      return;
    }

    // Check stock
    if (!product.inStock || product.quantity < quantity) {
      res.status(400).json({
        success: false,
        error: 'Insufficient stock'
      });
      return;
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = await Cart.create({
        userId: req.userId,
        items: [],
        total: 0
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex !== -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (product.quantity < newQuantity) {
        res.status(400).json({
          success: false,
          error: 'Insufficient stock for requested quantity'
        });
        return;
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].subtotal = product.price * newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productId: product._id as any,
        productName: product.name,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
        addedAt: new Date()
      } as any);
    }

    // Recalculate total
    cart.total = calculateCartTotal(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
};

// Update cart item quantity (PROTECTED)
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { itemId } = req.params;
    const { quantity }: UpdateCartItemDto = req.body;

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
      return;
    }

    const item = cart.items.find(i => (i as any)._id?.toString() === itemId);
    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
      return;
    }

    // Check product stock
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product no longer exists'
      });
      return;
    }

    if (!product.inStock || product.quantity < quantity) {
      res.status(400).json({
        success: false,
        error: 'Insufficient stock'
      });
      return;
    }

    // Update quantity and subtotal
    item.quantity = quantity;
    item.subtotal = item.price * quantity;

    // Recalculate total
    cart.total = calculateCartTotal(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: cart
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart item'
    });
  }
};

// Remove item from cart (PROTECTED)
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
      return;
    }

    const itemIndex = cart.items.findIndex(i => (i as any)._id?.toString() === itemId);
    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
      return;
    }

    cart.items.splice(itemIndex, 1);

    // Recalculate total
    cart.total = calculateCartTotal(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart'
    });
  }
};

// Clear cart (PROTECTED)
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
      return;
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
};