import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Review } from '../models/review';
import { Product } from '../models/product';
import { User } from '../models/user';
import { connectDatabase } from '../database/database';

dotenv.config();

const seedReviews = async () => {
  try {
    await connectDatabase();

    console.log('🌱 Seeding reviews...');

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('✅ Cleared existing reviews');

    // Get customers and products
    const customers = await User.find({ role: 'customer' });
    const products = await Product.find().limit(5);

    if (customers.length === 0 || products.length === 0) {
      console.error('❌ No customers or products found. Run other seeds first.');
      process.exit(1);
    }

    const reviews = [];

    // Create reviews
    for (const product of products) {
      for (let i = 0; i < Math.min(customers.length, 3); i++) {
        reviews.push({
          productId: product._id,
          userId: customers[i]._id,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
          comment: `Great product! I'm very satisfied with my purchase of ${product.name}.`
        });
      }
    }

    await Review.insertMany(reviews);
    console.log(`✅ Seeded ${reviews.length} reviews`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedReviews();