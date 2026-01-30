const mongoose = require('mongoose');
const Product = require('./src/models/product');
require('dotenv').config();

async function migrateProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate`);

    for (const product of products) {
      // Add missing fields with defaults
      if (!product.slug) {
        product.slug = product.name.toLowerCase().replace(/\s+/g, '-');
      }
      
      if (!product.sku) {
        product.sku = `PRD-${product._id.toString().slice(-6)}`;
      }
      
      if (product.featured === undefined) {
        product.featured = false;
      }
      
      if (product.rating === undefined) {
        product.rating = 0;
      }
      
      if (product.reviews === undefined) {
        product.reviews = 0;
      }
      
      if (!product.tags) {
        product.tags = [];
      }
      
      if (product.status === undefined) {
        product.status = 'active';
      }
      
      if (product.stock === undefined) {
        product.stock = product.quantity || 0;
      }

      await product.save();
      console.log(`Updated product: ${product.name}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateProducts();
