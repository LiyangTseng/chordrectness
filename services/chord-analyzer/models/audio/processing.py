"""
Audio processing utilities
"""

import librosa
import numpy as np
from typing import Optional, Tuple


class AudioUtils:
    """
    Utility class for common audio processing operations.
    """

    @staticmethod
    def segment_audio_by_time(
        audio_data: np.ndarray,
        start_time: float,
        end_time: Optional[float] = None,
        sample_rate: int = 22050
    ) -> np.ndarray:
        """
        Extract a time segment from audio data.

        Args:
            audio_data: Audio time series
            start_time: Start time in seconds
            end_time: End time in seconds (optional)
            sample_rate: Sample rate

        Returns:
            Audio segment

        Raises:
            ValueError: If requested time range is outside audio duration
        """
        audio_duration = len(audio_data) / sample_rate

        # Check if start_time is beyond audio duration
        if start_time >= audio_duration:
            raise ValueError(f"Start time {start_time:.2f}s is beyond audio duration {audio_duration:.2f}s")

        # Calculate sample indices
        start_sample = int(start_time * sample_rate)
        end_sample = int(end_time * sample_rate) if end_time else len(audio_data)

        # Ensure end_sample doesn't exceed audio length
        end_sample = min(end_sample, len(audio_data))

        # Check if we have a valid segment
        if start_sample >= end_sample:
            raise ValueError(f"Invalid time range: start_time {start_time:.2f}s >= end_time {end_time:.2f}s")

        return audio_data[start_sample:end_sample]

    @staticmethod
    def normalize_audio(audio_data: np.ndarray) -> np.ndarray:
        """
        Normalize audio data to [-1, 1] range.

        Args:
            audio_data: Audio time series

        Returns:
            Normalized audio data
        """
        max_val = np.max(np.abs(audio_data))
        if max_val > 0:
            return audio_data / max_val
        return audio_data

    @staticmethod
    def normalize_vector(vector: np.ndarray, epsilon: float = 1e-8) -> np.ndarray:
        """
        Normalize a vector to have maximum value of 1.

        Args:
            vector: Input vector
            epsilon: Small value to avoid division by zero

        Returns:
            Normalized vector
        """
        max_val = np.max(vector)
        if max_val > epsilon:
            return vector / (max_val + epsilon)
        return vector

    @staticmethod
    def extract_harmonic_component(audio_data: np.ndarray) -> np.ndarray:
        """
        Extract harmonic component from audio using HPSS.

        Args:
            audio_data: Audio time series

        Returns:
            Harmonic component
        """
        try:
            # Try HPSS with different parameters for better harmonic extraction
            y_harmonic, _ = librosa.effects.hpss(audio_data, margin=(1, 1))
            return y_harmonic
        except Exception:
            # Fallback: return original audio if HPSS fails
            return audio_data

    @staticmethod
    def load_audio(audio_path: str, sample_rate: int = 22050) -> Tuple[np.ndarray, int]:
        """
        Load audio file.

        Args:
            audio_path: Path to audio file
            sample_rate: Target sample rate

        Returns:
            Tuple of (audio_data, sample_rate)

        Raises:
            FileNotFoundError: If audio file doesn't exist
            RuntimeError: If audio loading fails
        """
        try:
            y, sr = librosa.load(audio_path, sr=sample_rate, mono=True)
            return y, sr
        except FileNotFoundError:
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        except Exception as e:
            raise RuntimeError(f"Failed to load audio: {e}")

    @staticmethod
    def extract_chroma_features(audio_data: np.ndarray, sample_rate: int, hop_length: int = 512, n_fft: int = 2048) -> np.ndarray:
        """
        Extract chroma features from audio data.

        Args:
            audio_data: Audio time series
            sample_rate: Sample rate
            hop_length: Hop length for feature extraction
            n_fft: FFT window size

        Returns:
            Chroma feature matrix (12 x frames)

        Raises:
            RuntimeError: If feature extraction fails
        """
        try:
            # Extract harmonic and percussive components
            y_harmonic = AudioUtils.extract_harmonic_component(audio_data)

            # Get chroma for harmonic component (better for chord analysis)
            chroma = librosa.feature.chroma_stft(
                y=y_harmonic,
                sr=sample_rate,
                hop_length=hop_length,
                n_fft=n_fft,
                tuning=0.0,  # Assume standard tuning
                norm=2       # L2 normalization for better chord detection
            )

            return chroma

        except Exception as e:
            raise RuntimeError(f"Failed to extract chroma features: {e}")

    @staticmethod
    def process_audio_file(audio_path: str, start_time: float = 0, end_time: Optional[float] = None,
                          sample_rate: int = 22050, hop_length: int = 512, n_fft: int = 2048) -> np.ndarray:
        """
        Complete audio processing pipeline: load, segment, extract features.

        Args:
            audio_path: Path to audio file
            start_time: Start time in seconds
            end_time: End time in seconds (optional)
            sample_rate: Audio sample rate
            hop_length: Hop length for feature extraction
            n_fft: FFT window size

        Returns:
            Chroma feature matrix
        """
        # Load audio
        audio_data, _ = AudioUtils.load_audio(audio_path, sample_rate)

        # Segment if needed
        if start_time > 0 or end_time:
            audio_data = AudioUtils.segment_audio_by_time(audio_data, start_time, end_time, sample_rate)

        # Extract features
        return AudioUtils.extract_chroma_features(audio_data, sample_rate, hop_length, n_fft)
