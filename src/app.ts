import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './database/swagger';
import { connectDatabase } from './database/database';
import emailService from './services/emailService';
import cloudinaryRoutes from './routes/cloudinaryRoutes';
import { testCloudinaryConnection } from './database/cloudinary';
import productStatsRoutes from './routes/productStatsRoutes';
import reviewRoutes from './routes/reviewRoutes';

// Import routes
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import adminOrderRoutes from './routes/adminOrderRoutes';

import uploadRoutes from './routes/uploadRoutes';
import customerRoutes from './routes/customerRoutes';
import notificationRoutes from './routes/notificationRoutes';
import path from 'path';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());


// CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Swagger Documentation
// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Documentation'
}));

// Swagger JSON
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated CRUD API with MongoDB and RBAC',
    version: '2.0.0',
    database: 'MongoDB',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/auth/users',
      categories: '/api/categories',
      products: '/api/products',
      cart: '/api/cart',
      cloudinary: '/api/cloudinary'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/productsStats', productStatsRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    await testCloudinaryConnection(); 
    
    app.listen(PORT, () => {
      
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Base URL: http://localhost:${PORT}`);
      console.log(`https://polycarpe-ecommerce-api.onrender.com/api-docs`);
      console.log('\n');
      console.log('Available endpoints:');
      console.log('  Auth:       /api/auth');
      console.log('  Users:      /api/auth/users');
      console.log('  Categories: /api/categories');
      console.log('  Products:   /api/products');
      console.log('  Cart:       /api/cart');
      
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;