# Real-time Waste Detection Training Guide

## Overview
This guide shows you how to train YOLOv8 to detect specific waste items (plastic bottles, cellphones, bags, etc.) in real-time, just like in the images you shared.

## What You'll Build
- Real-time waste detection with bounding boxes
- Support for multiple waste types: plastic bottles, bags, cellphones, containers, etc.
- Live camera scanning with object labels and confidence scores
- Accurate classification for proper waste disposal

## Prerequisites

### System Requirements
- Python 3.8 or higher
- 8GB RAM minimum (16GB recommended)
- GPU with CUDA support (recommended for training)
- 10GB free disk space

### Software Installation

1. **Install Python Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install roboflow supervision
   ```

2. **Verify Installation**
   ```bash
   python -c "from ultralytics import YOLO; print('✅ YOLOv8 installed')"
   ```

## Step 1: Prepare Your Dataset

### Option A: Use Pre-trained Waste Model (Fastest)

Download a pre-trained waste detection model from Roboflow Universe:

```bash
cd backend
python download_waste_dataset.py
# Choose option 1 and follow prompts
```

Popular waste detection datasets on Roboflow:
- "waste-classification" - General waste types
- "plastic-detection" - Plastic-specific detection
- "trash-detection" - Multi-category trash

### Option B: Create Custom Dataset (Most Accurate)

1. **Collect Images**
   - Take 100-300 photos per waste category
   - Use different angles, lighting, and backgrounds
   - Include variations (crushed bottles, different colors, etc.)
   - Capture in environments similar to deployment

2. **Annotate Images**
   
   Use Roboflow (Recommended):
   ```
   1. Create account at https://roboflow.com
   2. Create new project → Object Detection
   3. Upload images
   4. Draw bounding boxes around waste items
   5. Label each box with waste type
   6. Export in YOLOv8 format
   ```

   Waste categories to label:
   - plastic-bottle
   - plastic-bag
   - cellphone
   - paper
   - cardboard
   - metal-can
   - glass-bottle
   - food-container
   - electronic-waste
   - battery
   - styrofoam

3. **Download Dataset**
   ```python
   from roboflow import Roboflow
   rf = Roboflow(api_key="YOUR_API_KEY")
   project = rf.workspace("YOUR_WORKSPACE").project("YOUR_PROJECT")
   dataset = project.version(1).download("yolov8")
   ```

### Option C: Use Public Datasets

**TACO Dataset** (Trash Annotations in Context)
```bash
git clone https://github.com/pedropro/TACO.git
cd TACO
# Follow their instructions to download and convert
```

## Step 2: Configure Dataset

Create or update `backend/waste_data.yaml`:

```yaml
# Dataset paths
path: ./dataset  # or path to downloaded dataset
train: train/images
val: valid/images

# Waste classes (update based on your needs)
names:
  0: plastic-bottle
  1: plastic-bag
  2: cellphone
  3: paper
  4: cardboard
  5: metal-can
  6: glass-bottle
  7: food-container
  8: electronic-waste
  9: battery
  10: styrofoam
  11: general-waste
```

## Step 3: Train the Model

### Quick Training (Testing)
```bash
cd backend
python train_waste_model.py --data waste_data.yaml --model n --epochs 50
```

### Production Training (Best Accuracy)
```bash
python train_waste_model.py \
  --data waste_data.yaml \
  --model s \
  --epochs 200 \
  --img-size 640 \
  --batch 16
```

### Training Parameters Explained

- `--model n`: Nano (fastest, real-time)
- `--model s`: Small (balanced)
- `--model m`: Medium (more accurate)
- `--epochs 200`: More epochs = better accuracy
- `--img-size 640`: Standard size for detection
- `--batch 16`: Adjust based on GPU memory

### Monitor Training

Training will show:
```
Epoch    GPU_mem   box_loss   cls_loss   dfl_loss  Instances       Size
  1/200     3.45G      1.234      0.876      1.123         45        640
  2/200     3.45G      1.156      0.823      1.089         45        640
  ...
```

Good training indicators:
- Losses decreasing over time
- mAP50 increasing (target: >0.85)
- No overfitting (train/val metrics similar)

## Step 4: Test Your Model

### Test on Single Image
```bash
cd backend
python test_trained_model.py path/to/test_image.jpg
```

### Test Script
Create `backend/test_trained_model.py`:
```python
from ultralytics import YOLO
from PIL import Image
import sys

# Load trained model
model = YOLO('waste_detection/waste_yolov8/weights/best.pt')

# Test image
image_path = sys.argv[1] if len(sys.argv) > 1 else 'test.jpg'
results = model(image_path)

# Display results
for result in results:
    boxes = result.boxes
    print(f"\nDetected {len(boxes)} objects:")
    
    for box in boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        class_name = result.names[class_id]
        print(f"  - {class_name}: {confidence:.2%}")
    
    # Save annotated image
    result.save('result_annotated.jpg')
    print(f"\n✅ Saved annotated image: result_annotated.jpg")
