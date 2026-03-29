"""
Priority Scoring Service for Potholes

Calculates priority scores based on:
- confirmation_count: Number of times a pothole has been confirmed (reported by multiple riders)
- days_unresolved: Days since the pothole was created (or until it was repaired)

Recurrence: If same GPS coordinate confirmed more than twice, marked as recurring.

Higher scores indicate higher priority for repair.
"""

from typing import List, Tuple, Optional
from datetime import datetime

from app.models.pothole import Pothole


class PriorityConfig:
    """Configuration for priority scoring weights"""
    
    def __init__(self):
        self._settings = None
    
    @property
    def settings(self):
        """Lazy load settings to avoid import issues"""
        if self._settings is None:
            try:
                from app.config import get_settings
                self._settings = get_settings()
            except Exception:
                self._settings = None
        return self._settings
    
    @property
    def CONFIRMATION_WEIGHT(self) -> float:
        """Weight for confirmation count (how many times reported)"""
        settings = self.settings
        if settings:
            return settings.PRIORITY_CONFIRMATION_WEIGHT
        return 5.0  # Default
    
    @property
    def DAYS_WEIGHT(self) -> float:
        """Weight for days unresolved (how long it's been unrepaired)"""
        settings = self.settings
        if settings:
            return settings.PRIORITY_DAYS_WEIGHT
        return 1.0  # Default
    
    @property
    def RECURRING_THRESHOLD(self) -> int:
        """Threshold for marking a pothole as recurring"""
        settings = self.settings
        if settings:
            return settings.RECURRING_THRESHOLD
        return 2  # Default
    
    # Backward compatibility aliases
    RECURRENCE_WEIGHT = CONFIRMATION_WEIGHT
    RECURRENCE_THRESHOLD = RECURRING_THRESHOLD


class PriorityScorer:
    """Service for calculating and ranking pothole priorities"""
    
    def __init__(self, config: Optional[PriorityConfig] = None):
        """
        Initialize priority scorer with optional custom configuration
        
        Args:
            config: Custom PriorityConfig. If None, uses default values.
        """
        self.config = config or PriorityConfig()
    
    def calculate_score(self, confirmation_count: int, days_unresolved: int) -> float:
        """
        Calculate priority score for a pothole
        
        Formula: (confirmation_count × RECURRENCE_WEIGHT) + (days_unresolved × DAYS_WEIGHT)
        
        Args:
            confirmation_count: Number of times the pothole has been confirmed (reported)
            days_unresolved: Days since creation (or until repair)
        
        Returns:
            Priority score (higher = more urgent)
        
        Examples:
            >>> scorer = PriorityScorer()
            >>> scorer.calculate_score(10, 30)  # 10 confirmations, 30 days
            80.0
            >>> scorer.calculate_score(3, 5)    # 3 confirmations, 5 days
            20.0
        """
        return (confirmation_count * self.config.RECURRENCE_WEIGHT) + \
               (days_unresolved * self.config.DAYS_WEIGHT)
    
    def calculate_score_for_pothole(self, pothole: Pothole) -> float:
        """
        Calculate priority score for a Pothole model instance
        
        Args:
            pothole: Pothole model instance
        
        Returns:
            Priority score
        """
        return self.calculate_score(
            confirmation_count=pothole.confirmation_count,
            days_unresolved=pothole.days_unresolved
        )
    
    def rank_potholes(
        self, 
        potholes: List[Pothole]
    ) -> List[Tuple[Pothole, int, float]]:
        """
        Rank a list of potholes by priority score
        
        Args:
            potholes: List of Pothole model instances
        
        Returns:
            List of tuples: (pothole, rank, score)
            Sorted by rank (1 = highest priority)
            
        Examples:
            >>> potholes = [pothole_a, pothole_b, pothole_c]
            >>> ranked = scorer.rank_potholes(potholes)
            >>> for pothole, rank, score in ranked:
            ...     print(f"Rank {rank}: Score {score}")
        """
        if not potholes:
            return []
        
        # Calculate scores for all potholes
        scored_potholes = [
            (pothole, self.calculate_score_for_pothole(pothole))
            for pothole in potholes
        ]
        
        # Sort by score (descending), then by created_at (ascending) for tie-breaking
        scored_potholes.sort(
            key=lambda x: (-x[1], x[0].created_at)
        )
        
        # Assign ranks (1-indexed)
        ranked_potholes = [
            (pothole, rank + 1, score)
            for rank, (pothole, score) in enumerate(scored_potholes)
        ]
        
        return ranked_potholes
    
    def rank_potholes_dict(
        self, 
        potholes: List[Pothole]
    ) -> List[dict]:
        """
        Rank potholes and return as list of dictionaries
        
        Convenient for API responses where you want to add
        priority data to existing pothole data.
        
        Args:
            potholes: List of Pothole model instances
        
        Returns:
            List of dicts with keys: pothole_id, rank, score
        """
        ranked = self.rank_potholes(potholes)
        return [
            {
                "pothole_id": pothole.id,
                "rank": rank,
                "score": score,
                "confirmation_count": pothole.confirmation_count,
                "days_unresolved": pothole.days_unresolved,
                "is_recurring": pothole.is_recurring
            }
            for pothole, rank, score in ranked
        ]
    
    def is_recurring(self, report_count: int) -> bool:
        """
        Determine if a pothole should be marked as recurring
        
        Args:
            report_count: Number of reports for this pothole
        
        Returns:
            True if report_count exceeds threshold
        """
        return report_count > self.config.RECURRENCE_THRESHOLD


# Global instance for easy import
default_scorer = PriorityScorer()


# Convenience functions using the default scorer
def calculate_priority_score(confirmation_count: int, days_unresolved: int) -> float:
    """Calculate priority score using default configuration"""
    return default_scorer.calculate_score(confirmation_count, days_unresolved)


def rank_potholes(potholes: List[Pothole]) -> List[Tuple[Pothole, int, float]]:
    """Rank potholes using default configuration"""
    return default_scorer.rank_potholes(potholes)


def rank_potholes_dict(potholes: List[Pothole]) -> List[dict]:
    """Rank potholes and return as dictionaries using default configuration"""
    return default_scorer.rank_potholes_dict(potholes)
