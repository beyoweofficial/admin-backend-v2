/**
 * Test script to validate Swagger documentation
 */

try {
  console.log('Testing Swagger JSON syntax...');
  const swagger = require('./src/docs/swagger.js');
  
  console.log('✅ Swagger JSON is valid');
  console.log('Total paths:', Object.keys(swagger.paths).length);
  
  const bannerPaths = Object.keys(swagger.paths).filter(p => p.includes('banner'));
  console.log('Banner endpoints:', bannerPaths);
  
  // Check if GET /banners endpoint exists
  if (swagger.paths['/banners'] && swagger.paths['/banners'].get) {
    console.log('✅ GET /banners endpoint found in Swagger');
    console.log('Parameters:', swagger.paths['/banners'].get.parameters?.length || 0);
    console.log('Responses:', Object.keys(swagger.paths['/banners'].get.responses));
  } else {
    console.log('❌ GET /banners endpoint not found');
  }
  
  // Check schemas
  const schemas = Object.keys(swagger.components.schemas);
  console.log('Available schemas:', schemas);
  
  console.log('✅ Swagger test completed successfully!');
} catch (error) {
  console.error('❌ Swagger JSON validation failed:', error.message);
  console.error('Error details:', error);
}