# YOLOv8 Waste Detection - Training & Deployment

## 🎯 Goal
Train YOLOv8 to detect specific waste items in real-time:
- Plastic bottles, bags, containers
- Cellphones and electronics
- Paper, cardboard
- Metal cans
- Glass bottles
- And more...

## 📸 What You'll Get

Real-time detection like in your images:
- ✅ Bounding boxes around detected waste
- ✅ Labels showing waste type
- ✅ Confidence scores
- ✅ Color-coded by category
- ✅ Live camera scanning

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Get Training Data

**Option A: Use Roboflow Dataset (Recommended)**
```bash
python download_waste_dataset.py
```
Follow prompts to download a pre-annotated waste detection dataset.

**Option B: Use Your Own Images**
1. Collect 100+ photos per waste type
2. Annotate on Roboflow.com
3. Export in YOLOv8 format
4. Place in `dataset/` folder

### Step 3: Train Model
```bash
# Quick test (15 minutes)
python train_waste_model.py --model n --epochs 50

# Production quality (1-2 hours)
python train_waste_model.py --model s --epochs 200
```

## 📋 Detailed Guides

Choose based on your needs:

### For Beginners
📖 **[QUICK_TRAINING_GUIDE.md](QUICK_TRAINING_GUIDE.md)**
- Fast track setup (30 minutes)
- Common commands
- Troubleshooting

### For Real-time Detection
📖 **[../docs/REALTIME_WASTE_TRAINING.md](../docs/REALTIME_WASTE_TRAINING.md)**
- Complete real-time setup
- Performance optimization
- Frontend integration

### For Custom Training
📖 **[../docs/CUSTOM_WASTE_TRAINING_GUIDE.md](../docs/CUSTOM_WASTE_TRAINING_GUIDE.md)**
- Dataset preparation
- Advanced training techniques
- Model optimization

## 🎓 Training Workflow

```
1. Collect Images
   ↓
2. Annotate (Roboflow)
   ↓
3. Download Dataset
   ↓
4. Configure waste_data.yaml
   ↓
5. Train Model
   ↓
6. Test Model
   ↓
7. Deploy to Backend
   ↓
8. Test in App
```

## 🛠️ Available Scripts

### Training
```bash
# Create dataset config
python train_waste_model.py --create-config

# Train with defaults
python train_waste_model.py

# Train with custom settings
python train_waste_model.py --model s --epochs 200 --batch 16
```

### Testing
```bash
# Test trained model
python test_trained_model.py test_image.jpg

# Test with specific model
python test_trained_model.py test_image.jpg --model path/to/model.pt
```

### Dataset Management
```bash
# Interactive dataset setup
python download_waste_dataset.py

# Options:
# 1. Download from Roboflow
# 2. Setup TACO dataset
# 3. Setup TrashNet dataset
# 4. Create empty structure
# 5. Download sample images
```

### Deployment
```bash
# Start YOLOv8 detection service
python yolov8_service.py

# Test service
curl http://localhost:5001/health
```

## 📊 Waste Categories

Recommended categories for training:

### Recyclables
- `plastic-bottle` - Water/soda bottles
- `plastic-bag` - Shopping bags
- `paper` - Newspapers, documents
- `cardboard` - Boxes, packaging
- `metal-can` - Aluminum/tin cans
- `glass-bottle` - Glass containers

### Electronics (Hazardous)
- `cellphone` - Mobile phones
- `electronic-waste` - Small electronics
- `battery` - All battery types

### Special Handling
- `food-container` - Takeout containers
- `styrofoam` - Foam packaging

### General
- `general-waste` - Non-recyclable items

## 🎯 Training Tips

### Dataset Size
- **Minimum**: 50 images per class
- **Good**: 200 images per class
- **Best**: 500+ images per class

### Image Quality
- Clear, well-lit photos
- Multiple angles
- Various backgrounds
- Different conditions (clean, dirty, crushed)
- Include multiple items per image

### Model Selection
- **YOLOv8n** (nano): Fastest, real-time (30+ FPS)
- **YOLOv8s** (small): Balanced speed/accuracy
- **YOLOv8m** (medium): Best accuracy

### Training Duration
- **50 epochs**: Quick test (~15 min)
- **100 epochs**: Good baseline (~30 min)
- **200 epochs**: Production quality (~1-2 hours)

## 📈 Expected Performance

