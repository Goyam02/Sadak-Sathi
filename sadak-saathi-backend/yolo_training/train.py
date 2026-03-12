import os
import sys
from pathlib import Path

from ultralytics import YOLO

BASE_DIR = Path(__file__).parent.parent


def train_yolo(
    data_path: str = "Potholes-1/data.yaml",
    model_size: str = "yolov8n.pt",
    epochs: int = 100,
    imgsz: int = 640,
    batch: int = 16,
    project: str = "yolo_training/runs",
    name: str = "pothole_detect",
    pretrained: bool = True,
    optimizer: str = "SGD",
    lr0: float = 0.01,
    momentum: float = 0.937,
    weight_decay: float = 0.0005,
    patience: int = 50,
    save: bool = True,
    save_period: int = -1,
    cache: bool = False,
    device: str = "0",
    workers: int = 8,
    close_mosaic: int = 10,
    resume: bool = False,
    amp: bool = True,
    fraction: float = 1.0,
    profile: bool = False,
    freeze: list | None = None,
    overlap_mask: bool = True,
    mask_ratio: int = 4,
    dropout: float = 0.0,
    val: bool = True,
    plots: bool = True,
):
    """Train YOLOv8 model for pothole detection."""
    
    model = YOLO(model_size)
    
    results = model.train(
        data=data_path,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=project,
        name=name,
        pretrained=pretrained,
        optimizer=optimizer,
        lr0=lr0,
        momentum=momentum,
        weight_decay=weight_decay,
        patience=patience,
        save=save,
        save_period=save_period,
        cache=cache,
        device=device,
        workers=workers,
        close_mosaic=close_mosaic,
        resume=resume,
        amp=amp,
        fraction=fraction,
        profile=profile,
        freeze=freeze,
        overlap_mask=overlap_mask,
        mask_ratio=mask_ratio,
        dropout=dropout,
        val=val,
        plots=plots,
    )
    
    return results


def export_model(
    model_path: str = "yolo_training/runs/pothole_detect/weights/best.pt",
    format: str = "onnx",
    imgsz: int = 640,
    half: bool = False,
):
    """Export trained model to different formats."""
    
    model = YOLO(model_path)
    model.export(format=format, imgsz=imgsz, half=half)


def predict(
    model_path: str = "yolo_training/runs/pothole_detect/weights/best.pt",
    source: str = "test_images",
    conf: float = 0.25,
    iou: float = 0.45,
    save: bool = True,
    device: str = "0",
):
    """Run inference on images."""
    
    model = YOLO(model_path)
    results = model.predict(
        source=source,
        conf=conf,
        iou=iou,
        save=save,
        device=device,
    )
    
    return results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="YOLOv8 Pothole Detection Training")
    parser.add_argument("--data", type=str, default="Potholes-1/data.yaml", help="Path to data.yaml")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Model size (yolov8n.pt, yolov8s.pt, yolov8m.pt, etc.)")
    parser.add_argument("--epochs", type=int, default=100, help="Number of epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--device", type=str, default="0", help="Device (cpu, 0, etc. Use 0 for GPU)")
    parser.add_argument("--workers", type=int, default=8, help="Number of worker threads")
    parser.add_argument("--name", type=str, default="pothole_detect", help="Experiment name")
    parser.add_argument("--project", type=str, default="yolo_training/runs", help="Project directory")
    
    args = parser.parse_args()
    
    train_yolo(
        data_path=args.data,
        model_size=args.model,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        project=args.project,
        name=args.name,
        device=args.device,
        workers=args.workers,
    )
