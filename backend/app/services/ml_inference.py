"""
ML Inference Service
--------------------
Wraps two models:
  1. YOLOv8 nano  — visual pothole detection from camera frames
  2. LSTM         — accelerometer classification (S1/S2/S3 severity)

Both are loaded once at startup and reused across requests.
"""

import asyncio
import logging
import io
from pathlib import Path
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

# Lazy-loaded model globals
_yolo_model = None
_lstm_model = None
_torch = None


async def load_models():
    """Called once at FastAPI startup. Loads models into memory."""
    global _yolo_model, _lstm_model, _torch

    from app.config import get_settings
    settings = get_settings()

    try:
        import torch
        _torch = torch
        logger.info("PyTorch loaded successfully")
    except ImportError:
        logger.warning("PyTorch not available — ML inference disabled")
        return

    # Load YOLOv8
    yolo_path = Path(settings.YOLO_MODEL_PATH)
    if yolo_path.exists():
        try:
            from ultralytics import YOLO
            _yolo_model = YOLO(str(yolo_path))
            _yolo_model.fuse()
            logger.info(f"YOLOv8 model loaded from {yolo_path}")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8: {e}")
    else:
        logger.warning(f"YOLOv8 weights not found at {yolo_path}. Visual detection disabled.")

    # Load LSTM
    lstm_path = Path(settings.LSTM_MODEL_PATH)
    if lstm_path.exists():
        try:
            _lstm_model = _torch.load(str(lstm_path), map_location="cpu")
            _lstm_model.eval()
            logger.info(f"LSTM model loaded from {lstm_path}")
        except Exception as e:
            logger.error(f"Failed to load LSTM: {e}")
    else:
        logger.warning(f"LSTM weights not found at {lstm_path}. Sensor classification disabled.")


# ─── YOLOv8 Visual Detection ─────────────────────────────────────────────────

class YOLOResult:
    def __init__(self, detected: bool, confidence: float, severity: str,
                 water_filled: bool, bbox: Optional[list] = None):
        self.detected = detected
        self.confidence = confidence
        self.severity = severity
        self.water_filled = water_filled
        self.bbox = bbox


async def run_yolo_inference(image_bytes: bytes) -> YOLOResult:
    """Run YOLOv8 on image bytes. Runs in threadpool to avoid blocking event loop."""
    if _yolo_model is None:
        logger.warning("YOLOv8 not loaded — returning fallback result")
        return YOLOResult(detected=False, confidence=0.0, severity="S1", water_filled=False)

    from app.config import get_settings
    settings = get_settings()

    def _infer():
        from PIL import Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = _yolo_model(image, verbose=False)

        best_conf = 0.0
        best_bbox = None
        water_detected = False

        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                cls_name = _yolo_model.names.get(cls_id, "pothole").lower()

                if conf > best_conf:
                    best_conf = conf
                    best_bbox = box.xyxyn[0].tolist()

                if "water" in cls_name or "filled" in cls_name:
                    water_detected = True

        if best_conf < settings.YOLO_CONFIDENCE_THRESHOLD:
            return YOLOResult(detected=False, confidence=best_conf,
                              severity="S1", water_filled=False)

        severity = "S3" if best_conf >= 0.85 else "S2" if best_conf >= 0.65 else "S1"

        return YOLOResult(
            detected=True,
            confidence=best_conf,
            severity=severity,
            water_filled=water_detected,
            bbox=best_bbox,
        )

    return await asyncio.get_event_loop().run_in_executor(None, _infer)


# ─── LSTM Accelerometer Classification ───────────────────────────────────────

class LSTMResult:
    def __init__(self, detected: bool, severity: str, confidence: float):
        self.detected = detected
        self.severity = severity
        self.confidence = confidence


async def run_lstm_inference(accel_window: list[dict]) -> LSTMResult:
    """
    Classify accelerometer window as pothole event.
    Expected input: list of {x, y, z} readings at ~50Hz over 1-2 seconds.
    """
    if _lstm_model is None:
        return _threshold_classify(accel_window)

    def _infer():
        data = np.array([[r["x"], r["y"], r["z"]] for r in accel_window], dtype=np.float32)
        data = (data - data.mean(axis=0)) / (data.std(axis=0) + 1e-6)
        tensor = _torch.tensor(data).unsqueeze(0)

        with _torch.no_grad():
            logits = _lstm_model(tensor)
            probs = _torch.softmax(logits, dim=-1).squeeze().tolist()

        cls = int(np.argmax(probs))
        conf = float(max(probs))

        if cls == 0 or conf < 0.5:
            return LSTMResult(detected=False, severity="S1", confidence=conf)

        severity_map = {1: "S1", 2: "S2", 3: "S3"}
        return LSTMResult(detected=True, severity=severity_map.get(cls, "S1"), confidence=conf)

    return await asyncio.get_event_loop().run_in_executor(None, _infer)


def _threshold_classify(accel_window: list[dict]) -> LSTMResult:
    """Simple threshold fallback when LSTM model is unavailable."""
    if not accel_window:
        return LSTMResult(detected=False, severity="S1", confidence=0.0)

    z_values = [abs(r.get("z", 0)) for r in accel_window]
    peak_z = max(z_values)

    if peak_z < 12.0:
        return LSTMResult(detected=False, severity="S1", confidence=0.3)
    elif peak_z < 18.0:
        return LSTMResult(detected=True, severity="S1", confidence=0.6)
    elif peak_z < 25.0:
        return LSTMResult(detected=True, severity="S2", confidence=0.75)
    else:
        return LSTMResult(detected=True, severity="S3", confidence=0.85)