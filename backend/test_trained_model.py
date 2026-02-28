"""
Test trained YOLOv8 waste detection model

Usage:
    python test_trained_model.py path/to/image.jpg
    python test_trained_model.py path/to/image.jpg --model path/to/model.pt
"""

from ultralytics import YOLO
from PIL import Image
import sys
import os
from pathlib import Path

def test_model(image_path, model_path='waste_detection/waste_yolov8/weights/best.pt'):
    """
    Test trained model on an image
    
    Args:
        image_path: Path to test image
        model_path: Path to trained model weights
    """
    
    print("\n" + "="*60)
    print("🧪 Testing YOLOv8 Waste Detection Model")
    print("="*60)
    
    # Check if model exists
    if not os.path.exists(model_path):
        print(f"\n❌ Model not found: {model_path}")
        print("\n💡 Available options:")
        print("1. Train a model: python train_waste_model.py")
        print("2. Use pretrained model: --model yolov8n.pt")
        return
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"\n❌ Image not found: {image_path}")
        return
    
    print(f"\n📦 Loading model: {model_path}")
    try:
        model = YOLO(model_path)
        print("✅ Model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return
    
    print(f"\n🖼️  Testing image: {image_path}")
    
    # Run inference
    try:
        results = model(image_path, conf=0.25)
        
        if len(results) == 0:
            print("⚠️  No results returned")
            return
        
        result = results[0]
        boxes = result.boxes
        
        print(f"\n📊 Detection Results:")
        print("="*60)
        
        if len(boxes) == 0:
            print("❌ No objects detected")
            print("\n💡 Try:")
            print("- Using a clearer image")
            print("- Lowering confidence threshold")
            print("- Training with more data")
        else:
            print(f"✅ Detected {len(boxes)} object(s):\n")
            
            for i, box in enumerate(boxes, 1):
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                class_name = result.names[class_id]
                
                # Get bounding box coordinates
                coords = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = coords
                
                print(f"{i}. {class_name}")
                print(f"   Confidence: {confidence:.2%}")
                print(f"   Box: ({x1:.0f}, {y1:.0f}) to ({x2:.0f}, {y2:.0f})")
                print()
        
        # Save annotated image
        output_path = 'result_annotated.jpg'
        result.save(output_path)
        print(f"💾 Saved annotated image: {output_path}")
        
        # Print model info
        print("\n" + "="*60)
        print("📋 Model Information:")
        print("="*60)
        print(f"Classes: {len(result.names)}")
        print(f"Class names: {', '.join(result.names.values())}")
        
    except Exception as e:
        print(f"\n❌ Error during inference: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test YOLOv8 waste detection model')
    parser.add_argument('image', type=str, help='Path to test image')
    parser.add_argument('--model', type=str, 
                        default='waste_detection/waste_yolov8/weights/best.pt',
                        help='Path to model weights')
    parser.add_argument('--conf', type=float, default=0.25,
                        help='Confidence threshold (0-1)')
    
    args = parser.parse_args()
    
    test_model(args.image, args.model)
    
    print("\n" + "="*60)
    print("✅ Test complete!")
    print("="*60 + "\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("\n❌ Usage: python test_trained_model.py <image_path>")
        print("\nExample:")
        print("  python test_trained_model.py test_image.jpg")
        print("  python test_trained_model.py test_image.jpg --model yolov8n.pt")
        sys.exit(1)
    
    main()
