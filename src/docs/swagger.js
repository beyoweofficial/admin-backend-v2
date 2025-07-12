const swaggerJsDoc = {
  openapi: "3.0.0",
  info: {
    title: "Crackers E-Commerce API",
    version: "1.0.0",
    description: "Admin Panel API Documentation (Auth, Banner, Category, Product)",
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          offerPrice: { type: "number" },
          inStock: { type: "boolean" },
          bestSeller: { type: "boolean" },
          tags: {
            type: "array",
            items: { type: "string" }
          },
        }
      },
      ProductDetailed: {
        type: "object",
        properties: {
          _id: { type: "string", description: "Product unique identifier" },
          name: { type: "string", description: "Product name" },
          description: { type: "string", description: "Product description" },
          price: { type: "number", description: "Original price" },
          offerPrice: { type: "number", description: "Discounted price (if applicable)" },
          categoryId: { 
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" }
            },
            description: "Category information"
          },
          subcategoryId: { 
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" }
            },
            description: "Subcategory information"
          },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string", format: "uri", description: "Image URL" },
                publicId: { type: "string", description: "Cloudinary public ID" }
              }
            },
            description: "Product images"
          },
          inStock: { type: "boolean", description: "Stock availability" },
          bestSeller: { type: "boolean", description: "Best seller flag" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Product tags"
          },
          createdAt: { type: "string", format: "date-time", description: "Creation timestamp" },
          updatedAt: { type: "string", format: "date-time", description: "Last update timestamp" },
          savings: { type: "number", description: "Amount saved if offer price exists" },
          savingsPercentage: { type: "number", description: "Percentage saved" },
          hasOffer: { type: "boolean", description: "Whether product has an offer" },
          finalPrice: { type: "number", description: "Final price (offer price or regular price)" },
          imageCount: { type: "integer", description: "Number of images" },
          tagCount: { type: "integer", description: "Number of tags" }
        }
      },
      Category: {
        type: "object",
        properties: {
          name: { type: "string" }
        }
      },
      Subcategory: {
        type: "object",
        properties: {
          name: { type: "string" },
          categoryId: { type: "string" }
        }
      },
      Banner: {
        type: "object",
        properties: {
          _id: { type: "string" },
          imageUrl: { type: "string", format: "uri" },
          publicId: { type: "string" },
          type: { 
            type: "string", 
            enum: ["landscape", "portrait"] 
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      BannerListResponse: {
        type: "object",
        properties: {
          banners: {
            type: "array",
            items: { $ref: "#/components/schemas/Banner" }
          },
          total: { type: "integer" },
          page: { type: "integer" },
          pages: { type: "integer" },
          hasNext: { type: "boolean" },
          hasPrev: { type: "boolean" }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Admin Login",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "JWT returned on successful login" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/categories": {
      post: {
        tags: ["Category"],
        summary: "Create category",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Category" },
            },
          },
        },
        responses: {
          201: { description: "Category created" },
        },
      },
      get: {
        tags: ["Category"],
        summary: "List all categories",
        responses: {
          200: { description: "Success" },
        },
      },
    },
    "/categories/{id}": {
      put: {
        tags: ["Category"],
        summary: "Update category",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Category" },
            },
          },
        },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Category"],
        summary: "Delete category",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Deleted" } },
      },
    },
    "/subcategories": {
      post: {
        tags: ["Subcategory"],
        summary: "Create subcategory",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Subcategory" },
            },
          },
        },
        responses: { 201: { description: "Subcategory created" } },
      },
      get: {
        tags: ["Subcategory"],
        summary: "List all subcategories (with category)",
        responses: { 200: { description: "Success" } },
      },
    },
    "/subcategories/{categoryId}": {
      get: {
        tags: ["Subcategory"],
        summary: "Get subcategories by categoryId",
        parameters: [
          { name: "categoryId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Success" } },
      },
    },
    "/products": {
      post: {
        tags: ["Product"],
        summary: "Create product",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  offerPrice: { type: "number" },
                  categoryId: { type: "string" },
                  subcategoryId: { type: "string" },
                  inStock: { type: "boolean" },
                  bestSeller: { type: "boolean" },
                  tags: { type: "string" },
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Product created" } },
      },
      get: {
        tags: ["Product"],
        summary: "List products with filter/pagination",
        parameters: [
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "tag", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "List of products" } },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Product"],
        summary: "Get product by ID - Detailed view",
        description: "Retrieve a single product with all details including images, category, subcategory, and calculated fields like savings and final price",
        parameters: [
          { 
            name: "id", 
            in: "path", 
            required: true, 
            schema: { type: "string" },
            description: "Product unique identifier (MongoDB ObjectId)"
          }
        ],
        responses: {
          200: {
            description: "Product details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", description: "Success flag" },
                    product: { $ref: "#/components/schemas/ProductDetailed" }
                  }
                },
                example: {
                  success: true,
                  product: {
                    _id: "60d21b4667d0d8992e610c85",
                    name: "Premium Wireless Headphones",
                    description: "High-quality wireless headphones with noise cancellation",
                    price: 299.99,
                    offerPrice: 249.99,
                    categoryId: {
                      _id: "60d21b4667d0d8992e610c80",
                      name: "Electronics"
                    },
                    subcategoryId: {
                      _id: "60d21b4667d0d8992e610c81",
                      name: "Audio"
                    },
                    images: [
                      {
                        url: "https://res.cloudinary.com/demo/image/upload/v1/products/headphones1.jpg",
                        publicId: "products/headphones1"
                      },
                      {
                        url: "https://res.cloudinary.com/demo/image/upload/v1/products/headphones2.jpg",
                        publicId: "products/headphones2"
                      }
                    ],
                    inStock: true,
                    bestSeller: true,
                    tags: ["wireless", "noise-cancelling", "premium"],
                    createdAt: "2023-06-22T10:30:00.000Z",
                    updatedAt: "2023-06-22T15:45:00.000Z",
                    savings: 50,
                    savingsPercentage: 17,
                    hasOffer: true,
                    finalPrice: 249.99,
                    imageCount: 2,
                    tagCount: 3
                  }
                }
              }
            }
          },
          400: {
            description: "Invalid product ID format",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Invalid product ID format"
                }
              }
            }
          },
          404: {
            description: "Product not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                },
                example: {
                  message: "Product not found"
                }
              }
            }
          },
          500: {
            description: "Failed to fetch product details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    error: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },
      put: {
        tags: ["Product"],
        summary: "Update product (without image)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" },
            },
          },
        },
        responses: { 200: { description: "Product updated" } },
      },
      delete: {
        tags: ["Product"],
        summary: "Delete product",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Deleted" } },
      },
    },
    "/products/dashboard/stats": {
      get: {
        tags: ["Product"],
        summary: "Get dashboard product statistics",
        description: "Retrieve comprehensive statistics for the admin dashboard including product counts, stock status, and pricing information",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalProducts: { type: "integer", description: "Total number of products" },
                    bestSellers: { type: "integer", description: "Number of products marked as best sellers" },
                    outOfStock: { type: "integer", description: "Number of products that are out of stock" },
                    inStock: { type: "integer", description: "Number of products that are in stock" },
                    productsWithOffer: { type: "integer", description: "Number of products with offer price" },
                    productsOriginalPrice: { type: "number", description: "Total value of all products at original price" }
                  }
                },
                example: {
                  totalProducts: 150,
                  bestSellers: 25,
                  outOfStock: 12,
                  inStock: 138,
                  productsWithOffer: 45,
                  productsOriginalPrice: 125000
                }
              }
            }
          },
          401: {
            description: "Unauthorized - Invalid or missing token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          500: {
            description: "Failed to fetch dashboard statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    error: { type: "string" }
                  }
                }
              }
            }
          }
        },
      },
    },
    "/products/stats/categories": {
      get: {
        tags: ["Product"],
        summary: "Get product counts by category and subcategory",
        description: "Retrieve aggregated product counts by category and subcategory for efficient frontend display",
        responses: {
          200: {
            description: "Category statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalProducts: { 
                      type: "integer", 
                      description: "Total number of products in the system" 
                    },
                    categoryCounts: {
                      type: "array",
                      description: "List of categories with their product counts",
                      items: {
                        type: "object",
                        properties: {
                          _id: { 
                            type: "string", 
                            description: "Category ID" 
                          },
                          categoryId: { 
                            type: "string", 
                            description: "Category ID (duplicate for convenience)" 
                          },
                          categoryName: { 
                            type: "string", 
                            description: "Name of the category" 
                          },
                          totalProducts: { 
                            type: "integer", 
                            description: "Total number of products in this category" 
                          },
                          directProducts: { 
                            type: "integer", 
                            description: "Products directly in this category (not in subcategories)" 
                          },
                          subcategoryProducts: { 
                            type: "integer", 
                            description: "Products in subcategories of this category" 
                          }
                        }
                      }
                    },
                    subcategoryCounts: {
                      type: "array",
                      description: "List of subcategories with their product counts",
                      items: {
                        type: "object",
                        properties: {
                          _id: { 
                            type: "string", 
                            description: "Subcategory ID" 
                          },
                          subcategoryId: { 
                            type: "string", 
                            description: "Subcategory ID (duplicate for convenience)" 
                          },
                          subcategoryName: { 
                            type: "string", 
                            description: "Name of the subcategory" 
                          },
                          categoryId: { 
                            type: "string", 
                            description: "ID of the parent category" 
                          },
                          categoryName: { 
                            type: "string", 
                            description: "Name of the parent category" 
                          },
                          productCount: { 
                            type: "integer", 
                            description: "Number of products in this subcategory" 
                          }
                        }
                      }
                    }
                  }
                },
                example: {
                  totalProducts: 120,
                  categoryCounts: [
                    {
                      "_id": "60d21b4667d0d8992e610c85",
                      "categoryId": "60d21b4667d0d8992e610c85",
                      "categoryName": "Electronics",
                      "totalProducts": 45,
                      "directProducts": 10,
                      "subcategoryProducts": 35
                    },
                    {
                      "_id": "60d21b4667d0d8992e610c86",
                      "categoryId": "60d21b4667d0d8992e610c86",
                      "categoryName": "Clothing",
                      "totalProducts": 75,
                      "directProducts": 25,
                      "subcategoryProducts": 50
                    }
                  ],
                  subcategoryCounts: [
                    {
                      "_id": "60d21b4667d0d8992e610c90",
                      "subcategoryId": "60d21b4667d0d8992e610c90",
                      "subcategoryName": "Smartphones",
                      "categoryId": "60d21b4667d0d8992e610c85",
                      "categoryName": "Electronics",
                      "productCount": 20
                    },
                    {
                      "_id": "60d21b4667d0d8992e610c91",
                      "subcategoryId": "60d21b4667d0d8992e610c91",
                      "subcategoryName": "Laptops",
                      "categoryId": "60d21b4667d0d8992e610c85",
                      "categoryName": "Electronics",
                      "productCount": 15
                    }
                  ]
                }
              }
            }
          },
          500: {
            description: "Failed to fetch category statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    error: { type: "string" }
                  }
                }
              }
            }
          }
        },
      },
    },
    "/banners": {
      get: {
        tags: ["Banner"],
        summary: "List all banners with pagination and filtering",
        parameters: [
          {
            name: "type",
            in: "query",
            description: "Filter by banner type",
            required: false,
            schema: {
              type: "string",
              enum: ["landscape", "portrait"]
            }
          },
          {
            name: "page",
            in: "query",
            description: "Page number (default: 1)",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              default: 1
            }
          },
          {
            name: "limit",
            in: "query",
            description: "Items per page (default: 10)",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 10
            }
          }
        ],
        responses: {
          200: {
            description: "List of banners retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BannerListResponse" },
                example: {
                  banners: [
                    {
                      _id: "507f1f77bcf86cd799439011",
                      imageUrl: "https://res.cloudinary.com/example/image/upload/v1234567890/banners/sample.jpg",
                      publicId: "banners/sample",
                      type: "landscape",
                      createdAt: "2024-01-15T10:30:00.000Z",
                      updatedAt: "2024-01-15T10:30:00.000Z"
                    },
                    {
                      _id: "507f1f77bcf86cd799439012",
                      imageUrl: "https://res.cloudinary.com/example/image/upload/v1234567891/banners/sample2.jpg",
                      publicId: "banners/sample2",
                      type: "portrait",
                      createdAt: "2024-01-14T09:15:00.000Z",
                      updatedAt: "2024-01-14T09:15:00.000Z"
                    }
                  ],
                  total: 15,
                  page: 1,
                  pages: 2,
                  hasNext: true,
                  hasPrev: false
                }
              }
            }
          },
          500: {
            description: "Failed to fetch banners",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    error: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Banner"],
        summary: "Upload banner images (max 5)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  banners: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                  type: {
                    type: "string",
                    enum: ["landscape", "portrait"],
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Uploaded" } },
      },
    },
    "/banners/{id}": {
      put: {
        tags: ["Banner"],
        summary: "Replace banner image",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  banner: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Banner"],
        summary: "Delete banner",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Deleted" } },
      },
    },
  },
};

module.exports = swaggerJsDoc;
