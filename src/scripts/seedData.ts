import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/user';
import { connectDatabase } from '../database/database';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDatabase();

    console.log('🌱 Seeding users...');

    // Clear existing users
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    const hashedPassword = await bcrypt.hash('Password123', 10);

    const users = [
      {
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      },
      {
        email: 'vendor@example.com',
        password: hashedPassword,
        firstName: 'Vendor',
        lastName: 'User',
        role: 'vendor'
      },
      {
        email: 'customer1@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      },
      {
        email: 'customer2@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer'
      },
      {
        email: 'customer3@example.com',
        password: hashedPassword,
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'customer'
      }
    ];

    await User.insertMany(users);
    console.log(`✅ Seeded ${users.length} users`);
    console.log('   Login credentials: email / Password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedUsers();