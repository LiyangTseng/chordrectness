"""
Chord Analyzer Service
A Python service for chord recognition using chromagram analysis
"""

from .chord_analyzer import ChordRecognitionModel
from .main import ChordAnalyzer, app

__version__ = "1.0.0"
__all__ = ["ChordRecognitionModel", "ChordAnalyzer", "app"]
