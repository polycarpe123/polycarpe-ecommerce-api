import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/accessControl';
import { User, UserRole } from '../models/user';
import { Order } from '../models/order';
import { Category } from '../models/category';
import { Product } from '../models/product';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification endpoints for admin dashboard
 */

/**
 * @swagger
 * /api/notifications/count:
 *   get:
 *     summary: Get notification counts (Admin)
 *     description: Retrieves counts of new orders, users, categories, and products
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification counts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/count', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      newOrdersLastHour,
      newOrdersToday,
      newUsersLastHour,
      newUsersToday,
      newCategoriesToday,
      newProductsToday,
      pendingOrders,
      lowStockProducts
    ] = await Promise.all([
      // New orders
      Order.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      Order.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      
      // New users
      User.countDocuments({ 
        role: UserRole.CUSTOMER, 
        createdAt: { $gte: oneHourAgo } 
      }),
      User.countDocuments({ 
        role: UserRole.CUSTOMER, 
        createdAt: { $gte: oneDayAgo } 
      }),
      
      // New categories
      Category.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      
      // New products
      Product.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      
      // Pending orders
      Order.countDocuments({ status: 'pending' }),
      
      // Low stock products
      Product.countDocuments({ quantity: { $lt: 10 } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders: {
          newLastHour: newOrdersLastHour,
          newToday: newOrdersToday,
          pending: pendingOrders
        },
        users: {
          newLastHour: newUsersLastHour,
          newToday: newUsersToday
        },
        categories: {
          newToday: newCategoriesToday
        },
        products: {
          newToday: newProductsToday,
          lowStock: lowStockProducts
        },
        total: newOrdersLastHour + newUsersLastHour + newCategoriesToday + newProductsToday + pendingOrders
      }
    });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification counts'
    });
  }
});

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get recent notifications (Admin)
 *     description: Retrieves recent activities and notifications for admin dashboard
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications to retrieve
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [order, user, category, product, system]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const notifications: any[] = [];

    // Get recent orders
    if (!type || type === 'order') {
      const recentOrders = await Order.find({ createdAt: { $gte: oneWeekAgo } })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      recentOrders.forEach(order => {
        notifications.push({
          id: `order-${order._id}`,
          type: 'order',
          title: 'New Order',
          message: `${(order.userId as any)?.firstName || 'Customer'} placed an order for $${order.total}`,
          timestamp: order.createdAt,
          data: order,
          priority: order.status === 'pending' ? 'high' : 'medium'
        });
      });
    }

    // Get recent users
    if (!type || type === 'user') {
      const recentUsers = await User.find({ 
        role: UserRole.CUSTOMER, 
        createdAt: { $gte: oneWeekAgo } 
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      recentUsers.forEach(user => {
        notifications.push({
          id: `user-${user._id}`,
          type: 'user',
          title: 'New Customer',
          message: `${user.firstName} ${user.lastName} joined the platform`,
          timestamp: user.createdAt,
          data: user,
          priority: 'low'
        });
      });
    }

    // Get recent categories
    if (!type || type === 'category') {
      const recentCategories = await Category.find({ createdAt: { $gte: oneWeekAgo } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      recentCategories.forEach(category => {
        notifications.push({
          id: `category-${category._id}`,
          type: 'category',
          title: 'New Category',
          message: `Category "${category.name}" was created`,
          timestamp: category.createdAt,
          data: category,
          priority: 'low'
        });
      });
    }

    // Get recent products
    if (!type || type === 'product') {
      const recentProducts = await Product.find({ createdAt: { $gte: oneWeekAgo } })
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      recentProducts.forEach(product => {
        notifications.push({
          id: `product-${product._id}`,
          type: 'product',
          title: 'New Product',
          message: `Product "${product.name}" was added to ${(product.categoryId as any)?.name || 'Uncategorized'}`,
          timestamp: product.createdAt,
          data: product,
          priority: 'low'
        });
      });
    }

    // Sort by timestamp and limit
    const sortedNotifications = notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: sortedNotifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin)
 *     description: Retrieves comprehensive statistics for admin dashboard
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalOrders,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      pendingOrders,
      completedOrders,
      totalCustomers,
      customersToday,
      totalProducts,
      lowStockProducts,
      totalCategories,
      revenueToday,
      revenueThisMonth,
      revenueThisYear
    ] = await Promise.all([
      // Order stats
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      
      // Customer stats
      User.countDocuments({ role: UserRole.CUSTOMER }),
      User.countDocuments({ 
        role: UserRole.CUSTOMER, 
        createdAt: { $gte: startOfDay } 
      }),
      
      // Product stats
      Product.countDocuments(),
      Product.countDocuments({ quantity: { $lt: 10 } }),
      
      // Category stats
      Category.countDocuments(),
      
      // Revenue stats
      Order.aggregate([
        { $match: { 
          status: { $ne: 'cancelled' },
          createdAt: { $gte: startOfDay } 
        }},
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { 
          status: { $ne: 'cancelled' },
          createdAt: { $gte: startOfMonth } 
        }},
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { 
          status: { $ne: 'cancelled' },
          createdAt: { $gte: startOfYear } 
        }},
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: ordersToday,
          thisWeek: ordersThisWeek,
          thisMonth: ordersThisMonth,
          pending: pendingOrders,
          completed: completedOrders
        },
        customers: {
          total: totalCustomers,
          today: customersToday
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        },
        categories: {
          total: totalCategories
        },
        revenue: {
          today: revenueToday[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0,
          thisYear: revenueThisYear[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics'
    });
  }
});

export default router;
