#!/bin/bash

# YOLOv8 Waste Detection Setup Script
# This script helps set up the Python environment for waste detection

echo "🚀 Setting up YOLOv8 Waste Detection Service"
echo "=============================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

echo "✅ pip found: $(pip3 --version)"
echo ""

# Create virtual environment (optional but recommended)
read -p "Do you want to create a virtual environment? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
    
    echo "✅ Virtual environment created and activated"
    echo ""
fi

# Install requirements
echo "📥 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Train or download a YOLOv8 waste detection model"
echo "2. Update yolov8_service.py with your model path"
echo "3. Start the service: python3 yolov8_service.py"
echo ""
echo "For more information, see docs/WASTE_DETECTION_SETUP.md"
echo "=============================================="
