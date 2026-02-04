import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/accessControl';
import { User, UserRole } from '../models/user';
import { Order } from '../models/order';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin - Customers
 *   description: Admin customer management endpoints
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers (Admin)
 *     description: Retrieves all customers with filtering and sorting options
 *     tags: [Admin - Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of customers per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // First, get all users who have made orders (regardless of role)
    const ordersWithUsers = await Order.aggregate([
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);

    console.log('📊 Users with orders:', ordersWithUsers);
    const userIds = ordersWithUsers.map(item => item._id);
    console.log('👥 User IDs with orders:', userIds);
    
    // Filtering - start with users who have orders
    let filter: any = { _id: { $in: userIds } };
    
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Sorting
    const sortBy = req.query.sortBy as string || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sortOptions: any = {};
    sortOptions[sortBy] = order;

    // Execute query
    const customers = await User.find(filter)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('🔍 Found customers:', customers.length);

    // Get detailed order information for each customer
    const customersWithOrders = await Promise.all(
      customers.map(async (customer) => {
        // Look for orders using userId
        const orders = await Order.find({ userId: customer._id })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        const userStats = ordersWithUsers.find(stat => stat._id.toString() === customer._id.toString());
        
        return {
          ...customer,
          id: customer._id,
          totalOrders: userStats?.totalOrders || 0,
          totalSpent: userStats?.totalSpent || 0,
          lastOrderDate: userStats?.lastOrderDate,
          orders: orders.map(order => ({
            id: order._id,
            orderNumber: order.orderNumber || `ORD-${order._id}`,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            itemCount: order.items?.length || 0
          }))
        };
      })
    );

    // Get total count of users with orders
    const totalCustomers = userIds.length;
    const totalPages = Math.ceil(totalCustomers / limit);

    res.status(200).json({
      success: true,
      customers: customersWithOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCustomers,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customers'
    });
  }
});

/**
 * @swagger
 * /api/customers/stats:
 *   get:
 *     summary: Get customer statistics (Admin)
 *     description: Retrieves customer statistics including new customers, total customers, etc.
 *     tags: [Admin - Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
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
      totalCustomers,
      newToday,
      newThisWeek,
      newThisMonth,
      newThisYear,
      activeCustomers
    ] = await Promise.all([
      User.countDocuments({ role: UserRole.CUSTOMER }),
      User.countDocuments({ 
        role: UserRole.CUSTOMER, 
        createdAt: { $gte: startOfDay } 
      }),
      User.countDocuments({ 
        role: UserRole.CUSTOMER, 
        createdAt: { $gte: startOfWeek } 
      }),
      User.countDocuments({ 
        role: UserRole.CUSTOMER, 
        createdAt: { $gte: startOfMonth } 
      }),
      User.countDocuments({ 
        role: UserRole.CUSTOMER, 
        createdAt: { $gte: startOfYear } 
      }),
      User.countDocuments({ 
        role: UserRole.CUSTOMER,
        createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        newToday,
        newThisWeek,
        newThisMonth,
        newThisYear,
        activeCustomers
      }
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer statistics'
    });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer details (Admin)
 *     description: Retrieves detailed information about a specific customer
 *     tags: [Admin - Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details retrieved successfully
 *       404:
 *         description: Customer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await User.findOne({ _id: id, role: UserRole.CUSTOMER })
      .select('-password')
      .lean();

    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }

    // Get customer's orders
    const orders = await Order.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const totalOrders = await Order.countDocuments({ userId: id });
    const totalSpent = await Order.aggregate([
      { $match: { userId: id, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...customer,
        orders,
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer details'
    });
  }
});

export default router;
