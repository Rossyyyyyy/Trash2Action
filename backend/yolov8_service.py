"""
YOLOv8 Waste Detection Service
This service provides waste classification using YOLOv8 model.

Requirements:
- pip install ultralytics flask pillow numpy

Usage:
- python yolov8_service.py
- Service will run on http://localhost:5001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
import io
import numpy as np

app = Flask(__name__)
CORS(app)

# Load YOLOv8 model (you can train your own or use a pre-trained one)
# For waste detection, you'll need to train on a waste dataset
# Example datasets: TACO, TrashNet, etc.
try:
    model = YOLO('yolov8n.pt')  # Replace with your trained waste model
    print("✅ YOLOv8 model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# Waste type mapping (customize based on your trained model)
# This maps detected classes to waste categories and disposal recommendations
WASTE_CATEGORIES = {
    # Plastics
    'plastic': {
        'category': 'Recyclable',
        'recommendation': 'Place in recyclable bin. Rinse before disposal.'
    },
    'plastic-bottle': {
        'category': 'Recyclable',
        'recommendation': 'Remove cap, rinse, and place in plastic recycling bin.'
    },
    'plastic-bag': {
        'category': 'Recyclable',
        'recommendation': 'Clean and dry. Take to plastic bag recycling drop-off.'
    },
    'bottle': {
        'category': 'Recyclable',
        'recommendation': 'Rinse and recycle. Check if cap is recyclable separately.'
    },
    
    # Paper products
    'paper': {
        'category': 'Recyclable',
        'recommendation': 'Place in paper recycling bin. Keep dry.'
    },
    'cardboard': {
        'category': 'Recyclable',
        'recommendation': 'Flatten and place in cardboard recycling. Remove tape/staples.'
    },
    
    # Metals
    'metal': {
        'category': 'Recyclable',
        'recommendation': 'Rinse and place in metal recycling bin.'
    },
    'metal-can': {
        'category': 'Recyclable',
        'recommendation': 'Rinse thoroughly and recycle with metals.'
    },
    'can': {
        'category': 'Recyclable',
        'recommendation': 'Rinse and recycle. Aluminum cans are highly recyclable.'
    },
    
    # Glass
    'glass': {
        'category': 'Recyclable',
        'recommendation': 'Place in glass recycling bin. Remove caps.'
    },
    'glass-bottle': {
        'category': 'Recyclable',
        'recommendation': 'Rinse, remove cap, and place in glass recycling.'
    },
    
    # Organic
    'organic': {
        'category': 'Biodegradable',
        'recommendation': 'Dispose in compost bin or biodegradable waste container.'
    },
    'food-container': {
        'category': 'Check Material',
        'recommendation': 'Check if plastic, paper, or foam. Rinse before recycling if applicable.'
    },
    
    # Electronics
    'electronic': {
        'category': 'Hazardous',
        'recommendation': 'Take to e-waste collection center. Do not dispose in regular bins.'
    },
    'electronic-waste': {
        'category': 'Hazardous',
        'recommendation': 'Take to certified e-waste recycling facility. Contains hazardous materials.'
    },
    'cellphone': {
        'category': 'Hazardous',
        'recommendation': 'Take to electronics recycling. Remove personal data first. Contains valuable materials.'
    },
    'cell phone': {
        'category': 'Hazardous',
        'recommendation': 'Take to electronics recycling. Remove personal data first. Contains valuable materials.'
    },
    'phone': {
        'category': 'Hazardous',
        'recommendation': 'Recycle at electronics collection point. Wipe data before disposal.'
    },
    
    # Batteries
    'battery': {
        'category': 'Hazardous',
        'recommendation': 'Take to battery recycling center. Never throw in regular trash.'
    },
    
    # Styrofoam
    'styrofoam': {
        'category': 'Special Handling',
        'recommendation': 'Check local recycling options. Many areas require special drop-off.'
    },
    
    # General/Unknown
    'general': {
        'category': 'Non-recyclable',
        'recommendation': 'Dispose in general waste bin.'
    },
    'general-waste': {
        'category': 'Non-recyclable',
        'recommendation': 'Dispose in general waste bin.'
    },
    'trash': {
        'category': 'Non-recyclable',
        'recommendation': 'Dispose in general waste bin.'
    }
}

# Fallback for unknown classes
def get_waste_info(class_name):
    """Get waste category info with fallback for unknown classes"""
    class_lower = class_name.lower()
    
    # Direct match
    if class_lower in WASTE_CATEGORIES:
        return WASTE_CATEGORIES[class_lower]
    
    # Partial match
    for key in WASTE_CATEGORIES:
        if key in class_lower or class_lower in key:
            return WASTE_CATEGORIES[key]
    
    # Default fallback
    return {
        'category': 'Unknown',
        'recommendation': f'Detected as {class_name}. Please verify waste type and dispose accordingly.'
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/detect', methods=['POST'])
def detect_waste():
    """
    Detect waste type from uploaded image (single best detection)
    
    Expected: multipart/form-data with 'image' field
    Returns: JSON with detection results
    """
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image provided'
            }), 400

        if model is None:
            return jsonify({
                'success': False,
                'message': 'Model not loaded'
            }), 500

        # Read image
        image_file = request.files['image']
        image_bytes = image_file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # Run inference
        results = model(image)
        
        # Process results
        if len(results) > 0 and len(results[0].boxes) > 0:
            # Get the detection with highest confidence
            boxes = results[0].boxes
            confidences = boxes.conf.cpu().numpy()
            classes = boxes.cls.cpu().numpy()
            
            # Get best detection
            best_idx = np.argmax(confidences)
            best_class = int(classes[best_idx])
            best_confidence = float(confidences[best_idx])
            
            # Get class name
            class_name = results[0].names[best_class]
            
            # Map to waste category with fallback
            waste_info = get_waste_info(class_name)
            
            return jsonify({
                'success': True,
                'result': {
                    'wasteType': class_name.title(),
                    'category': waste_info['category'],
                    'confidence': round(best_confidence * 100, 2),
                    'recommendation': waste_info['recommendation']
                }
            })
        else:
            # No detection found
            return jsonify({
                'success': False,
                'message': 'No waste detected in image'
            }), 400

    except Exception as e:
        print(f"Error during detection: {e}")
        return jsonify({
            'success': False,
            'message': f'Detection error: {str(e)}'
        }), 500

@app.route('/detect-multiple', methods=['POST'])
def detect_multiple():
    """
    Detect multiple objects in image with bounding boxes (for real-time detection)
    
    Expected: multipart/form-data with 'image' field
    Returns: JSON with array of detections including bounding boxes
    """
    try:
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image provided'
            }), 400

        if model is None:
            return jsonify({
                'success': False,
                'message': 'Model not loaded'
            }), 500

        # Read image
        image_file = request.files['image']
        image_bytes = image_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        img_width, img_height = image.size

        # Run inference
        results = model(image, conf=0.3)  # Lower confidence threshold for real-time
        
        detections = []
        
        # Process all detections
        if len(results) > 0 and len(results[0].boxes) > 0:
            boxes = results[0].boxes
            
            for i in range(len(boxes)):
                box = boxes[i]
                confidence = float(box.conf.cpu().numpy()[0])
                class_id = int(box.cls.cpu().numpy()[0])
                class_name = results[0].names[class_id]
                
                # Get bounding box coordinates (xyxy format)
                coords = box.xyxy.cpu().numpy()[0]
                x1, y1, x2, y2 = coords
                
                # Convert to x, y, width, height
                x = float(x1)
                y = float(y1)
                width = float(x2 - x1)
                height = float(y2 - y1)
                
                detections.append({
                    'label': class_name.title(),
                    'confidence': confidence,
                    'x': x,
                    'y': y,
                    'width': width,
                    'height': height
                })
        
        return jsonify({
            'success': True,
            'detections': detections,
            'count': len(detections)
        })

    except Exception as e:
        print(f"Error during multiple detection: {e}")
        return jsonify({
            'success': False,
            'message': f'Detection error: {str(e)}'
        }), 500

@app.route('/classes', methods=['GET'])
def get_classes():
    """Get list of detectable waste classes"""
    if model is None:
        return jsonify({
            'success': False,
            'message': 'Model not loaded'
        }), 500
    
    return jsonify({
        'success': True,
        'classes': list(WASTE_CATEGORIES.keys())
    })

if __name__ == '__main__':
    print("\n🚀 YOLOv8 Waste Detection Service")
    print("=" * 50)
    print(f"Model Status: {'✅ Loaded' if model else '❌ Not Loaded'}")
    print(f"Endpoint: http://localhost:5001/detect")
    print(f"Health Check: http://localhost:5001/health")
    print("=" * 50 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
