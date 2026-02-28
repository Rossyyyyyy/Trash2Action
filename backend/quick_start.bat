@echo off
REM Quick Start Script for Waste Detection (Windows)

echo ==================================
echo 🚀 Waste Detection Quick Start
echo ==================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    exit /b 1
)

echo ✅ Python found
python --version
echo.

REM Install requirements
echo 📦 Installing requirements...
pip install -q ultralytics torch torchvision pillow numpy flask flask-cors

echo ✅ Requirements installed
echo.

REM Download YOLOv8 model
echo 📥 Downloading YOLOv8 model...
python -c "from ultralytics import YOLO; model = YOLO('yolov8n.pt'); print('✅ Model downloaded')"

echo.
echo ==================================
echo ✅ Setup Complete!
echo ==================================
echo.
echo 🎯 Next steps:
echo.
echo Option 1: Use pre-trained model (immediate)
echo   python use_pretrained_model.py --quick
echo.
echo Option 2: Train custom model (1-2 hours)
echo   python start_training.py
echo.
echo Option 3: Start detection service now
echo   python yolov8_service.py
echo.

pause
