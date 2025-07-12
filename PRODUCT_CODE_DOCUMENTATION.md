# Product Code Feature Documentation

## Overview
The Product Code feature has been implemented to ensure every product has a unique identifier that prevents duplicate products from being created.

## Features

### ✅ **Mandatory Field**
- Every product **MUST** have a product code
- Cannot create or update a product without a valid product code
- Returns clear error message if missing

### ✅ **Unique Constraint**
- No two products can have the same product code
- Database-level uniqueness enforcement
- Prevents duplicate codes across all products

### ✅ **Alphanumeric Only**
- Accepts only letters (A-Z) and numbers (0-9)
- No special characters allowed (-, _, !, @, etc.)
- Validation happens before saving to database

### ✅ **Auto-Uppercase Conversion**
- All product codes are automatically converted to uppercase
- Input: `abc123` → Stored: `ABC123`
- Ensures consistency across the system

## API Endpoints

### 1. **Create Product** - `POST /api/products`
```json
{
  "productCode": "ABC123",
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "categoryId": "category_id",
  "subcategoryId": "subcategory_id"
}
```

**Response:**
- ✅ Success: Returns created product with uppercase product code
- ❌ Error 400: Missing product code
- ❌ Error 409: Product code already exists

### 2. **Update Product** - `PUT /api/products/:id`
```json
{
  "productCode": "XYZ789",
  "name": "Updated Product Name"
}
```

**Response:**
- ✅ Success: Returns updated product
- ❌ Error 409: Product code already exists (if changing to existing code)

### 3. **Check Product Code Availability** - `GET /api/products/check-code/:productCode`

Example: `GET /api/products/check-code/ABC123`

**Response:**
```json
{
  "productCode": "ABC123",
  "isAvailable": false,
  "message": "Product code is already taken"
}
```

### 4. **Get Product by ID** - `GET /api/products/:id`
Now includes `productCode` in the response:
```json
{
  "success": true,
  "product": {
    "_id": "product_id",
    "productCode": "ABC123",
    "name": "Product Name",
    // ... other fields
  }
}
```

### 5. **Search Products** - `GET /api/products?search=query`
Now searches both product name AND product code:
- Search for "ABC" will find products with names containing "ABC" OR product codes containing "ABC"

## Error Handling

### 400 - Bad Request
```json
{
  "message": "Product code is required"
}
```

### 409 - Conflict (Duplicate)
```json
{
  "message": "Product code already exists. Please use a unique code."
}
```

### 400 - Validation Error
```json
{
  "message": "Validation failed",
  "errors": ["Product code must contain only letters and numbers"]
}
```

## Database Schema Changes

### Product Model Updates:
```javascript
{
  productCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]+$/.test(v);
      },
      message: 'Product code must contain only letters and numbers'
    }
  },
  // ... existing fields
}
```

### Database Indexes:
- Unique index on `productCode` for performance
- Text search index on `name` and `productCode`

## Usage Examples

### ✅ Valid Product Codes:
- `ABC123`
- `PROD001`
- `XYZ789`
- `ITEM2024`
- `CAT1DOG2`

### ❌ Invalid Product Codes:
- `ABC-123` (contains hyphen)
- `PROD_001` (contains underscore)
- `XYZ@789` (contains special character)
- `ITEM 2024` (contains space)
- `` (empty string)

## Testing

Run the test script to verify functionality:
```bash
node test-product-code.js
```

This will test:
- ✅ Valid product code creation
- ✅ Duplicate prevention
- ✅ Invalid character rejection
- ✅ Uppercase conversion

## Migration for Existing Products

If you have existing products without product codes, you'll need to:

1. **Add product codes to existing products:**
```javascript
// Example migration script
const products = await Product.find({ productCode: { $exists: false } });
for (let i = 0; i < products.length; i++) {
  const product = products[i];
  product.productCode = `PROD${String(i + 1).padStart(4, '0')}`;
  await product.save();
}
```

2. **Or run a more sophisticated migration based on your naming convention**

## Frontend Integration Tips

### Form Validation:
```javascript
// JavaScript regex for client-side validation
const productCodeRegex = /^[A-Za-z0-9]+$/;

function validateProductCode(code) {
  if (!code) return "Product code is required";
  if (!productCodeRegex.test(code)) return "Only letters and numbers allowed";
  if (code.length < 3) return "Minimum 3 characters required";
  if (code.length > 20) return "Maximum 20 characters allowed";
  return null; // Valid
}
```

### Real-time Availability Check:
```javascript
async function checkCodeAvailability(productCode) {
  const response = await fetch(`/api/products/check-code/${productCode}`);
  const data = await response.json();
  return data.isAvailable;
}
```

## Conclusion

The Product Code feature ensures data integrity and prevents duplicate products while maintaining a user-friendly experience with clear validation messages and automatic formatting.