# Waste Detection with YOLOv8 Setup Guide

This guide explains how to set up and use the AI-powered waste detection feature in Trash2Action.

## Overview

The waste detection feature allows users to:
- Take photos or upload images of waste
- Automatically classify waste types using YOLOv8 AI model
- Get disposal recommendations based on waste category
- View confidence scores for detections

## Architecture

```
Frontend (React Native)
    ↓
Backend API (Node.js/Express)
    ↓
YOLOv8 Service (Python/Flask)
    ↓
YOLOv8 Model (Trained on waste dataset)
```

## Quick Start (Demo Mode)

The app works out of the box with mock detection data. No additional setup required!

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend:
```bash
cd frontend
npm start
```

3. In the app, navigate to Dashboard → Check Basura Type
4. Take a photo or upload an image
5. View the detection results (mock data)

## Production Setup with Real YOLOv8

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- CUDA-capable GPU (optional, for faster inference)

### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Prepare YOLOv8 Model

You have two options:

#### Option A: Use Pre-trained Model (Quick Start)
```python
# The service will use yolov8n.pt by default
# This is a general object detection model
```

#### Option B: Train Custom Waste Model (Recommended)

1. Collect waste images dataset (or use existing datasets like TACO, TrashNet)
2. Annotate images with waste categories
3. Train YOLOv8 model:

```python
from ultralytics import YOLO

# Load a model
model = YOLO('yolov8n.pt')

# Train the model
results = model.train(
    data='waste_dataset.yaml',  # Your dataset config
    epochs=100,
    imgsz=640,
    batch=16
)

# Save the trained model
model.save('waste_yolov8.pt')
```

4. Update `yolov8_service.py` to use your trained model:
```python
model = YOLO('waste_yolov8.pt')  # Your trained model
```

### Step 3: Configure Waste Categories

Edit `yolov8_service.py` to match your model's classes:

```python
WASTE_CATEGORIES = {
    'plastic_bottle': {
        'category': 'Recyclable',
        'recommendation': 'Place in recyclable bin. Rinse before disposal.'
    },
    'food_waste': {
        'category': 'Biodegradable',
        'recommendation': 'Dispose in compost bin.'
    },
    # Add more categories...
}
```

### Step 4: Start YOLOv8 Service

```bash
cd backend
python yolov8_service.py
```

The service will start on `http://localhost:5001`

### Step 5: Configure Backend

Update `backend/.env`:

```env
YOLO_SERVICE_URL=http://localhost:5001/detect
```

### Step 6: Start Backend Server

```bash
cd backend
npm start
```

## Testing the Detection

### Test YOLOv8 Service Directly

```bash
# Health check
curl http://localhost:5001/health

# Test detection with an image
curl -X POST http://localhost:5001/detect \
  -F "image=@path/to/waste_image.jpg"
```

### Test via Backend API

```bash
curl -X POST http://localhost:5000/api/detect-waste \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@path/to/waste_image.jpg"
```

## Waste Categories

The system supports the following waste categories:

| Category | Examples | Disposal Method |
|----------|----------|-----------------|
| Recyclable | Plastic bottles, paper, metal cans, glass | Recycling bin |
| Biodegradable | Food waste, organic matter | Compost bin |
| Hazardous | Electronics, batteries, chemicals | Special collection |
| Non-recyclable | Mixed materials, contaminated items | General waste |

## Training Your Own Model

### Recommended Datasets

1. **TACO (Trash Annotations in Context)**
   - 1,500+ images
   - 60 waste categories
   - Download: http://tacodataset.org/

2. **TrashNet**
   - 2,527 images
   - 6 categories (glass, paper, cardboard, plastic, metal, trash)
   - Download: https://github.com/garythung/trashnet

3. **Waste Classification Data**
   - Various sources on Kaggle and Roboflow

### Training Steps

1. **Prepare Dataset**
```bash
# Organize in YOLO format:
dataset/
  ├── images/
  │   ├── train/
  │   ├── val/
  │   └── test/
  └── labels/
      ├── train/
      ├── val/
      └── test/
```

2. **Create dataset.yaml**
```yaml
path: ./dataset
train: images/train
val: images/val
test: images/test

nc: 6  # number of classes
names: ['plastic', 'paper', 'metal', 'glass', 'organic', 'general']
```

3. **Train Model**
```python
from ultralytics import YOLO

model = YOLO('yolov8n.pt')
results = model.train(
    data='dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    name='waste_detection'
)
```

4. **Evaluate Model**
```python
metrics = model.val()
print(f"mAP50: {metrics.box.map50}")
print(f"mAP50-95: {metrics.box.map}")
```

## Troubleshooting

### YOLOv8 Service Not Starting

**Error**: `ModuleNotFoundError: No module named 'ultralytics'`
```bash
pip install ultralytics
```

**Error**: `CUDA out of memory`
```python
# Use CPU instead
model = YOLO('yolov8n.pt')
model.to('cpu')
```

### Low Detection Accuracy

1. Ensure good lighting in photos
2. Take clear, focused images
3. Center the waste object in frame
4. Train model with more diverse dataset
5. Increase training epochs

### Backend Connection Issues

1. Check if YOLOv8 service is running:
```bash
curl http://localhost:5001/health
```

2. Verify YOLO_SERVICE_URL in `.env`
3. Check firewall settings
4. Review backend logs for errors

## Performance Optimization

### For Mobile Deployment

1. Use YOLOv8n (nano) for faster inference
2. Reduce image size before sending
3. Implement caching for common detections
4. Use edge deployment (TensorFlow Lite, ONNX)

### For Server Deployment

1. Use GPU acceleration
2. Batch processing for multiple images
3. Load balancing for multiple requests
4. Model quantization for faster inference

## API Reference

### POST /api/detect-waste

Detect waste type from image.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
- `image`: Image file (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "result": {
    "wasteType": "Plastic Bottle",
    "category": "Recyclable",
    "confidence": 95,
    "recommendation": "Place in recyclable bin. Rinse before disposal."
  },
  "message": "Waste detected successfully"
}
```

## Future Enhancements

- [ ] Multi-object detection (detect multiple waste items)
- [ ] Real-time video detection
- [ ] Waste quantity estimation
- [ ] Location-based disposal recommendations
- [ ] Integration with waste collection scheduling
- [ ] User feedback loop for model improvement
- [ ] Offline detection using on-device models

## Resources

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [TACO Dataset](http://tacodataset.org/)
- [TrashNet Dataset](https://github.com/garythung/trashnet)
- [Roboflow Waste Datasets](https://universe.roboflow.com/search?q=waste)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs
3. Test YOLOv8 service independently
4. Verify image format and size
