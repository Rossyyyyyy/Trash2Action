# Custom Waste Detection Training Guide

## Overview
This guide will help you train YOLOv8 to detect specific waste types like plastic bottles, cellphones, bags, containers, etc. for real-time detection.

## Prerequisites
- Python 3.8+
- GPU recommended (NVIDIA with CUDA support)
- At least 8GB RAM
- 5GB+ free disk space

## Step 1: Install Dependencies

```bash
pip install ultralytics roboflow supervision
```

## Step 2: Prepare Dataset

### Option A: Use Existing Waste Datasets

1. **TACO Dataset** (Trash Annotations in Context)
   - 1,500+ images with 60 waste categories
   - Download: http://tacodataset.org/

2. **TrashNet Dataset**
   - 2,527 images across 6 categories
   - Categories: glass, paper, cardboard, plastic, metal, trash

3. **Roboflow Waste Detection Datasets**
   ```python
   from roboflow import Roboflow
   rf = Roboflow(api_key="YOUR_API_KEY")
   project = rf.workspace("waste-detection").project("waste-classification")
   dataset = project.version(1).download("yolov8")
   ```

### Option B: Create Custom Dataset

1. **Collect Images**
   - Take 100-500 photos per waste category
   - Use different angles, lighting, backgrounds
   - Include variations (crushed bottles, different colors, etc.)

2. **Annotate Images**
   - Use tools like:
     - Roboflow (https://roboflow.com) - Recommended
     - LabelImg (https://github.com/heartexlabs/labelImg)
     - CVAT (https://cvat.org)
   
3. **Export in YOLOv8 Format**
   - Structure:
     ```
     dataset/
       ├── train/
       │   ├── images/
       │   └── labels/
       ├── valid/
       │   ├── images/
       │   └── labels/
       └── data.yaml
     ```

## Step 3: Configure Dataset

Create `waste_data.yaml`:

```yaml
# Dataset configuration
path: ./dataset  # dataset root dir
train: train/images  # train images
val: valid/images  # validation images

# Classes
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

## Step 4: Train the Model

Create `train_waste_model.py`:

```python
from ultralytics import YOLO
import torch

# Check if GPU is available
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Using device: {device}")

# Load a pretrained YOLOv8 model
model = YOLO('yolov8n.pt')  # nano model (fastest)
# model = YOLO('yolov8s.pt')  # small model (balanced)
# model = YOLO('yolov8m.pt')  # medium model (more accurate)

# Train the model
results = model.train(
    data='waste_data.yaml',
    epochs=100,  # Increase for better accuracy
    imgsz=640,  # Image size
    batch=16,  # Adjust based on GPU memory
    device=device,
    patience=20,  # Early stopping
    save=True,
    project='waste_detection',
    name='waste_yolov8',
    
    # Data augmentation
    hsv_h=0.015,
    hsv_s=0.7,
    hsv_v=0.4,
    degrees=10.0,
    translate=0.1,
    scale=0.5,
    shear=0.0,
    perspective=0.0,
    flipud=0.0,
    fliplr=0.5,
    mosaic=1.0,
    mixup=0.0,
)

# Validate the model
metrics = model.val()
print(f"mAP50: {metrics.box.map50}")
print(f"mAP50-95: {metrics.box.map}")

# Export the model
model.export(format='onnx')  # Optional: for faster inference
```

Run training:
```bash
python train_waste_model.py
```

## Step 5: Test the Trained Model

Create `test_trained_model.py`:

```python
from ultralytics import YOLO
from PIL import Image

# Load your trained model
model = YOLO('waste_detection/waste_yolov8/weights/best.pt')

# Test on an image
results = model('test_image.jpg')

# Display results
for result in results:
    boxes = result.boxes
    for box in boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        class_name = result.names[class_id]
        print(f"Detected: {class_name} ({confidence:.2%})")
    
    # Save annotated image
    result.save('result.jpg')
```

## Step 6: Update Backend Service

Update `backend/yolov8_service.py` to use your trained model:

```python
# Replace this line:
model = YOLO('yolov8n.pt')

# With:
model = YOLO('waste_detection/waste_yolov8/weights/best.pt')
```

## Quick Start with Pre-trained Waste Model

If you don't want to train from scratch, use a pre-trained model:

```python
from ultralytics import YOLO

# Download pre-trained waste detection model from Roboflow
# Or use community models from Ultralytics Hub
model = YOLO('path/to/pretrained_waste_model.pt')
```

## Performance Tips

1. **For Real-time Detection:**
   - Use YOLOv8n (nano) for speed
   - Reduce image size to 416x416 or 320x320
   - Lower confidence threshold to 0.3

2. **For Better Accuracy:**
   - Use YOLOv8m or YOLOv8l
   - Train for more epochs (200+)
   - Use larger image size (640x640)
   - Collect more diverse training data

3. **Optimize Inference:**
   ```python
   # Use half precision (FP16) on GPU
   model = YOLO('best.pt')
   model.to('cuda')
   results = model(image, half=True)
   ```

## Expected Results

After training on 500+ images per class:
- mAP50: 85-95%
- Real-time FPS: 20-30 (on GPU)
- Confidence: 70-95% for clear images

## Troubleshooting

### Low Accuracy
- Collect more training data
- Balance dataset (equal images per class)
- Increase training epochs
- Use data augmentation

### Slow Inference
- Use smaller model (yolov8n)
- Reduce image size
- Use GPU acceleration
- Export to ONNX format

### False Positives
- Increase confidence threshold
- Add more negative examples
- Fine-tune with hard examples

## Next Steps

1. Train model with your specific waste categories
2. Test on real-world images
3. Deploy to production
4. Monitor and retrain with new data

## Resources

- YOLOv8 Docs: https://docs.ultralytics.com
- TACO Dataset: http://tacodataset.org
- Roboflow: https://roboflow.com
- Ultralytics Hub: https://hub.ultralytics.com
