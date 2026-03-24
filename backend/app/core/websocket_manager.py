import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, rider_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active[rider_id] = websocket
        logger.info(f"Rider {rider_id} connected. Total: {len(self.active)}")

    def disconnect(self, rider_id: str):
        self.active.pop(rider_id, None)
        logger.info(f"Rider {rider_id} disconnected. Total: {len(self.active)}")

    async def send_alert(self, rider_id: str, message: dict):
        ws = self.active.get(rider_id)
        if not ws:
            return
        try:
            await ws.send_text(json.dumps(message))
        except Exception as e:
            logger.warning(f"Failed to send to {rider_id}: {e}")
            self.disconnect(rider_id)

    async def broadcast_all(self, message: dict):
        disconnected: Set[str] = set()
        for rider_id, ws in list(self.active.items()):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                disconnected.add(rider_id)
        for rid in disconnected:
            self.disconnect(rid)

    async def broadcast_to_riders(self, rider_ids: list, message: dict):
        for rid in rider_ids:
            await self.send_alert(rid, message)

    def active_count(self) -> int:
        return len(self.active)

    def is_connected(self, rider_id: str) -> bool:
        return rider_id in self.active


manager = ConnectionManager()