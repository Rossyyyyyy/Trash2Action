# Quick Training Guide - Waste Detection

## 🚀 Fast Track (30 minutes)

### 1. Setup Environment
```bash
cd backend
pip install ultralytics roboflow supervision
```

### 2. Get Dataset

**Option A: Use Roboflow (Easiest)**
```bash
python download_waste_dataset.py
# Choose option 1, enter your Roboflow API key
```

**Option B: Create Sample Config**
```bash
python train_waste_model.py --create-config
# Edit waste_data.yaml with your dataset path
```

### 3. Train Model
```bash
# Quick test (50 epochs, ~15 minutes)
python train_waste_model.py --model n --epochs 50

# Production (200 epochs, ~1-2 hours)
python train_waste_model.py --model s --epochs 200
```

### 4. Test Model
```bash
python test_trained_model.py path/to/test_image.jpg
```

### 5. Deploy
```python
# Edit yolov8_service.py, line 20:
model = YOLO('waste_detection/waste_yolov8/weights/best.pt')
```

```bash
# Start service
python yolov8_service.py
```

## 📊 What to Detect

Common waste categories for training:
- `plastic-bottle` - Water bottles, soda bottles
- `plastic-bag` - Shopping bags, garbage bags
- `cellphone` - Mobile phones, smartphones
- `paper` - Newspapers, documents
- `cardboard` - Boxes, packaging
- `metal-can` - Aluminum cans, tin cans
- `glass-bottle` - Glass containers
- `food-container` - Takeout containers
- `electronic-waste` - Small electronics
- `battery` - Batteries of all types

## 🎯 Training Tips

### For Real-time Detection (Speed)
- Use `--model n` (nano)
- Train with `--img-size 416`
- Target: 20-30 FPS

### For Accuracy (Quality)
- Use `--model s` or `--model m`
- Train with `--img-size 640`
- More epochs: `--epochs 200`

### Dataset Requirements
- **Minimum**: 50 images per class
- **Recommended**: 200+ images per class
- **Best**: 500+ images per class

### Image Collection Tips
1. Multiple angles (top, side, angled)
2. Different lighting (bright, dim, outdoor, indoor)
3. Various backgrounds
4. Different conditions (clean, dirty, crushed)
5. Multiple items in frame

## 🔧 Common Commands

```bash
# Create dataset structure
python download_waste_dataset.py
# Choose option 4

# Train with custom settings
python train_waste_model.py \
  --data waste_data.yaml \
  --model s \
  --epochs 100 \
  --batch 16

# Test model
python test_trained_model.py test.jpg

# Test with different model
python test_trained_model.py test.jpg --model yolov8n.pt

# Start detection service
python yolov8_service.py
```

## 📈 Expected Results

### After 50 Epochs (Quick Test)
- mAP50: 60-75%
- Good for testing workflow

### After 200 Epochs (Production)
- mAP50: 85-95%
- Ready for deployment

### Real-time Performance
- YOLOv8n: 30-50 FPS (GPU), 5-10 FPS (CPU)
- YOLOv8s: 20-30 FPS (GPU), 3-5 FPS (CPU)
- YOLOv8m: 15-25 FPS (GPU), 2-3 FPS (CPU)

## 🐛 Troubleshooting

### "No module named 'ultralytics'"
```bash
pip install ultralytics
```

### "CUDA out of memory"
```bash
# Reduce batch size
python train_waste_model.py --batch 8
```

### "No objects detected"
- Check if model is trained
- Lower confidence threshold
- Verify image quality
- Ensure dataset has labels

### Training is slow
- Use GPU (10-20x faster)
- Reduce epochs for testing
- Use smaller model (nano)

## 📚 File Structure

```
backend/
├── yolov8_service.py          # Detection service
├── train_waste_model.py       # Training script
├── test_trained_model.py      # Testing script
├── download_waste_dataset.py  # Dataset helper
├── waste_data.yaml            # Dataset config
├── dataset/                   # Your dataset
│   ├── train/
│   │   ├── images/
│   │   └── labels/
│   └── valid/
│       ├── images/
│       └── labels/
└── waste_detection/           # Training output
    └── waste_yolov8/
        └── weights/
            └── best.pt        # Trained model
```

## 🎓 Learning Path

1. **Day 1**: Setup and test with pretrained model
2. **Day 2**: Collect and annotate 50 images
3. **Day 3**: Train first model (50 epochs)
4. **Day 4**: Test and collect more data
5. **Day 5**: Train production model (200 epochs)
6. **Day 6**: Deploy and test in app
7. **Day 7**: Fine-tune based on results

## 🔗 Resources

- **Full Guide**: `docs/REALTIME_WASTE_TRAINING.md`
- **Custom Training**: `docs/CUSTOM_WASTE_TRAINING_GUIDE.md`
- **YOLOv8 Docs**: https://docs.ultralytics.com
- **Roboflow**: https://roboflow.com
- **TACO Dataset**: http://tacodataset.org

## ✅ Checklist

Before deploying:
- [ ] Model trained with >100 images per class
- [ ] mAP50 > 85%
- [ ] Tested on real-world images
- [ ] Real-time detection works smoothly
- [ ] False positives are acceptable
- [ ] Backend service is running
- [ ] Frontend displays correctly

---

**Need Help?** Check the full guides in `docs/` folder or YOLOv8 documentation.
