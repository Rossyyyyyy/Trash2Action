# 🎯 How to Train Your Waste Detection AI

## Why I Can't Train It For You

I'm an AI assistant that helps you write code and documentation. I cannot:
- ❌ Run long processes (training takes 15 min - 2 hours)
- ❌ Access your dataset (you need 100-500+ labeled images)
- ❌ Use your GPU/CPU resources
- ❌ Make decisions about which waste types you need

## ✅ What I DID Do For You

I created a **complete training system** with:

### 🛠️ Training Tools
1. **Interactive Wizard** (`start_training.py`) - Guides you step-by-step
2. **Training Engine** (`train_waste_model.py`) - Does the actual training
3. **Dataset Helper** (`download_waste_dataset.py`) - Gets training data
4. **Pre-trained Setup** (`use_pretrained_model.py`) - Skip training option
5. **Testing Tool** (`test_trained_model.py`) - Verify your model

### 📚 Complete Documentation
1. **START_HERE.md** - Your starting point
2. **TRAINING_OPTIONS.md** - Visual guide with flowcharts
3. **WASTE_DETECTION_SUMMARY.md** - Complete overview
4. **QUICK_TRAINING_GUIDE.md** - Fast reference
5. **REALTIME_WASTE_TRAINING.md** - Detailed real-time guide
6. **CUSTOM_WASTE_TRAINING_GUIDE.md** - Advanced techniques

### 🚀 Quick Start Scripts
1. **quick_start.bat** - Windows one-click setup
2. **quick_start.sh** - Mac/Linux one-click setup

## 🎬 How to Actually Train

### Option 1: Easiest Way (Recommended)

```bash
# Open terminal/command prompt
cd backend

# Run the wizard
python start_training.py
```

The wizard will:
1. ✅ Check if everything is installed
2. ✅ Help you download a dataset
3. ✅ Configure training settings
4. ✅ Start training automatically
5. ✅ Tell you what to do next

### Option 2: Quick Test (5 minutes)

```bash
cd backend

# Use pre-trained model (no training needed)
python use_pretrained_model.py --quick

# Start detection service
python yolov8_service.py

# Test in your app!
```

### Option 3: Manual Control

```bash
cd backend

# 1. Install
pip install -r requirements.txt

# 2. Get dataset
python download_waste_dataset.py

# 3. Train
python train_waste_model.py --model n --epochs 100

# 4. Test
python test_trained_model.py test_image.jpg

# 5. Deploy
# Edit yolov8_service.py line 20
python yolov8_service.py
```

## 📊 What Happens During Training

```
Terminal Output:

🚀 Starting YOLOv8 Waste Detection Training
====================================================
Device: cuda (GPU)
Model: YOLOv8n
Epochs: 100
====================================================

🎯 Starting training...

Epoch 1/100   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  100%
  box_loss: 1.234  cls_loss: 0.876  mAP50: 0.456

Epoch 2/100   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  100%
  box_loss: 1.156  cls_loss: 0.823  mAP50: 0.523

...

Epoch 100/100 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  100%
  box_loss: 0.234  cls_loss: 0.156  mAP50: 0.892

✅ Training completed!

📈 Training Results:
====================================================
mAP50: 0.8920
mAP50-95: 0.7234
Precision: 0.8756
Recall: 0.8432
====================================================

✅ Best model saved to: waste_detection/waste_yolov8/weights/best.pt
```

## ⏱️ Time Requirements

| Task | Time |
|------|------|
| Install dependencies | 5 minutes |
| Download dataset | 10 minutes |
| Train (50 epochs) | 15-30 minutes |
| Train (100 epochs) | 30-60 minutes |
| Train (200 epochs) | 1-2 hours |
| Test model | 5 minutes |
| Deploy | 5 minutes |

**Total**: 30 minutes to 2.5 hours (depending on epochs)

## 💻 System Requirements

### Minimum
- Python 3.8+
- 8GB RAM
- 10GB free disk space
- CPU (slow but works)

### Recommended
- Python 3.10+
- 16GB RAM
- 20GB free disk space
- NVIDIA GPU with CUDA (10-20x faster)

## 📦 What You Need

### For Pre-trained Model
- ✅ Nothing! Just run the script

### For Custom Training
- ✅ Dataset (100-500+ images per waste type)
- ✅ Labels (bounding boxes around waste items)
- ✅ Time (1-2 hours)
- ✅ Patience

## 🎓 Where to Get a Dataset

### Option 1: Download from Roboflow (Easiest)
```bash
python download_waste_dataset.py
# Choose option 1
# Enter your Roboflow API key (free)
```

### Option 2: Use Public Datasets
- **TACO**: 1,500+ images, 60 categories
- **TrashNet**: 2,500+ images, 6 categories
- Instructions in documentation

### Option 3: Create Your Own
1. Take 100-300 photos per waste type
2. Upload to Roboflow.com (free)
3. Draw bounding boxes
4. Label each box
5. Export in YOLOv8 format

## 🎯 After Training

### 1. Test Your Model
```bash
python test_trained_model.py test_image.jpg
```

### 2. Update Backend Service
Edit `backend/yolov8_service.py` line 20:
```python
model = YOLO('waste_detection/waste_yolov8/weights/best.pt')
```

### 3. Start Service
```bash
python yolov8_service.py
```

### 4. Test in App
1. Open your app
2. Go to "Check Basura Type"
3. Click "Live Scan" button
4. Point camera at waste
5. See real-time detection! 🎉

## 🐛 Troubleshooting

### "No module named 'ultralytics'"
```bash
pip install -r requirements.txt
```

### "CUDA out of memory"
```bash
python train_waste_model.py --batch 8
```

### "No dataset found"
```bash
python download_waste_dataset.py
```

### Training is very slow
- Use GPU (10-20x faster)
- Reduce epochs for testing
- Use smaller model (nano)

## ✅ Success Checklist

Before you start:
- [ ] Python 3.8+ installed
- [ ] Read START_HERE.md
- [ ] Have 1-2 hours available
- [ ] Internet connection (for dataset)

After training:
- [ ] Model file exists (best.pt)
- [ ] mAP50 > 0.85 (85% accuracy)
- [ ] Tested on sample images
- [ ] Updated yolov8_service.py
- [ ] Service starts without errors
- [ ] App shows real-time detection

## 🎉 Your Next Command

Copy and paste this:

```bash
cd backend && python start_training.py
```

Then follow the wizard! It will guide you through everything.

## 📚 Need More Help?

Read these in order:
1. **START_HERE.md** - Overview and options
2. **TRAINING_OPTIONS.md** - Visual flowcharts
3. **backend/TRAINING_README.md** - Detailed guide
4. **docs/REALTIME_WASTE_TRAINING.md** - Complete setup

## 💡 Pro Tips

1. **Start with pre-trained** to test the system
2. **Then train custom** for better accuracy
3. **Use GPU** if available (much faster)
4. **Start with 50 epochs** to test workflow
5. **Train 200 epochs** for production

## 🎯 Summary

I **cannot** train the model for you, but I **created everything** you need to train it yourself:

✅ Interactive wizard
✅ Training scripts
✅ Dataset helpers
✅ Testing tools
✅ Complete documentation
✅ Quick start scripts

**Just run**: `cd backend && python start_training.py`

The wizard handles the rest! 🧙‍♂️

---

**Ready to start?** Open your terminal and run the command above! 🚀
