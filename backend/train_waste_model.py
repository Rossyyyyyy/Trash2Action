"""
YOLOv8 Waste Detection Model Training Script

This script trains a custom YOLOv8 model for waste detection.
Supports training on custom datasets with specific waste categories.
"""

from ultralytics import YOLO
import torch
import os
from pathlib import Path

def train_waste_detection_model(
    data_yaml='waste_data.yaml',
    model_size='n',  # n, s, m, l, x
    epochs=100,
    img_size=640,
    batch_size=16,
    project_name='waste_detection',
    run_name='waste_yolov8'
):
    """
    Train YOLOv8 model for waste detection
    
    Args:
        data_yaml: Path to dataset configuration file
        model_size: Model size (n=nano, s=small, m=medium, l=large, x=xlarge)
        epochs: Number of training epochs
        img_size: Input image size
        batch_size: Batch size for training
        project_name: Project directory name
        run_name: Run name for this training session
    """
    
    # Check if GPU is available
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"\n{'='*60}")
    print(f"🚀 Starting YOLOv8 Waste Detection Training")
    print(f"{'='*60}")
    print(f"Device: {device}")
    print(f"Model: YOLOv8{model_size}")
    print(f"Epochs: {epochs}")
    print(f"Image Size: {img_size}")
    print(f"Batch Size: {batch_size}")
    print(f"{'='*60}\n")
    
    # Load pretrained YOLOv8 model
    model_path = f'yolov8{model_size}.pt'
    print(f"Loading pretrained model: {model_path}")
    model = YOLO(model_path)
    
    # Train the model
    print("\n🎯 Starting training...")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        device=device,
        patience=20,  # Early stopping patience
        save=True,
        project=project_name,
        name=run_name,
        exist_ok=True,
        
        # Optimization
        optimizer='AdamW',
        lr0=0.01,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3.0,
        warmup_momentum=0.8,
        warmup_bias_lr=0.1,
        
        # Data augmentation
        hsv_h=0.015,  # HSV-Hue augmentation
        hsv_s=0.7,    # HSV-Saturation augmentation
        hsv_v=0.4,    # HSV-Value augmentation
        degrees=10.0,  # Rotation
        translate=0.1, # Translation
        scale=0.5,     # Scaling
        shear=0.0,     # Shear
        perspective=0.0, # Perspective
        flipud=0.0,    # Flip up-down
        fliplr=0.5,    # Flip left-right
        mosaic=1.0,    # Mosaic augmentation
        mixup=0.0,     # Mixup augmentation
        copy_paste=0.0, # Copy-paste augmentation
        
        # Validation
        val=True,
        plots=True,
        save_period=10,  # Save checkpoint every N epochs
    )
    
    print("\n✅ Training completed!")
    
    # Validate the model
    print("\n📊 Validating model...")
    metrics = model.val()
    
    print(f"\n{'='*60}")
    print("📈 Training Results:")
    print(f"{'='*60}")
    print(f"mAP50: {metrics.box.map50:.4f}")
    print(f"mAP50-95: {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.mp:.4f}")
    print(f"Recall: {metrics.box.mr:.4f}")
    print(f"{'='*60}\n")
    
    # Get best model path
    best_model_path = Path(project_name) / run_name / 'weights' / 'best.pt'
    print(f"✅ Best model saved to: {best_model_path}")
    
    # Export model (optional)
    try:
        print("\n📦 Exporting model to ONNX format...")
        model.export(format='onnx')
        print("✅ ONNX export successful!")
    except Exception as e:
        print(f"⚠️  ONNX export failed: {e}")
    
    return str(best_model_path)


def create_sample_dataset_config():
    """Create a sample dataset configuration file"""
    
    config = """# Waste Detection Dataset Configuration
# Update paths and classes according to your dataset

# Dataset root directory
path: ./dataset

# Train and validation image directories (relative to 'path')
train: train/images
val: valid/images

# Class names (update with your waste categories)
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

# Optional: Test set
# test: test/images
"""
    
    with open('waste_data.yaml', 'w') as f:
        f.write(config)
    
    print("✅ Created sample dataset configuration: waste_data.yaml")
    print("📝 Please update the file with your dataset paths and classes")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train YOLOv8 for waste detection')
    parser.add_argument('--data', type=str, default='waste_data.yaml',
                        help='Path to dataset YAML file')
    parser.add_argument('--model', type=str, default='n',
                        choices=['n', 's', 'm', 'l', 'x'],
                        help='Model size (n=nano, s=small, m=medium, l=large, x=xlarge)')
    parser.add_argument('--epochs', type=int, default=100,
                        help='Number of training epochs')
    parser.add_argument('--img-size', type=int, default=640,
                        help='Input image size')
    parser.add_argument('--batch', type=int, default=16,
                        help='Batch size')
    parser.add_argument('--create-config', action='store_true',
                        help='Create sample dataset configuration file')
    
    args = parser.parse_args()
    
    if args.create_config:
        create_sample_dataset_config()
    else:
        # Check if data file exists
        if not os.path.exists(args.data):
            print(f"❌ Dataset configuration file not found: {args.data}")
            print("💡 Run with --create-config to create a sample configuration")
            exit(1)
        
        # Train model
        best_model = train_waste_detection_model(
            data_yaml=args.data,
            model_size=args.model,
            epochs=args.epochs,
            img_size=args.img_size,
            batch_size=args.batch
        )
        
        print(f"\n🎉 Training complete! Use this model in yolov8_service.py:")
        print(f"   model = YOLO('{best_model}')")
