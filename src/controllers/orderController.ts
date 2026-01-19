import { Request, Response } from 'express';
import { Order, OrderStatus, IOrderItem } from '../models/order.js';
import { Cart } from '../models/cart.js';
import { Product } from '../models/product.js';
import mongoose from 'mongoose';

// Customer: Create order from cart
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId; // From auth middleware
    const { shippingAddress, notes } = req.body;

    // Find user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cart is empty. Cannot create order.'
      });
      return;
    }

    // Verify all products still exist and have sufficient stock
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        res.status(404).json({
          success: false,
          error: `Product ${item.productName} no longer exists`
        });
        return;
      }

      if (!product.inStock) {
        res.status(400).json({
          success: false,
          error: `Product ${item.productName} is out of stock`
        });
        return;
      }

      if (product.quantity < item.quantity) {
        res.status(400).json({
          success: false,
          error: `Insufficient stock for ${item.productName}. Only ${product.quantity} available.`
        });
        return;
      }
    }

    // Create order snapshot from cart
    const orderItems: IOrderItem[] = cart.items.map(item => ({
      productId: item.productId.toString(),
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    const newOrder = await Order.create({
      userId,
      items: orderItems,
      total: cart.total,
      status: OrderStatus.PENDING,
      shippingAddress: shippingAddress?.trim(),
      notes: notes?.trim()
    });

    // Update product quantities
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { quantity: -item.quantity }
        }
      );

      // Check if product is now out of stock
      const updatedProduct = await Product.findById(item.productId);
      if (updatedProduct && updatedProduct.quantity === 0) {
        updatedProduct.inStock = false;
        await updatedProduct.save();
      }
    }

    // Clear the cart
    await Cart.findByIdAndDelete(cart._id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: newOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
};

// Customer: Get all own orders
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const filter: any = { userId };
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
};

// Customer: Get single own order
export const getMyOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
      return;
    }

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
};

// Customer: Cancel own pending order
export const cancelMyOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
      return;
    }

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    if (order.status !== OrderStatus.PENDING) {
      res.status(400).json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`
      });
      return;
    }

    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { quantity: item.quantity },
          inStock: true
        }
      );
    }

    order.status = OrderStatus.CANCELLED;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, userId, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter: any = {};
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      filter.status = status;
    }
    if (userId) {
      filter.userId = userId;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder;

    const orders = await Order.find(filter)
      .sort(sortOptions)
      .populate('userId', 'email firstName lastName')
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
      return;
    }

    if (!status || !Object.values(OrderStatus).includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${Object.values(OrderStatus).join(', ')}`
      });
      return;
    }

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    // Prevent updating already delivered or cancelled orders
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        error: `Cannot update order with status: ${order.status}`
      });
      return;
    }

    // If cancelling, restore product quantities
    if (status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: { quantity: item.quantity },
            inStock: true
          }
        );
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
};