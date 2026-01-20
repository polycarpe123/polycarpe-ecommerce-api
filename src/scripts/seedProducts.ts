import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { User } from '../models/user';
import { connectDatabase } from '../database/database';

dotenv.config();

const seedProducts = async () => {
  try {
    await connectDatabase();

    console.log('🌱 Seeding products...');

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Run seed:users first.');
      process.exit(1);
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');

    // Get categories
    const categories = await Category.find();
    if (categories.length === 0) {
      console.error('❌ No categories found. Create categories first.');
      process.exit(1);
    }

    const categoryId = categories[0]._id.toString();

    const products = [
      {
        name: 'iPhone 15 Pro',
        price: 999.99,
        description: 'Latest Apple smartphone with A17 Pro chip',
        categoryId,
        inStock: true,
        quantity: 50,
        createdBy: admin._id.toString()
      },
      {
        name: 'MacBook Pro 16"',
        price: 2499.99,
        description: 'Powerful laptop for professionals',
        categoryId,
        inStock: true,
        quantity: 25,
        createdBy: admin._id.toString()
      },
      {
        name: 'AirPods Pro',
        price: 249.99,
        description: 'Wireless earbuds with active noise cancellation',
        categoryId,
        inStock: true,
        quantity: 100,
        createdBy: admin._id.toString()
      },
      {
        name: 'iPad Air',
        price: 599.99,
        description: 'Versatile tablet for work and play',
        categoryId,
        inStock: true,
        quantity: 40,
        createdBy: admin._id.toString()
      },
      {
        name: 'Apple Watch Series 9',
        price: 399.99,
        description: 'Advanced smartwatch with health tracking',
        categoryId,
        inStock: true,
        quantity: 60,
        createdBy: admin._id.toString()
      },
      {
        name: 'Magic Keyboard',
        price: 99.99,
        description: 'Wireless keyboard for Mac',
        categoryId,
        inStock: true,
        quantity: 75,
        createdBy: admin._id.toString()
      },
      {
        name: 'Magic Mouse',
        price: 79.99,
        description: 'Wireless mouse with multi-touch surface',
        categoryId,
        inStock: false,
        quantity: 0,
        createdBy: admin._id.toString()
      },
      {
        name: 'HomePod mini',
        price: 99.99,
        description: 'Smart speaker with Siri',
        categoryId,
        inStock: true,
        quantity: 5,
        createdBy: admin._id.toString()
      },
      {
        name: 'Apple TV 4K',
        price: 179.99,
        description: 'Streaming device with 4K HDR',
        categoryId,
        inStock: true,
        quantity: 30,
        createdBy: admin._id.toString()
      },
      {
        name: 'AirTag',
        price: 29.99,
        description: 'Item tracker',
        categoryId,
        inStock: true,
        quantity: 200,
        createdBy: admin._id.toString()
      }
    ];

    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} products`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedProducts();