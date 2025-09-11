"""
Confidence calculation utilities
"""

import numpy as np
from typing import List

class ConfidenceUtils:
    """
    Utility class for confidence score calculations.
    """

    @staticmethod
    def calculate_chord_confidence(features: np.ndarray, top_values: np.ndarray) -> float:
        """
        Calculate confidence score for chord detection.

        Args:
            features: Feature vector
            top_values: Top feature values

        Returns:
            Confidence score between 0 and 1
        """
        # Higher confidence for clearer patterns
        clarity = np.max(top_values) / (np.sum(top_values) + 1e-6)

        # Higher confidence for more distinct peaks
        distinctness = (np.max(top_values) - np.mean(top_values)) / (np.std(top_values) + 1e-6)

        # Combine metrics
        confidence = min(1.0, (clarity + distinctness) / 2)

        return float(confidence)

    @staticmethod
    def calculate_correlation_confidence(correlation: float) -> float:
        """
        Convert correlation coefficient to confidence score.

        Args:
            correlation: Correlation coefficient (-1 to 1)

        Returns:
            Confidence score (0 to 1)
        """
        # Convert correlation to confidence (0 to 1)
        if np.isnan(correlation):
            return 0.0

        # Map [-1, 1] to [0, 1]
        confidence = (correlation + 1) / 2
        return max(0.0, min(1.0, confidence))

    @staticmethod
    def calculate_template_match_confidence(
        chroma_vector: np.ndarray,
        template: List[float],
        threshold: float = 0.3
    ) -> float:
        """
        Calculate confidence for template matching.

        Args:
            chroma_vector: Chroma feature vector
            template: Chord template
            threshold: Minimum threshold for valid match

        Returns:
            Confidence score
        """
        try:
            correlation = np.corrcoef(chroma_vector, template)[0, 1]

            if np.isnan(correlation):
                return 0.0

            # Only return confidence if above threshold
            if correlation >= threshold:
                return ConfidenceUtils.calculate_correlation_confidence(correlation)
            else:
                return 0.0

        except Exception:
            return 0.0