```

## Step 5: Deploy to Backend

### Update YOLOv8 Service

Edit `backend/yolov8_service.py`:

```python
# Replace this line:
model = YOLO('yolov8n.pt')

# With your trained model:
model = YOLO('waste_detection/waste_yolov8/weights/best.pt')
```

### Start Services

1. **Start YOLOv8 Service**
   ```bash
   cd backend
   python yolov8_service.py
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```

3. **Test Detection**
   ```bash
   curl http://localhost:5001/health
   ```

## Step 6: Test Real-time Detection

### Test from Frontend

1. Open the app
2. Navigate to "Check Basura Type"
3. Click "Live Scan" button
4. Point camera at waste items
5. See real-time bounding boxes and labels

### Expected Behavior

- Bounding boxes appear around detected waste
- Labels show waste type and confidence
- Different colors for different waste types
- Updates every 2 seconds

## Performance Optimization

### For Real-time Detection (Speed Priority)

1. **Use Nano Model**
   ```bash
   python train_waste_model.py --model n
   ```

2. **Reduce Image Size**
   ```python
   # In yolov8_service.py
   results = model(image, imgsz=416)  # Smaller = faster
   ```

3. **Lower Confidence Threshold**
   ```python
   results = model(image, conf=0.25)  # Lower = more detections
   ```

4. **Use GPU**
   ```python
   model = YOLO('best.pt')
   model.to('cuda')  # Use GPU acceleration
   ```

### For Better Accuracy (Quality Priority)

1. **Use Larger Model**
   ```bash
   python train_waste_model.py --model m --epochs 300
   ```

2. **More Training Data**
   - Collect 500+ images per class
   - Include edge cases and variations

3. **Data Augmentation**
   - Already enabled in training script
   - Helps model generalize better

4. **Higher Confidence Threshold**
   ```python
   results = model(image, conf=0.5)  # Higher = fewer false positives
   ```

## Troubleshooting

### Low Detection Accuracy

**Problem**: Model doesn't detect waste or has low confidence

**Solutions**:
1. Collect more training data (100+ images per class)
2. Improve image quality (good lighting, clear focus)
3. Balance dataset (equal images per class)
4. Train for more epochs (200-300)
5. Use data augmentation

### Slow Real-time Detection

**Problem**: Camera feed is laggy or slow

**Solutions**:
1. Use YOLOv8n (nano) model
2. Reduce image size to 416x416
3. Increase detection interval (3-4 seconds)
4. Use GPU acceleration
5. Optimize backend server

### False Positives

**Problem**: Detecting wrong objects as waste

**Solutions**:
1. Increase confidence threshold (0.5-0.7)
2. Add negative examples to training
3. Fine-tune with hard examples
4. Use Non-Maximum Suppression (NMS)

### Model Not Loading

**Problem**: Error loading trained model

**Solutions**:
1. Check model path is correct
2. Verify model file exists
3. Ensure ultralytics version matches
4. Re-export model if needed

## Advanced Features

### Multi-Class Detection

Detect multiple waste types simultaneously:
```python
# Already implemented in /detect-multiple endpoint
# Returns array of all detected objects with bounding boxes
```

### Confidence Filtering

Filter detections by confidence:
```python
results = model(image, conf=0.5)  # Only show >50% confidence
```

### Custom Colors per Class

Update `BasuraType.js`:
```javascript
function getColorForLabel(label) {
  const colors = {
    'plastic-bottle': '#2196F3',
    'cellphone': '#F44336',
    'plastic-bag': '#4CAF50',
    // Add your custom colors
  };
  return colors[label.toLowerCase()] || '#00BCD4';
}
```

## Production Checklist

Before deploying to production:

- [ ] Model achieves >85% mAP50 on validation set
- [ ] Tested on diverse real-world images
- [ ] Real-time detection runs smoothly (>10 FPS)
- [ ] False positive rate is acceptable
- [ ] Backend service is stable and handles errors
- [ ] Frontend displays bounding boxes correctly
- [ ] Waste categories match local disposal guidelines
- [ ] Documentation is updated

## Next Steps

1. **Continuous Improvement**
   - Collect images of misclassified waste
   - Retrain model with new data
   - Monitor performance metrics

2. **Add More Features**
   - Save detection history
   - Generate waste statistics
   - Add disposal location finder
   - Implement waste tracking

3. **Scale Up**
   - Deploy to cloud (AWS, GCP, Azure)
   - Use model optimization (ONNX, TensorRT)
   - Implement caching and load balancing

## Resources

- **YOLOv8 Documentation**: https://docs.ultralytics.com
- **Roboflow**: https://roboflow.com
- **TACO Dataset**: http://tacodataset.org
- **Ultralytics Hub**: https://hub.ultralytics.com
- **Training Tutorial**: https://docs.ultralytics.com/modes/train/

## Support

For issues or questions:
1. Check troubleshooting section
2. Review YOLOv8 documentation
3. Test with sample images first
4. Verify all dependencies are installed

---

**Remember**: Good training data is key to accurate detection. Spend time collecting diverse, high-quality images of waste in various conditions.
