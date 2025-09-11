"""
Abstract base class for chord recognition models
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import numpy as np
from models.audio.templates import ChordTemplates
from models.audio.processing import AudioUtils

class BaseChordModel(ABC):
    """
    Abstract base class for chord recognition models.
    Defines the interface that all chord recognition models must implement.
    """

    def __init__(self, sample_rate: int = 22050, hop_length: int = 512, n_fft: int = 2048):
        """
        Initialize the base chord model.

        Args:
            sample_rate: Audio sample rate
            hop_length: Hop length for feature extraction
            n_fft: FFT window size
        """
        self.sample_rate = sample_rate
        self.hop_length = hop_length
        self.n_fft = n_fft
        self.chord_templates = ChordTemplates()

    def predict_chord(self, audio_path: str) -> Dict[str, Any]:
        """
        Predict a single chord from audio file.

        Args:
            audio_path: Path to audio file

        Returns:
            Dictionary with chord information: {chord, confidence}
        """
        # Load and process audio
        audio_data, _ = AudioUtils.load_audio(audio_path, self.sample_rate)

        # Extract features using the model's specific method
        features = self.extract_features(audio_data, self.sample_rate)

        # Analyze features to get chord
        return self.analyze_features(features)

    def predict_chord_from_features(self, features: np.ndarray) -> Dict[str, Any]:
        """
        Predict a single chord from pre-extracted features.
        This allows for more flexible usage patterns.

        Args:
            features: Pre-extracted feature matrix

        Returns:
            Dictionary with chord information: {chord, confidence}
        """
        return self.analyze_features(features)

    @abstractmethod
    def extract_features(self, audio_data: np.ndarray, sample_rate: int) -> np.ndarray:
        """
        Extract features from audio data.

        Args:
            audio_data: Audio time series
            sample_rate: Sample rate

        Returns:
            Feature matrix
        """
        pass

    @abstractmethod
    def analyze_features(self, features: np.ndarray) -> Dict[str, Any]:
        """
        Analyze extracted features to detect a single chord.

        Args:
            features: Extracted feature matrix

        Returns:
            Dictionary with chord information: {chord, confidence}
        """
        pass

