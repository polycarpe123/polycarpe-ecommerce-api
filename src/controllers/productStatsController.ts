import { Request, Response } from 'express';
import { Product } from '../models/product';

// Get product statistics
export const getProductStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$categoryId',
          totalProducts: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalStock: { $sum: '$quantity' }
        }
      },
      {
        $sort: { totalProducts: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product statistics'
    });
  }
};

// Get top products by price
export const getTopProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topProducts = await Product.find()
      .sort({ price: -1 })
      .limit(limit)
      .select('name price description categoryId inStock quantity');

    res.status(200).json({
      success: true,
      count: topProducts.length,
      data: topProducts
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top products'
    });
  }
};

// Get low stock products
export const getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;

    const lowStockProducts = await Product.find({
      quantity: { $lte: threshold }
    })
      .sort({ quantity: 1 })
      .select('name price quantity inStock categoryId');

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      threshold,
      data: lowStockProducts
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get low stock products'
    });
  }
};

// Get price distribution
export const getPriceDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    const distribution = await Product.aggregate([
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 50, 100, 500, 1000, 5000],
          default: '5000+',
          output: {
            count: { $sum: 1 },
            products: {
              $push: {
                name: '$name',
                price: '$price'
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Get price distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get price distribution'
    });
  }
};
