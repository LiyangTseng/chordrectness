"""
Models package for Chord Analyzer Service
"""

from .base_chord_model import BaseChordModel
from .chroma_chord_model import ChromaChordModel
from .deep_learning_chord_model import DeepLearningChordModel
from .model_factory import ModelFactory

# For backward compatibility
from .chroma_chord_model import ChromaChordModel as ChordRecognitionModel

__all__ = [
    "BaseChordModel",
    "ChromaChordModel", 
    "DeepLearningChordModel",
    "ModelFactory",
    "ChordRecognitionModel"  # Backward compatibility
]
