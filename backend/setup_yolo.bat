@echo off
REM YOLOv8 Waste Detection Setup Script for Windows
REM This script helps set up the Python environment for waste detection

echo.
echo ========================================
echo YOLOv8 Waste Detection Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

echo [OK] Python found
python --version
echo.

REM Check if pip is installed
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not installed. Please install pip.
    pause
    exit /b 1
)

echo [OK] pip found
pip --version
echo.

REM Ask about virtual environment
set /p VENV="Do you want to create a virtual environment? (y/n): "
if /i "%VENV%"=="y" (
    echo.
    echo Creating virtual environment...
    python -m venv venv
    
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    
    echo [OK] Virtual environment created and activated
    echo.
)

REM Install requirements
echo Installing Python dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed successfully
echo.
echo ========================================
echo Setup complete!
echo.
echo Next steps:
echo 1. Train or download a YOLOv8 waste detection model
echo 2. Update yolov8_service.py with your model path
echo 3. Start the service: python yolov8_service.py
echo.
echo For more information, see docs\WASTE_DETECTION_SETUP.md
echo ========================================
echo.
pause
