import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API with RBAC',
      version: '1.0.0',
      description: 'Complete REST API with Authentication, Categories, Products, Cart, Orders, File Upload, and Role-Based Access Control',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://polycarpe-ecommerce-api.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        // USER SCHEMAS 
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'vendor', 'customer'],
              description: 'User role'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              minLength: 8,
              example: 'SecurePass123'
            },
            firstName: {
              type: 'string',
              minLength: 2,
              example: 'John'
            },
            lastName: {
              type: 'string',
              minLength: 2,
              example: 'Doe'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              example: 'SecurePass123'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  description: 'JWT token'
                }
              }
            }
          }
        },

        // CATEGORY SCHEMAS 
        Category: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            createdBy: {
              type: 'string',
              description: 'User ID who created the category'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              example: 'Electronics'
            },
            description: {
              type: 'string',
              example: 'Electronic devices and gadgets'
            }
          }
        },

        // PRODUCT SCHEMAS 
        Product: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            price: {
              type: 'number',
              minimum: 0
            },
            description: {
              type: 'string'
            },
            categoryId: {
              type: 'string'
            },
            inStock: {
              type: 'boolean'
            },
            quantity: {
              type: 'number',
              minimum: 0
            },
            createdBy: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CreateProductRequest: {
          type: 'object',
          required: ['name', 'price', 'categoryId', 'inStock', 'quantity'],
          properties: {
            name: {
              type: 'string',
              example: 'iPhone 15 Pro'
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 999.99
            },
            description: {
              type: 'string',
              example: 'Latest Apple smartphone'
            },
            categoryId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            inStock: {
              type: 'boolean',
              example: true
            },
            quantity: {
              type: 'number',
              minimum: 0,
              example: 50
            }
          }
        },

        //  CART SCHEMAS 
        CartItem: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            productId: {
              type: 'string'
            },
            productName: {
              type: 'string'
            },
            price: {
              type: 'number'
            },
            quantity: {
              type: 'number'
            },
            subtotal: {
              type: 'number'
            },
            addedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            userId: {
              type: 'string'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              }
            },
            total: {
              type: 'number'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AddToCartRequest: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            quantity: {
              type: 'number',
              minimum: 1,
              example: 2
            }
          }
        },

        // ORDER SCHEMAS 
        OrderItem: {
          type: 'object',
          required: ['productId', 'productName', 'price', 'quantity', 'subtotal'],
          properties: {
            productId: {
              type: 'string',
              description: 'Product ID',
              example: '507f1f77bcf86cd799439011'
            },
            productName: {
              type: 'string',
              description: 'Product name at time of order',
              example: 'Laptop Pro 15'
            },
            price: {
              type: 'number',
              minimum: 0,
              description: 'Unit price at time of order',
              example: 1299.99
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity ordered',
              example: 2
            },
            subtotal: {
              type: 'number',
              minimum: 0,
              description: 'Price × quantity',
              example: 2599.98
            }
          }
        },
        Order: {
          type: 'object',
          required: ['_id', 'userId', 'items', 'total', 'status', 'createdAt', 'updatedAt'],
          properties: {
            _id: {
              type: 'string',
              description: 'Order ID',
              example: '507f1f77bcf86cd799439011'
            },
            userId: {
              type: 'string',
              description: 'User ID who placed the order',
              example: '507f191e810c19729de860ea'
            },
            items: {
              type: 'array',
              description: 'Array of order items',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            },
            total: {
              type: 'number',
              minimum: 0,
              description: 'Total order amount',
              example: 2599.98
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
              description: 'Current order status',
              example: 'pending'
            },
            shippingAddress: {
              type: 'string',
              description: 'Delivery address',
              example: '123 Main St, Apt 4B, New York, NY 10001'
            },
            notes: {
              type: 'string',
              description: 'Additional notes or instructions',
              example: 'Please leave package at front door'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
              example: '2026-01-19T10:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2026-01-19T10:30:00.000Z'
            }
          }
        },
        OrderWithUser: {
          allOf: [
            { $ref: '#/components/schemas/Order' },
            {
              type: 'object',
              properties: {
                userId: {
                  type: 'object',
                  description: 'Populated user information (admin view)',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '507f191e810c19729de860ea'
                    },
                    email: {
                      type: 'string',
                      example: 'customer@example.com'
                    },
                    firstName: {
                      type: 'string',
                      example: 'John'
                    },
                    lastName: {
                      type: 'string',
                      example: 'Doe'
                    }
                  }
                }
              }
            }
          ]
        },
        CreateOrderRequest: {
          type: 'object',
          properties: {
            shippingAddress: {
              type: 'string',
              minLength: 10,
              description: 'Shipping address (optional, minimum 10 characters if provided)',
              example: '123 Main St, Apt 4B, New York, NY 10001'
            },
            notes: {
              type: 'string',
              description: 'Additional delivery instructions (optional)',
              example: 'Please leave package at front door'
            }
          }
        },
        UpdateOrderStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
              description: 'New order status',
              example: 'confirmed'
            }
          }
        },
        OrderListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            count: {
              type: 'integer',
              description: 'Number of orders returned',
              example: 5
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Order'
              }
            }
          }
        },
        OrderResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              $ref: '#/components/schemas/Order'
            }
          }
        },
        OrderCreatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Order placed successfully'
            },
            data: {
              $ref: '#/components/schemas/Order'
            }
          }
        },
        OrderStatusUpdatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Order status updated successfully'
            },
            data: {
              $ref: '#/components/schemas/Order'
            }
          }
        },
        OrderCancelledResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Order cancelled successfully'
            },
            data: {
              $ref: '#/components/schemas/Order'
            }
          }
        },
        OrderErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Order not found'
            }
          }
        },

        // FILE UPLOAD SCHEMAS 
        FileUploadResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Profile image uploaded successfully'
            },
            data: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  example: '1642345678901-profile.jpg'
                },
                originalName: {
                  type: 'string',
                  example: 'profile.jpg'
                },
                mimeType: {
                  type: 'string',
                  example: 'image/jpeg'
                },
                size: {
                  type: 'integer',
                  example: 245678
                },
                url: {
                  type: 'string',
                  example: '/uploads/profiles/1642345678901-profile.jpg'
                }
              }
            }
          }
        },
        FileDeleteResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'File deleted successfully'
            }
          }
        },

        // GENERIC RESPONSES 
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'No token provided. Please login.'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission to perform this action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Access denied. Insufficient permissions.'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Validation failed'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management'
      },
      {
        name: 'Users',
        description: 'User management (Admin only)'
      },
      {
        name: 'Categories',
        description: 'Product categories management'
      },
      {
        name: 'Products',
        description: 'Products management'
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations'
      },
      {
        name: 'Orders',
        description: 'Customer order management'
      },
      {
        name: 'Admin - Orders',
        description: 'Admin order management endpoints'
      },
      {
        name: 'File Upload',
        description: 'File upload and management endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);