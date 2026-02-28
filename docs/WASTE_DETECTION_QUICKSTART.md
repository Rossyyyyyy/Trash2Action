# Waste Detection Quick Start Guide

Get the waste detection feature running in 5 minutes!

## Option 1: Demo Mode (No Setup Required) ⚡

The app works immediately with mock detection data.

1. **Start Backend**
```bash
cd backend
npm start
```

2. **Start Frontend**
```bash
cd frontend
npm start
```

3. **Use the Feature**
   - Open the app on your device/emulator
   - Navigate to Dashboard
   - Tap "Check Basura Type"
   - Take a photo or upload an image
   - View mock detection results

✅ That's it! The app will show simulated waste detection results.

## Option 2: Real AI Detection (Production) 🤖

For actual YOLOv8 AI-powered detection:

### Quick Setup

1. **Install Python Dependencies**
```bash
cd backend

# Windows
setup_yolo.bat

# Mac/Linux
chmod +x setup_yolo.sh
./setup_yolo.sh
```

2. **Start YOLOv8 Service**
```bash
python yolov8_service.py
```

You should see:
```
🚀 YOLOv8 Waste Detection Service
==================================================
Model Status: ✅ Loaded
Endpoint: http://localhost:5001/detect
Health Check: http://localhost:5001/health
==================================================
```

3. **Enable in Backend**

Edit `backend/.env`:
```env
YOLO_SERVICE_URL=http://localhost:5001/detect
```

4. **Start Backend**
```bash
npm start
```

5. **Test It**
```bash
# Test the YOLOv8 service
node test_yolo_service.js path/to/test_image.jpg
```

### Verify Setup

Check if everything is working:

```bash
# Test YOLOv8 service health
curl http://localhost:5001/health

# Expected response:
# {"status": "healthy", "model_loaded": true}
```

## Using the Feature

### In the App

1. **Navigate to Dashboard**
   - Login as a user
   - Go to the main dashboard

2. **Open Waste Scanner**
   - Tap the "Check Basura Type" button
   - Grant camera and media permissions if prompted

3. **Scan Waste**
   - **Option A**: Tap "Take Photo" to use camera
   - **Option B**: Tap "Upload Image" to select from gallery

4. **View Results**
   - Wait for AI analysis (2-5 seconds)
   - See waste type, category, and confidence
   - Read disposal recommendations

5. **Actions**
   - Tap "Retake" to scan another item
   - Tap "Done" to return to dashboard

### Tips for Best Results

📸 **Photography Tips:**
- Use good lighting
- Center the waste item in frame
- Keep camera steady
- Avoid blurry images
- Fill most of the frame with the waste item

🎯 **Detection Tips:**
- Clean items work better than dirty ones
- Single items are easier to detect than piles
- Common waste types have higher accuracy
- Try different angles if detection fails

## Troubleshooting

### "YOLOv8 service unavailable"

**Problem**: Backend can't connect to Python service

**Solutions**:
1. Check if Python service is running:
   ```bash
   curl http://localhost:5001/health
   ```

2. Verify YOLO_SERVICE_URL in `.env`

3. Check firewall settings

4. Review Python service logs

### "No waste detected"

**Problem**: AI couldn't identify the waste

**Solutions**:
1. Retake photo with better lighting
2. Center the waste item
3. Try a different angle
4. Ensure item is clearly visible
5. Check if waste type is in trained categories

### "Model not loaded"

**Problem**: YOLOv8 model failed to load

**Solutions**:
1. Check if model file exists
2. Verify Python dependencies installed
3. Check available memory (models need RAM)
4. Review Python service startup logs

### Permission Errors

**Problem**: Camera or media access denied

**Solutions**:
1. Grant permissions in app settings
2. Restart the app
3. Check device settings for app permissions

## What's Detected?

### Current Categories (Demo Mode)

- ♻️ **Recyclable**: Plastic bottles, paper, metal cans, glass
- 🌱 **Biodegradable**: Food waste, organic matter
- ⚠️ **Hazardous**: Electronics, batteries
- 🗑️ **Non-recyclable**: General waste

### With Trained Model

Detection accuracy depends on your trained model. Common waste datasets include:

- Plastic (bottles, bags, containers)
- Paper (cardboard, newspapers)
- Metal (cans, foil)
- Glass (bottles, jars)
- Organic (food waste, yard waste)
- Electronics (phones, batteries)
- Textiles (clothing, fabric)

## Next Steps

### Improve Detection

1. **Train Custom Model**
   - Collect local waste images
   - Annotate with correct categories
   - Train YOLOv8 on your dataset
   - See: `docs/WASTE_DETECTION_SETUP.md`

2. **Fine-tune Existing Model**
   - Start with pre-trained model
   - Add your specific waste types
   - Improve accuracy for local waste

3. **Optimize Performance**
   - Use GPU for faster detection
   - Reduce image size
   - Implement caching
   - Deploy on edge devices

### Add Features

- [ ] Multi-object detection
- [ ] Real-time video detection
- [ ] Waste quantity estimation
- [ ] Location-based recommendations
- [ ] User feedback for improvements
- [ ] Offline detection mode

## Resources

- 📖 Full Setup Guide: `docs/WASTE_DETECTION_SETUP.md`
- 🐍 Python Service: `backend/yolov8_service.py`
- 📱 Frontend Component: `frontend/components/User/Basura/BasuraType.js`
- 🔧 Backend API: `backend/server.js` (search for "detect-waste")

## Support

Need help?

1. Check troubleshooting section above
2. Review full documentation
3. Test components independently
4. Check logs for error messages

Happy waste detecting! ♻️🌍
