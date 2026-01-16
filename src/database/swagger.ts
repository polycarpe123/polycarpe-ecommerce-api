import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Authenticated CRUD API with RBAC',
      version: '1.0.0',
      description: 'Complete REST API with Authentication, Categories, Products, Cart, and Role-Based Access Control',
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
        url: 'https://polycarpe-ecommerce-api.onrender.com/',
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
        // User schemas
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
        // Category schemas
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
        // Product schemas
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
        // Cart schemas
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
        // Generic responses
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
      }
    ]
  },
  apis: ['./src/routes/*.ts'] 
};

export const swaggerSpec = swaggerJsdoc(options);