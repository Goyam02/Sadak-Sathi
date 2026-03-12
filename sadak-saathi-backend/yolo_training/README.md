# YOLOv8 Training

## Setup

1. Install dependencies:
```bash
cd sadak-saathi-backend
pip install -r yolo_training/requirements.txt
```

2. Prepare your dataset:
```
yolo_training/data/
├── images/
│   ├── train/          # Training images
│   └── val/           # Validation images
└── labels/
    ├── train/         # Training labels (YOLO format)
    └── val/           # Validation labels (YOLO format)
```

## Dataset Format

### Images
Place your images in `images/train/` and `images/val/`

### Labels (YOLO format)
Each image should have a corresponding `.txt` file in `labels/train/` or `labels/val/`

Label format (one object per line):
```
<class_id> <x_center> <y_center> <width> <height>
```
- All values are normalized (0-1)
- `class_id`: 0 for pothole
- `x_center`, `y_center`: center of bounding box
- `width`, `height`: bounding box dimensions

Example:
```
0 0.5 0.5 0.3 0.2
```

## Training

Basic training:
```bash
python yolo_training/train.py
```

Custom training:
```bash
python yolo_training/train.py --model yolov8s.pt --epochs 200 --batch 8 --imgsz 1280
```

Arguments:
- `--model`: Model size (yolov8n.pt, yolov8s.pt, yolov8m.pt, yolov8l.pt, yolov8x.pt)
- `--epochs`: Number of training epochs
- `--batch`: Batch size
- `--imgsz`: Image size
- `--device`: Device (cpu, 0, etc.)
- `--name`: Experiment name
- `--project`: Project directory

## Export Model

Export to ONNX:
```python
from yolo_training.train import export_model
export_model(model_path="yolo_training/runs/pothole_detect/weights/best.pt", format="onnx")
```

## Inference

Run prediction:
```python
from yolo_training.train import predict
predict(
    model_path="yolo_training/runs/pothole_detect/weights/best.pt",
    source="test_images/",
    conf=0.25,
)
```

## Model Weights

After training, weights are saved to:
- `yolo_training/runs/pothole_detect/weights/best.pt`
- `yolo_training/runs/pothole_detect/weights/last.pt`
