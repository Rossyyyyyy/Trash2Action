# Real-Time Waste Detection Guide

## Overview

The app now supports real-time object detection with visual bounding boxes, similar to professional object detection systems. Users can see detected waste items highlighted on their camera screen with labels and confidence scores.

## Features

### Live Scanning Mode
- **Real-time detection**: Continuously scans the camera view every 2 seconds
- **Multiple object detection**: Can detect and highlight multiple waste items simultaneously
- **Bounding boxes**: Visual rectangles around detected objects
- **Labels**: Shows waste type and confidence percentage
- **Color-coded**: Different colors for different waste categories

### Visual Indicators
- **Plastic**: Blue (#2196F3)
- **Paper**: Green (#4CAF50)
- **Metal**: Orange (#FF9800)
- **Glass**: Purple (#9C27B0)
- **Organic**: Light Green (#8BC34A)
- **Electronic**: Red (#F44336)
- **Battery**: Pink (#E91E63)
- **Cardboard**: Brown (#795548)
- **General**: Grey (#9E9E9E)

## How to Use

### Step 1: Open Waste Scanner
1. Navigate to Dashboard
2. Tap "Check Basura Type" button
3. Grant camera permissions if prompted

### Step 2: Choose Detection Mode

#### Option A: Live Scan Mode (Real-time)
1. Tap the "Live Scan" button in the top-right corner
2. Point camera at waste items
3. Watch as objects are detected and highlighted automatically
4. Bounding boxes appear around detected items
5. Labels show waste type and confidence score
6. Tap "Stop Scan" to pause detection

#### Option B: Single Photo Mode
1. Tap the camera button at the bottom
2. Take a photo of waste item
3. Wait for analysis
4. View detailed results with recommendations

### Step 3: View Results

**Live Scan Mode:**
- See real-time bounding boxes on screen
- Multiple items detected simultaneously
- Confidence scores displayed above each box
- Color-coded by waste category

**Photo Mode:**
- Detailed waste type classification
- Category (Recyclable, Biodegradable, etc.)
- Confidence percentage
- Disposal recommendations
- Option to retake or finish

## Tips for Best Results

### Camera Positioning
- Hold phone steady
- Keep waste items in center of frame
- Maintain good distance (not too close/far)
- Ensure items are fully visible

### Lighting
- Use natural or bright lighting
- Avoid shadows on objects
- Don't point camera at bright lights
- Indoor/outdoor both work well

### Object Clarity
- Clean items work better than dirty ones
- Single items easier than piles
- Flat surfaces better than cluttered backgrounds
- Avoid motion blur

## Technical Details

### Detection Frequency
- **Live Scan**: Every 2 seconds
- **Photo Mode**: Single detection on capture

### Performance
- **Processing Time**: 1-3 seconds per frame
- **Confidence Threshold**: 30% minimum
- **Max Objects**: Unlimited (all detected objects shown)
- **Image Quality**: Optimized for speed (0.5 quality)

### API Endpoints

#### Real-time Detection
```
POST /api/detect-waste-realtime
```
Returns array of detections with bounding boxes:
```json
{
  "success": true,
  "detections": [
    {
      "label": "Plastic Bottle",
      "confidence": 0.95,
      "x": 100,
      "y": 150,
      "width": 120,
      "height": 180
    }
  ],
  "count": 1
}
```

#### Single Photo Detection
```
POST /api/detect-waste
```
Returns single best detection with details:
```json
{
  "success": true,
  "result": {
    "wasteType": "Plastic Bottle",
    "category": "Recyclable",
    "confidence": 95,
    "recommendation": "Place in recyclable bin..."
  }
}
```

## Demo Mode vs Production Mode

### Demo Mode (Default)
- Works immediately, no setup required
- Simulates realistic detections
- Random bounding boxes for demonstration
- Perfect for testing UI/UX

### Production Mode (With YOLOv8)
- Requires Python service running
- Real AI-powered detection
- Accurate bounding boxes
- Actual object recognition

## Setup for Production

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start YOLOv8 Service
```bash
cd backend
python yolov8_service.py
```

### 3. Enable in Backend
Edit `backend/.env`:
```env
YOLO_SERVICE_URL=http://localhost:5001/detect
```

### 4. Test Real-time Detection
```bash
# Test the new endpoint
curl -X POST http://localhost:5001/detect-multiple \
  -F "image=@test_image.jpg"
```

## Troubleshooting

### Bounding Boxes Not Showing
**Problem**: Live scan active but no boxes appear

**Solutions:**
1. Ensure "Live Scan" button is green/active
2. Point camera at recognizable objects
3. Check lighting conditions
4. Wait 2-3 seconds for first detection
5. Verify backend service is running

### Detection Too Slow
**Problem**: Long delay between detections

**Solutions:**
1. Reduce image quality (already optimized)
2. Use GPU acceleration in Python service
3. Increase detection interval (modify code)
4. Ensure good network connection
5. Check backend server performance

### Inaccurate Detections
**Problem**: Wrong objects detected or low confidence

**Solutions:**
1. Improve lighting
2. Center objects in frame
3. Use cleaner backgrounds
4. Train custom model on local waste
5. Adjust confidence threshold

### App Performance Issues
**Problem**: App lags during live scan

**Solutions:**
1. Close other apps
2. Restart the app
3. Use photo mode instead
4. Reduce detection frequency
5. Check device specifications

## Advanced Features

### Custom Training
Train YOLOv8 on your specific waste types:

```python
from ultralytics import YOLO

model = YOLO('yolov8n.pt')
results = model.train(
    data='custom_waste.yaml',
    epochs=100,
    imgsz=640,
    conf=0.3  # Lower threshold for more detections
)
```

### Adjust Detection Interval
Modify `BasuraType.js`:
```javascript
// Change from 2000ms to desired interval
detectionIntervalRef.current = setInterval(() => {
  captureAndDetect();
}, 1000); // 1 second for faster detection
```

### Customize Colors
Edit `getColorForLabel()` function in `BasuraType.js`:
```javascript
const colors = {
  'plastic': '#YOUR_COLOR',
  'paper': '#YOUR_COLOR',
  // Add more...
};
```

## Best Practices

### For Users
1. Start with photo mode to learn the system
2. Use live scan for quick identification
3. Ensure good lighting always
4. Keep camera steady during live scan
5. Point at one item at a time for best results

### For Developers
1. Monitor API response times
2. Implement caching for common items
3. Add analytics for detection accuracy
4. Optimize image compression
5. Consider edge deployment for offline use

## Future Enhancements

- [ ] Adjust detection speed (slider control)
- [ ] Save detected items to history
- [ ] Batch detection results
- [ ] Offline detection mode
- [ ] AR overlays with 3D models
- [ ] Voice feedback for detections
- [ ] Statistics and analytics
- [ ] Social sharing of scans

## Resources

- Main Setup Guide: `WASTE_DETECTION_SETUP.md`
- Quick Start: `WASTE_DETECTION_QUICKSTART.md`
- Implementation Details: `WASTE_DETECTION_IMPLEMENTATION.md`
- YOLOv8 Documentation: https://docs.ultralytics.com/

## Support

For issues with real-time detection:
1. Check camera permissions
2. Verify backend service status
3. Test with photo mode first
4. Review console logs
5. Check network connectivity

Happy detecting! 📸♻️