### After Training
- **mAP50**: 85-95% (with good dataset)
- **Inference Speed**: 20-50 FPS (GPU)
- **Confidence**: 70-95% on clear images

### Real-time Detection
- Updates every 2 seconds
- Detects multiple objects
- Shows bounding boxes and labels
- Color-coded by waste type

## 🔧 Configuration

### Dataset Config (waste_data.yaml)
```yaml
path: ./dataset
train: train/images
val: valid/images

names:
  0: plastic-bottle
  1: plastic-bag
  2: cellphone
  # Add your classes...
```

### Backend Service (yolov8_service.py)
```python
# Line 20: Update model path
model = YOLO('waste_detection/waste_yolov8/weights/best.pt')
```

### Environment (.env)
```env
YOLO_SERVICE_URL=http://localhost:5001/detect
```

## 🐛 Troubleshooting

### Installation Issues
```bash
# If torch installation fails
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# If ultralytics fails
pip install ultralytics --upgrade
```

### Training Issues
```bash
# CUDA out of memory
python train_waste_model.py --batch 8

# Slow training (use CPU)
python train_waste_model.py --device cpu
```

### Detection Issues
```bash
# No objects detected
# - Lower confidence threshold
# - Check model is trained
# - Verify image quality

# Slow inference
# - Use smaller model (nano)
# - Reduce image size
# - Use GPU
```

## 📁 File Structure

```
backend/
├── yolov8_service.py              # Detection service (Flask)
├── train_waste_model.py           # Training script
├── test_trained_model.py          # Testing script
├── download_waste_dataset.py      # Dataset helper
├── requirements.txt               # Python dependencies
├── waste_data.yaml                # Dataset configuration
│
├── dataset/                       # Your training data
│   ├── train/
│   │   ├── images/
│   │   └── labels/
│   └── valid/
│       ├── images/
│       └── labels/
│
├── waste_detection/               # Training outputs
│   └── waste_yolov8/
│       ├── weights/
│       │   ├── best.pt           # Best model
│       │   └── last.pt           # Last checkpoint
│       └── results.png           # Training metrics
│
└── docs/
    ├── QUICK_TRAINING_GUIDE.md
    ├── REALTIME_WASTE_TRAINING.md
    └── CUSTOM_WASTE_TRAINING_GUIDE.md
```

## 🔗 Resources

### Documentation
- [Quick Training Guide](QUICK_TRAINING_GUIDE.md)
- [Real-time Detection Guide](../docs/REALTIME_WASTE_TRAINING.md)
- [Custom Training Guide](../docs/CUSTOM_WASTE_TRAINING_GUIDE.md)

### External Resources
- [YOLOv8 Documentation](https://docs.ultralytics.com)
- [Roboflow Platform](https://roboflow.com)
- [TACO Dataset](http://tacodataset.org)
- [Ultralytics Hub](https://hub.ultralytics.com)

### Datasets
- **TACO**: 1,500+ images, 60 categories
- **TrashNet**: 2,500+ images, 6 categories
- **Roboflow Universe**: Various waste datasets

## ✅ Deployment Checklist

Before going live:
- [ ] Model trained with sufficient data (100+ images/class)
- [ ] mAP50 > 85%
- [ ] Tested on diverse real-world images
- [ ] Real-time detection runs smoothly
- [ ] False positive rate is acceptable
- [ ] Backend service is stable
- [ ] Frontend displays correctly
- [ ] Error handling implemented
- [ ] Documentation updated

## 🎉 Next Steps

1. **Train Your Model**
   ```bash
   python train_waste_model.py --model s --epochs 200
   ```

2. **Test It**
   ```bash
   python test_trained_model.py test_image.jpg
   ```

3. **Deploy**
   ```bash
   python yolov8_service.py
   ```

4. **Use in App**
   - Open app
   - Go to "Check Basura Type"
   - Click "Live Scan"
   - Point at waste items

## 💡 Pro Tips

1. **Start Small**: Train with 50 images first to test workflow
2. **Use GPU**: 10-20x faster training
3. **Augmentation**: Already enabled in training script
4. **Iterative**: Train → Test → Collect more data → Retrain
5. **Balance**: Equal images per class for best results

## 🆘 Need Help?

1. Check troubleshooting sections in guides
2. Review YOLOv8 documentation
3. Test with pretrained model first
4. Verify all dependencies installed
5. Check Python version (3.8+)

---

**Ready to start?** Run `python train_waste_model.py --create-config` to begin!
