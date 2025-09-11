"""
Chroma-based chord recognition model
Implements single chord detection using chromagram analysis
"""
import librosa
import numpy as np
from typing import Dict, Any, Optional

from .base_chord_model import BaseChordModel
from models.audio.confidence import ConfidenceUtils
from models.audio.processing import AudioUtils

class ChromaChordModel(BaseChordModel):
    """
    Chroma-based chord recognition model.
    Uses chromagram analysis to detect a single chord.
    """

    def __init__(self, sample_rate: int = 22050, hop_length: int = 512, n_fft: int = 2048):
        """
        Initialize the chroma chord model.

        Args:
            sample_rate: Audio sample rate
            hop_length: Hop length for feature extraction
            n_fft: FFT window size
        """
        super().__init__(sample_rate, hop_length, n_fft)

    def extract_features(self, audio_data: np.ndarray, sample_rate: int) -> np.ndarray:
        """
        Extract chroma features from audio data.

        Args:
            audio_data: Audio time series
            sample_rate: Sample rate

        Returns:
            Chroma feature matrix (12 x frames)
        """
        try:
            chroma = librosa.feature.chroma_cqt(
                y=audio_data,
                sr=sample_rate
            )

        except Exception as e:
            raise RuntimeError(f"Failed to extract chroma features: {e}")

        return chroma

    def analyze_features(self, features: np.ndarray) -> Dict[str, Any]:
        """
        Analyze chroma features to detect a single chord.

        Args:
            features: Chroma feature matrix (12 x frames)

        Returns:
            Dictionary with chord information
        """
        # Average chroma values over the entire segment
        chroma_avg = np.mean(features, axis=1)

        # Normalize using utility function
        chroma_avg = AudioUtils.normalize_vector(chroma_avg)

        # Match against chord templates
        best_chord, confidence = self.chord_templates.match_chord(chroma_avg.tolist())

        return {
            'chord': best_chord,
            'confidence': confidence
        }
