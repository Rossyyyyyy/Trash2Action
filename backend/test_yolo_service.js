/**
 * Test script for YOLOv8 Waste Detection Service
 * 
 * Usage: node test_yolo_service.js [image_path]
 * Example: node test_yolo_service.js test_waste.jpg
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const YOLO_SERVICE_URL = process.env.YOLO_SERVICE_URL || 'http://localhost:5001';

async function testHealthCheck() {
  console.log('\n🔍 Testing health check...');
  try {
    const response = await axios.get(`${YOLO_SERVICE_URL}/health`);
    console.log('✅ Health check passed');
    console.log('   Status:', response.data.status);
    console.log('   Model loaded:', response.data.model_loaded);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testDetection(imagePath) {
  console.log('\n🔍 Testing waste detection...');
  
  if (!imagePath) {
    console.log('⚠️  No image path provided, skipping detection test');
    console.log('   Usage: node test_yolo_service.js <image_path>');
    return;
  }

  if (!fs.existsSync(imagePath)) {
    console.log('❌ Image file not found:', imagePath);
    return;
  }

  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const response = await axios.post(`${YOLO_SERVICE_URL}/detect`, formData, {
      headers: formData.getHeaders(),
      timeout: 10000
    });

    if (response.data.success) {
      console.log('✅ Detection successful');
      console.log('\n📊 Results:');
      console.log('   Waste Type:', response.data.result.wasteType);
      console.log('   Category:', response.data.result.category);
      console.log('   Confidence:', response.data.result.confidence + '%');
      console.log('   Recommendation:', response.data.result.recommendation);
    } else {
      console.log('❌ Detection failed:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Detection error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.message);
    }
  }
}

async function testClasses() {
  console.log('\n🔍 Testing classes endpoint...');
  try {
    const response = await axios.get(`${YOLO_SERVICE_URL}/classes`);
    if (response.data.success) {
      console.log('✅ Classes retrieved');
      console.log('   Available classes:', response.data.classes.join(', '));
    }
  } catch (error) {
    console.log('❌ Classes test failed:', error.message);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  YOLOv8 Waste Detection Service Test Suite    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('\n🎯 Target URL:', YOLO_SERVICE_URL);

  const imagePath = process.argv[2];

  // Run tests
  const healthOk = await testHealthCheck();
  
  if (healthOk) {
    await testClasses();
    await testDetection(imagePath);
  } else {
    console.log('\n⚠️  Service is not running or not accessible');
    console.log('   Make sure to start the YOLOv8 service first:');
    console.log('   python yolov8_service.py');
  }

  console.log('\n' + '═'.repeat(50));
  console.log('Test suite completed');
  console.log('═'.repeat(50) + '\n');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
