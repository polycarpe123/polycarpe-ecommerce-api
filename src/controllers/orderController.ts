import { Request, Response } from 'express';
import { Order, OrderStatus } from '../models/order';
import { Cart } from '../models/cart';
import { Product } from '../models/product';
import mongoose from 'mongoose';
import emailService from '../services/emailService';


// CUSTOMER ENDPOINTS
// Create order with transaction (ALREADY HAVE - KEEP AS IS)
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const { shippingAddress, notes } = req.body;

    const cart = await Cart.findOne({ userId }).session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: 'Cart is empty. Cannot create order.'
      });
      return;
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        res.status(404).json({
          success: false,
          error: `Product ${item.productName} no longer exists`
        });
        return;
      }

      if (!product.inStock || product.quantity < item.quantity) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          error: `Insufficient stock for ${item.productName}. Only ${product.quantity} available.`
        });
        return;
      }
    }

    const orderItems = cart.items.map(item => ({
      productId: item.productId.toString(),
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }));

    const newOrder = (await Order.create(
      [{
        userId,
        items: orderItems,
        total: cart.total,
        status: OrderStatus.PENDING,
        shippingAddress: shippingAddress?.trim(),
        notes: notes?.trim()
      }],
      { session }
    ))[0] as any;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (product) {
        product.quantity -= item.quantity;
        if (product.quantity === 0) {
          product.inStock = false;
        }
        await product.save({ session });
      }
    }

    await Cart.findByIdAndDelete(cart._id).session(session);
    await session.commitTransaction();

    try {
      const user = await mongoose.model('User').findById(userId);
      if (user) {
        await emailService.sendOrderConfirmation(
          user.email,
          user.firstName,
          newOrder._id.toString(),
          newOrder.total,
          newOrder.items
        );
      }
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: newOrder
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  } finally {
    session.endSession();
  }
};

// Get all user's orders 
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

// Get single user order
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

// Cancel order with transaction 
export const cancelMyOrder = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
      return;
    }

    const order = await Order.findOne({ _id: id, userId }).session(session);

    if (!order) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    if (order.status !== OrderStatus.PENDING) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`
      });
      return;
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        product.quantity += item.quantity;
        product.inStock = true;
        await product.save({ session });
      }
    }

    order.status = OrderStatus.CANCELLED;
    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order'
    });
  } finally {
    session.endSession();
  }
};


// ADMIN ENDPOINTS
// Get all orders 
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

// Update order status with transaction 
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
      return;
    }

    if (!status || !Object.values(OrderStatus).includes(status)) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${Object.values(OrderStatus).join(', ')}`
      });
      return;
    }

    const order = await Order.findById(id).session(session);

    if (!order) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: `Cannot update order with status: ${order.status}`
      });
      return;
    }

    if (status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (product) {
          product.quantity += item.quantity;
          product.inStock = true;
          await product.save({ session });
        }
      }
    }

    order.status = status;
    await order.save({ session });
    await session.commitTransaction();

    try {
      const user = await mongoose.model('User').findById(order.userId);
      if (user) {
        await emailService.sendOrderStatusUpdate(
          user.email,
          user.firstName,
          order._id.toString(),
          status
        );
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  } finally {
    session.endSession();
  }
};