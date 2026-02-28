# Live Scan Troubleshooting Guide

## Problem: No Labels/Text Showing in Live Scan

### Quick Diagnosis

Run this test to check if everything is working:

```bash
cd backend
node test-live-scan.js
```

This will tell you exactly what's wrong.

---

## Step-by-Step Fix

### 1. Check if YOLOv8 Service is Running

**Terminal 1 - Start YOLOv8 Service:**
```bash
cd backend
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

**If you see errors:**
- Missing dependencies: `pip install ultralytics flask pillow numpy flask-cors`
- Model not found: It will auto-download on first run
- Port in use: Kill process on port 5001

### 2. Verify YOLOv8 is Responding

In another terminal:
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{"status":"healthy","model_loaded":true}
```

### 3. Start Backend Server

**Terminal 2 - Start Main Server:**
```bash
cd backend
node server.js
```

### 4. Start Frontend

**Terminal 3 - Start App:**
```bash
cd frontend
npm start
```

---

## Common Issues & Solutions

### Issue 1: "Scanning..." but No Detections

**Cause:** YOLOv8 service not running or not responding

**Solution:**
1. Check if `python yolov8_service.py` is running
2. Check console logs in the app for errors
3. Run `node test-live-scan.js` to diagnose

### Issue 2: Bounding Boxes but No Text

**Cause:** Detection data missing `label` or `confidence` fields

**Solution:**
1. Check YOLOv8 service logs for errors
2. Verify the response format matches:
```json
{
  "success": true,
  "detections": [
    {
      "label": "Bottle",
      "confidence": 0.95,
      "x": 100,
      "y": 150,
      "width": 80,
      "height": 120
    }
  ]
}
```

### Issue 3: App Shows "Demo Mode"

**Cause:** Backend can't connect to YOLOv8 service, using mock data

**Solution:**
1. Ensure YOLOv8 service is running on port 5001
2. Check firewall isn't blocking port 5001
3. Check backend logs for connection errors

### Issue 4: Camera Freezes During Scan

**Cause:** Detection taking too long (>2 seconds)

**Solution:**
1. Use smaller model: `yolov8n.pt` (nano) instead of larger models
2. Reduce image quality in `BasuraType.js`:
```javascript
quality: 0.3,  // Lower = faster
```
3. Increase detection interval:
```javascript
detectionIntervalRef.current = setInterval(() => {
  captureAndDetect();
}, 3000);  // 3 seconds instead of 2
```

---

## Debug Mode

### Enable Console Logging

The app now logs detection results. Check your console:

```
🔍 Detection response: {...}
📦 Detections count: 2
✅ Setting detections: [...]
```

Or if nothing is detected:
```
⚠️ No detections found
```

### Check Backend Logs

In the terminal running `node server.js`, you should see:

```
⚠️ YOLOv8 service unavailable for real-time: connect ECONNREFUSED
```

This means YOLOv8 service isn't running.

---

## Expected Behavior

When working correctly:

1. **Start Live Scan** → Button turns green, says "Stop Scan"
2. **Point at objects** → Bounding boxes appear around detected items
3. **Labels show** → Text like "Bottle 95%" appears above boxes
4. **Counter updates** → Top shows "2 objects detected"
5. **Real-time** → Updates every 2 seconds

---

## Test with Known Objects

YOLOv8n COCO model can detect these common items:

- ✅ Bottles (water, soda)
- ✅ Cups, bowls
- ✅ Cell phones
- ✅ Laptops, keyboards
- ✅ Books
- ✅ Scissors
- ✅ Forks, spoons, knives

Point your camera at these objects for best results.

---

## Still Not Working?

1. **Restart everything:**
   - Stop all terminals (Ctrl+C)
   - Start YOLOv8 service first
   - Then backend server
   - Then frontend

2. **Check versions:**
   ```bash
   python --version  # Should be 3.8+
   node --version    # Should be 14+
   ```

3. **Reinstall dependencies:**
   ```bash
   cd backend
   pip install --upgrade ultralytics flask pillow numpy flask-cors
   npm install
   ```

4. **Check the test script:**
   ```bash
   cd backend
   node test-live-scan.js
   ```

---

## Quick Reference

| Service | Port | Command | Check |
|---------|------|---------|-------|
| YOLOv8 | 5001 | `python yolov8_service.py` | `curl localhost:5001/health` |
| Backend | 5000 | `node server.js` | `curl localhost:5000/health` |
| Frontend | 8081 | `npm start` | Open Expo app |

All three must be running simultaneously for live scan to work!
