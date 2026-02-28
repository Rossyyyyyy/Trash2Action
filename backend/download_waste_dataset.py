"""
Download and prepare waste detection datasets

This script helps you download pre-existing waste detection datasets
from various sources including Roboflow and other public repositories.
"""

import os
import sys
import zipfile
import requests
from pathlib import Path

def download_file(url, destination):
    """Download file with progress bar"""
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(destination, 'wb') as file:
        downloaded = 0
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                file.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    progress = (downloaded / total_size) * 100
                    print(f"\rDownloading: {progress:.1f}%", end='')
    print()

def download_roboflow_dataset(api_key, workspace, project, version=1):
    """
    Download dataset from Roboflow
    
    Args:
        api_key: Your Roboflow API key
        workspace: Workspace name
        project: Project name
        version: Dataset version
    """
    try:
        from roboflow import Roboflow
        
        print(f"📥 Downloading from Roboflow...")
        print(f"   Workspace: {workspace}")
        print(f"   Project: {project}")
        print(f"   Version: {version}")
        
        rf = Roboflow(api_key=api_key)
        project_obj = rf.workspace(workspace).project(project)
        dataset = project_obj.version(version).download("yolov8")
        
        print(f"✅ Dataset downloaded to: {dataset.location}")
        return dataset.location
        
    except ImportError:
        print("❌ Roboflow package not installed")
        print("💡 Install with: pip install roboflow")
        return None
    except Exception as e:
        print(f"❌ Error downloading from Roboflow: {e}")
        return None

def download_sample_waste_images():
    """Download sample waste images for testing"""
    
    print("📥 Downloading sample waste images...")
    
    # Create sample directory
    sample_dir = Path('sample_images')
    sample_dir.mkdir(exist_ok=True)
    
    # Sample image URLs (replace with actual waste image URLs)
    sample_urls = {
        'plastic_bottle_1.jpg': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=640',
        'plastic_bag_1.jpg': 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=640',
        'paper_waste_1.jpg': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=640',
    }
    
    for filename, url in sample_urls.items():
        try:
            filepath = sample_dir / filename
            if not filepath.exists():
                print(f"Downloading {filename}...")
                download_file(url, filepath)
        except Exception as e:
            print(f"⚠️  Failed to download {filename}: {e}")
    
    print(f"✅ Sample images saved to: {sample_dir}")
    return str(sample_dir)

def setup_taco_dataset():
    """
    Instructions for downloading TACO dataset
    TACO: Trash Annotations in Context
    """
    print("\n" + "="*60)
    print("📦 TACO Dataset (Trash Annotations in Context)")
    print("="*60)
    print("\nTACO is a large-scale dataset of waste in diverse environments.")
    print("It contains 1,500+ images with 60 waste categories.\n")
    print("To download TACO dataset:")
    print("1. Visit: http://tacodataset.org")
    print("2. Clone the repository:")
    print("   git clone https://github.com/pedropro/TACO.git")
    print("3. Follow their download instructions")
    print("4. Convert annotations to YOLO format using their scripts")
    print("="*60 + "\n")

def setup_trashnet_dataset():
    """
    Instructions for downloading TrashNet dataset
    """
    print("\n" + "="*60)
    print("📦 TrashNet Dataset")
    print("="*60)
    print("\nTrashNet contains 2,527 images across 6 categories:")
    print("- Glass, Paper, Cardboard, Plastic, Metal, Trash\n")
    print("To download TrashNet:")
    print("1. Visit: https://github.com/garythung/trashnet")
    print("2. Download the dataset")
    print("3. Convert to YOLO format (labels needed)")
    print("="*60 + "\n")

def create_dataset_structure():
    """Create standard YOLOv8 dataset structure"""
    
    print("📁 Creating dataset structure...")
    
    base_dir = Path('dataset')
    
    # Create directories
    dirs = [
        base_dir / 'train' / 'images',
        base_dir / 'train' / 'labels',
        base_dir / 'valid' / 'images',
        base_dir / 'valid' / 'labels',
        base_dir / 'test' / 'images',
        base_dir / 'test' / 'labels',
    ]
    
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
    
    # Create README
    readme_content = """# Waste Detection Dataset

## Structure
```
dataset/
├── train/
│   ├── images/     # Training images
│   └── labels/     # Training labels (YOLO format)
├── valid/
│   ├── images/     # Validation images
│   └── labels/     # Validation labels
└── test/
    ├── images/     # Test images (optional)
    └── labels/     # Test labels (optional)
```

## Label Format (YOLO)
Each .txt file contains one line per object:
```
<class_id> <x_center> <y_center> <width> <height>
```
All values are normalized (0-1).

## Adding Images
1. Place images in respective folders
2. Create corresponding .txt label files
3. Update waste_data.yaml with class names
"""
    
    with open(base_dir / 'README.md', 'w') as f:
        f.write(readme_content)
    
    print(f"✅ Dataset structure created at: {base_dir}")
    print("📝 Add your images and labels to the respective folders")
    
    return str(base_dir)

def main():
    """Main function"""
    
    print("\n" + "="*60)
    print("🗑️  Waste Detection Dataset Setup")
    print("="*60 + "\n")
    
    print("Choose an option:")
    print("1. Download from Roboflow (requires API key)")
    print("2. Setup TACO dataset (manual)")
    print("3. Setup TrashNet dataset (manual)")
    print("4. Create empty dataset structure")
    print("5. Download sample images for testing")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    if choice == '1':
        print("\n📝 Roboflow Setup")
        print("Get your API key from: https://app.roboflow.com/settings/api")
        api_key = input("Enter Roboflow API key: ").strip()
        workspace = input("Enter workspace name: ").strip()
        project = input("Enter project name: ").strip()
        version = input("Enter version (default: 1): ").strip() or "1"
        
        download_roboflow_dataset(api_key, workspace, project, int(version))
        
    elif choice == '2':
        setup_taco_dataset()
        
    elif choice == '3':
        setup_trashnet_dataset()
        
    elif choice == '4':
        create_dataset_structure()
        
    elif choice == '5':
        download_sample_waste_images()
        
    else:
        print("❌ Invalid choice")
        return
    
    print("\n✅ Setup complete!")
    print("\n📚 Next steps:")
    print("1. Prepare your dataset in YOLO format")
    print("2. Update waste_data.yaml with your classes")
    print("3. Run: python train_waste_model.py")

if __name__ == '__main__':
    main()
