# YOLOv8 Waste Detection - Backend Setup

## Quick Start

### Option 1: Demo Mode (No Setup)
Just start the backend - it will use mock detection:
```bash
npm start
```

### Option 2: Production Mode (Real AI)

1. **Setup Python Environment**
   ```bash
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

3. **Enable in .env**
   ```env
   YOLO_SERVICE_URL=http://localhost:5001/detect
   ```

4. **Start Backend**
   ```bash
   npm start
   ```

## Testing

### Test YOLOv8 Service
```bash
# Health check
curl http://localhost:5001/health

# Test detection
node test_yolo_service.js path/to/image.jpg
```

### Test Backend API
```bash
curl -X POST http://localhost:5000/api/detect-waste \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test_image.jpg"
```

## Files

- `yolov8_service.py` - Python Flask service for YOLOv8
- `requirements.txt` - Python dependencies
- `setup_yolo.sh` - Linux/Mac setup script
- `setup_yolo.bat` - Windows setup script
- `test_yolo_service.js` - Test suite

## Documentation

See `../docs/` for detailed guides:
- `WASTE_DETECTION_QUICKSTART.md` - Quick start guide
- `WASTE_DETECTION_SETUP.md` - Full setup guide
- `WASTE_DETECTION_IMPLEMENTATION.md` - Implementation details

## Troubleshooting

### Python Service Won't Start
```bash
# Check Python version (need 3.8+)
python --version

# Install dependencies
pip install -r requirements.txt
```

### Backend Can't Connect
1. Verify YOLOv8 service is running
2. Check YOLO_SERVICE_URL in .env
3. Test with: `curl http://localhost:5001/health`

### Low Accuracy
- Use better lighting
- Center waste in frame
- Train custom model on local waste types

## Training Custom Model

1. Collect waste images
2. Annotate with labels
3. Train YOLOv8:
   ```python
   from ultralytics import YOLO
   model = YOLO('yolov8n.pt')
   model.train(data='waste.yaml', epochs=100)
   ```
4. Update `yolov8_service.py` with new model

## Support

For issues, check:
1. Python service logs
2. Backend server logs
3. Test endpoints independently
4. Review documentation
