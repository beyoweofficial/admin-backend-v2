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
        summary: "Get dashboard product stats",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Stats summary" } },
      },
    },
    "/banners": {
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
