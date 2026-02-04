import { User, UserRole } from '../models/user';
import { Order } from '../models/order';
import { Category } from '../models/category';
import { Product } from '../models/product';

// Notification utility functions for backend
export const createNotification = {
  // Product notifications
  product: {
    created: async (productName: string, productId: string) => {
      try {
        // Get all admin users to notify
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        
        // Here you could store notifications in a database or emit events
        // For now, we'll just log the notification
        console.log(`📦 New Product Created: "${productName}" by ${adminUsers.length} admin(s) notified`);
        
        // In a real implementation, you would:
        // 1. Save notification to database
        // 2. Emit WebSocket event to connected admin clients
        // 3. Send email notifications if configured
        
        return {
          type: 'product',
          action: 'created',
          entityId: productId,
          entityName: productName,
          message: `Product "${productName}" has been added to the catalog`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating product notification:', error);
        return null;
      }
    },
    
    updated: async (productName: string, productId: string) => {
      try {
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        console.log(`📦 Product Updated: "${productName}" by ${adminUsers.length} admin(s) notified`);
        
        return {
          type: 'product',
          action: 'updated',
          entityId: productId,
          entityName: productName,
          message: `Product "${productName}" has been updated`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating product update notification:', error);
        return null;
      }
    },
    
    deleted: async (productName: string, productId: string) => {
      try {
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        console.log(`📦 Product Deleted: "${productName}" by ${adminUsers.length} admin(s) notified`);
        
        return {
          type: 'product',
          action: 'deleted',
          entityId: productId,
          entityName: productName,
          message: `Product "${productName}" has been removed from the catalog`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating product deletion notification:', error);
        return null;
      }
    }
  },
  
  // Category notifications
  category: {
    created: async (categoryName: string, categoryId: string) => {
      try {
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        console.log(`📁 New Category Created: "${categoryName}" by ${adminUsers.length} admin(s) notified`);
        
        return {
          type: 'category',
          action: 'created',
          entityId: categoryId,
          entityName: categoryName,
          message: `Category "${categoryName}" has been added`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating category notification:', error);
        return null;
      }
    },
    
    updated: async (categoryName: string, categoryId: string) => {
      try {
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        console.log(`📁 Category Updated: "${categoryName}" by ${adminUsers.length} admin(s) notified`);
        
        return {
          type: 'category',
          action: 'updated',
          entityId: categoryId,
          entityName: categoryName,
          message: `Category "${categoryName}" has been updated`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating category update notification:', error);
        return null;
      }
    },
    
    deleted: async (categoryName: string, categoryId: string) => {
      try {
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        console.log(`📁 Category Deleted: "${categoryName}" by ${adminUsers.length} admin(s) notified`);
        
        return {
          type: 'category',
          action: 'deleted',
          entityId: categoryId,
          entityName: categoryName,
          message: `Category "${categoryName}" has been removed`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating category deletion notification:', error);
        return null;
      }
    }
  },
  
  // Customer notifications
  customer: {
    created: async (customerName: string, customerId: string) => {
      try {
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        console.log(`👤 New Customer Registered: "${customerName}" by ${adminUsers.length} admin(s) notified`);
        
        return {
          type: 'user',
          action: 'created',
          entityId: customerId,
          entityName: customerName,
          message: `Customer "${customerName}" has joined the platform`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating customer notification:', error);
        return null;
      }
    }
  },
  
  // Order notifications
  order: {
    created: async (orderNumber: string, orderId: string, customerName?: string) => {
      try {
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        console.log(`🛒 New Order Received: ${orderNumber} by ${adminUsers.length} admin(s) notified`);
        
        return {
          type: 'order',
          action: 'pending',
          entityId: orderId,
          entityName: orderNumber,
          message: `Order ${orderNumber} has been placed${customerName ? ` by ${customerName}` : ''}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating order notification:', error);
        return null;
      }
    },
    
    updated: async (orderNumber: string, orderId: string, status: string) => {
      try {
        const adminUsers = await User.find({ role: UserRole.ADMIN });
        console.log(`🛒 Order ${status}: ${orderNumber} by ${adminUsers.length} admin(s) notified`);
        
        return {
          type: 'order',
          action: status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'updated',
          entityId: orderId,
          entityName: orderNumber,
          message: `Order ${orderNumber} has been ${status.toLowerCase()}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error creating order update notification:', error);
        return null;
      }
    }
  }
};

// Helper function to get notification priority
export const getNotificationPriority = (type: string, action: string): 'low' | 'medium' | 'high' => {
  switch (type) {
    case 'order':
      if (action === 'pending' || action === 'cancelled') return 'high';
      if (action === 'completed') return 'medium';
      return 'medium';
    case 'product':
      if (action === 'deleted') return 'high';
      if (action === 'created') return 'medium';
      return 'low';
    case 'category':
      if (action === 'deleted') return 'high';
      if (action === 'created') return 'medium';
      return 'low';
    case 'user':
      return 'medium';
    default:
      return 'low';
  }
};
