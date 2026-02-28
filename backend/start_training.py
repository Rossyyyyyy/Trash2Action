"""
Interactive training setup for waste detection

This script guides you through the training process step-by-step.
"""

import os
import sys
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    print("\n🔍 Checking requirements...")
    
    required = {
        'ultralytics': 'YOLOv8',
        'torch': 'PyTorch',
        'PIL': 'Pillow',
        'numpy': 'NumPy',
    }
    
    missing = []
    for package, name in required.items():
        try:
            __import__(package)
            print(f"  ✅ {name}")
        except ImportError:
            print(f"  ❌ {name}")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        print("\n💡 Install with:")
        print("   pip install -r requirements.txt")
        return False
    
    print("\n✅ All requirements installed!")
    return True

def check_dataset():
    """Check if dataset exists"""
    print("\n🔍 Checking for dataset...")
    
    dataset_paths = [
        'dataset',
        'waste_data.yaml',
    ]
    
    for path in dataset_paths:
        if os.path.exists(path):
            print(f"  ✅ Found: {path}")
            return True
    
    print("  ❌ No dataset found")
    return False

def setup_wizard():
    """Interactive setup wizard"""
    
    print("\n" + "="*60)
    print("🧙 Waste Detection Training Wizard")
    print("="*60)
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Please install requirements first")
        print("   cd backend && pip install -r requirements.txt")
        return
    
    # Check dataset
    has_dataset = check_dataset()
    
    if not has_dataset:
        print("\n📦 You need a dataset to train!")
        print("\nOptions:")
        print("1. Download from Roboflow (recommended)")
        print("2. Use pre-trained model (no training needed)")
        print("3. Create dataset structure (manual)")
        print("4. Exit and prepare dataset manually")
        
        choice = input("\nChoose option (1-4): ").strip()
        
        if choice == "1":
            print("\n📥 Running dataset downloader...")
            os.system("python download_waste_dataset.py")
            
        elif choice == "2":
            print("\n📥 Setting up pre-trained model...")
            os.system("python use_pretrained_model.py --quick")
            print("\n✅ You can skip training and use the pre-trained model!")
            return
            
        elif choice == "3":
            print("\n📁 Creating dataset structure...")
            os.system("python download_waste_dataset.py")
            print("\n📝 Now add your images and labels to dataset/ folder")
            return
            
        else:
            print("\n👋 Prepare your dataset and run this script again")
            return
    
    # Dataset exists, proceed with training
    print("\n" + "="*60)
    print("🎯 Ready to Train!")
    print("="*60)
    
    # Training configuration
    print("\n⚙️  Training Configuration:")
    print("\nModel size:")
    print("  n - Nano (fastest, real-time, ~6MB)")
    print("  s - Small (balanced, ~22MB)")
    print("  m - Medium (accurate, ~50MB)")
    
    model = input("\nChoose model (n/s/m) [default: n]: ").strip().lower() or 'n'
    
    print("\nTraining duration:")
    print("  50 - Quick test (~15 min)")
    print("  100 - Good baseline (~30 min)")
    print("  200 - Production quality (~1-2 hours)")
    
    epochs = input("\nEpochs [default: 100]: ").strip() or '100'
    
    print("\nBatch size (adjust based on GPU memory):")
    print("  8 - Low memory")
    print("  16 - Standard")
    print("  32 - High memory")
    
    batch = input("\nBatch size [default: 16]: ").strip() or '16'
    
    # Find dataset config
    data_yaml = 'waste_data.yaml'
    if not os.path.exists(data_yaml):
        # Look for data.yaml in dataset folder
        possible_paths = [
            'dataset/data.yaml',
            'dataset/waste_data.yaml',
        ]
        for path in possible_paths:
            if os.path.exists(path):
                data_yaml = path
                break
    
    # Confirm
    print("\n" + "="*60)
    print("📋 Training Summary:")
    print("="*60)
    print(f"Model: YOLOv8{model}")
    print(f"Epochs: {epochs}")
    print(f"Batch size: {batch}")
    print(f"Dataset: {data_yaml}")
    print("="*60)
    
    confirm = input("\nStart training? (y/n): ").strip().lower()
    
    if confirm == 'y':
        print("\n🚀 Starting training...")
        print("⏰ This will take a while. You can monitor progress in the terminal.\n")
        
        cmd = f"python train_waste_model.py --data {data_yaml} --model {model} --epochs {epochs} --batch {batch}"
        print(f"Running: {cmd}\n")
        
        os.system(cmd)
        
        print("\n" + "="*60)
        print("✅ Training Complete!")
        print("="*60)
        print("\n📝 Next steps:")
        print("1. Check results in: waste_detection/waste_yolov8/")
        print("2. Test model: python test_trained_model.py test_image.jpg")
        print("3. Update yolov8_service.py with trained model path")
        print("4. Start service: python yolov8_service.py")
        
    else:
        print("\n👋 Training cancelled")

def main():
    """Main function"""
    
    print("\n" + "="*60)
    print("🗑️  Waste Detection AI - Training Setup")
    print("="*60)
    
    print("\nWhat would you like to do?")
    print("1. Start training wizard (recommended)")
    print("2. Use pre-trained model (no training)")
    print("3. Download dataset only")
    print("4. Check system requirements")
    
    choice = input("\nChoose option (1-4): ").strip()
    
    if choice == "1":
        setup_wizard()
        
    elif choice == "2":
        print("\n📥 Setting up pre-trained model...")
        os.system("python use_pretrained_model.py")
        
    elif choice == "3":
        print("\n📥 Downloading dataset...")
        os.system("python download_waste_dataset.py")
        
    elif choice == "4":
        check_requirements()
        check_dataset()
        
    else:
        print("\n❌ Invalid choice")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
