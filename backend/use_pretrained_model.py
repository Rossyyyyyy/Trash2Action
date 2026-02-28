"""
Download and use a pre-trained waste detection model

This script downloads a pre-trained YOLOv8 model that can detect common waste items
without requiring you to train from scratch.
"""

from ultralytics import YOLO
import os
from pathlib import Path

def download_pretrained_waste_model():
    """
    Download a pre-trained waste detection model
    
    Options:
    1. Use YOLOv8 trained on COCO (has bottles, cell phones, etc.)
    2. Download from Ultralytics Hub
    3. Use community models
    """
    
    print("\n" + "="*60)
    print("📦 Pre-trained Waste Detection Model Setup")
    print("="*60 + "\n")
    
    # Option 1: Use COCO-trained model (has some waste-related classes)
    print("Option 1: YOLOv8 COCO Model (Immediate)")
    print("Can detect: bottle, cell phone, cup, bowl, etc.")
    print("\nOption 2: Download from Roboflow (Requires API key)")
    print("Can detect: plastic, paper, metal, glass, etc.")
    
    choice = input("\nChoose option (1 or 2): ").strip()
    
    if choice == "1":
        use_coco_model()
    elif choice == "2":
        download_roboflow_model()
    else:
        print("Invalid choice")

def use_coco_model():
    """Use YOLOv8 trained on COCO dataset"""
    
    print("\n📥 Downloading YOLOv8 COCO model...")
    
    # Download YOLOv8 models (will auto-download if not present)
    models = {
        'n': 'yolov8n.pt',  # Nano - fastest
        's': 'yolov8s.pt',  # Small - balanced
        'm': 'yolov8m.pt',  # Medium - accurate
    }
    
    print("\nAvailable models:")
    print("n - Nano (fastest, real-time)")
    print("s - Small (balanced)")
    print("m - Medium (most accurate)")
    
    size = input("\nChoose model size (n/s/m): ").strip().lower() or 'n'
    
    if size not in models:
        size = 'n'
    
    model_path = models[size]
    
    print(f"\n📦 Loading {model_path}...")
    model = YOLO(model_path)
    
    print("\n✅ Model loaded successfully!")
    print("\n📋 Detectable waste-related objects:")
    
    # COCO classes that are waste-related
    waste_classes = [
        'bottle', 'cup', 'bowl', 'spoon', 'fork', 'knife',
        'cell phone', 'laptop', 'keyboard', 'mouse',
        'book', 'scissors', 'teddy bear', 'toothbrush'
    ]
    
    for cls in waste_classes:
        print(f"  - {cls}")
    
    print(f"\n💾 Model saved as: {model_path}")
    print("\n🚀 Next steps:")
    print(f"1. Update yolov8_service.py line 20:")
    print(f"   model = YOLO('{model_path}')")
    print("2. Start service: python yolov8_service.py")
    print("3. Test in your app!")
    
    # Test the model
    test = input("\nTest model on an image? (y/n): ").strip().lower()
    if test == 'y':
        image_path = input("Enter image path: ").strip()
        if os.path.exists(image_path):
            print("\n🔍 Running detection...")
            results = model(image_path)
            results[0].save('detection_result.jpg')
            print("✅ Result saved as: detection_result.jpg")
        else:
            print("❌ Image not found")

def download_roboflow_model():
    """Download pre-trained model from Roboflow"""
    
    print("\n📥 Downloading from Roboflow...")
    print("\n📝 You need:")
    print("1. Roboflow account (free): https://roboflow.com")
    print("2. API key from: https://app.roboflow.com/settings/api")
    print("3. A waste detection project")
    
    try:
        from roboflow import Roboflow
        
        api_key = input("\nEnter Roboflow API key: ").strip()
        workspace = input("Enter workspace name: ").strip()
        project = input("Enter project name: ").strip()
        version = input("Enter version (default: 1): ").strip() or "1"
        
        print("\n📥 Downloading...")
        rf = Roboflow(api_key=api_key)
        project_obj = rf.workspace(workspace).project(project)
        dataset = project_obj.version(int(version)).download("yolov8")
        
        print(f"\n✅ Dataset downloaded to: {dataset.location}")
        
        # Find the data.yaml file
        data_yaml = Path(dataset.location) / "data.yaml"
        
        if data_yaml.exists():
            print(f"\n🎯 Train model with:")
            print(f"python train_waste_model.py --data {data_yaml}")
        
    except ImportError:
        print("\n❌ Roboflow not installed")
        print("Install with: pip install roboflow")
    except Exception as e:
        print(f"\n❌ Error: {e}")

def quick_setup_coco():
    """Quick setup using COCO model"""
    print("\n🚀 Quick Setup - Using YOLOv8 COCO Model\n")
    
    model_path = 'yolov8n.pt'
    print(f"📦 Loading {model_path}...")
    model = YOLO(model_path)
    
    print("✅ Model ready!")
    print("\n📋 Can detect waste-related items:")
    print("  - bottle, cup, bowl")
    print("  - cell phone, laptop")
    print("  - fork, knife, spoon")
    print("  - and more...")
    
    print(f"\n🔧 Update yolov8_service.py:")
    print(f"   Line 20: model = YOLO('{model_path}')")
    
    return model_path

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--quick':
        quick_setup_coco()
    else:
        download_pretrained_waste_model()
