// Test script to check if live scan detection is working
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testYOLOService() {
  console.log('\n🧪 Testing YOLOv8 Service...\n');

  // Test 1: Health check
  try {
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('✅ Health check:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('⚠️  Make sure YOLOv8 service is running: python yolov8_service.py');
    return;
  }

  // Test 2: Check if we have a test image
  const testImagePath = path.join(__dirname, 'uploads', 'newsfeed');
  let testImage = null;

  try {
    const files = fs.readdirSync(testImagePath);
    const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    
    if (imageFiles.length > 0) {
      testImage = path.join(testImagePath, imageFiles[0]);
      console.log(`\n2️⃣ Using test image: ${imageFiles[0]}`);
    }
  } catch (error) {
    console.log('⚠️  No test images found in uploads/newsfeed');
  }

  if (!testImage || !fs.existsSync(testImage)) {
    console.log('⚠️  No test image available. Please add an image to backend/uploads/newsfeed/');
    return;
  }

  // Test 3: Test real-time detection endpoint
  try {
    console.log('\n3️⃣ Testing real-time detection...');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImage));

    const response = await axios.post('http://localhost:5001/detect-multiple', formData, {
      headers: formData.getHeaders(),
      timeout: 10000
    });

    console.log('✅ Detection response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.detections) {
      console.log(`\n📦 Found ${response.data.detections.length} objects:`);
      response.data.detections.forEach((det, i) => {
        console.log(`   ${i + 1}. ${det.label} (${(det.confidence * 100).toFixed(1)}%)`);
      });
    }
  } catch (error) {
    console.log('❌ Detection test failed:', error.message);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }

  console.log('\n✅ Test complete!\n');
}

testYOLOService();
