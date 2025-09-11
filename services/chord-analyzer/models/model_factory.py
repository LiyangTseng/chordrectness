"""
Model factory for creating chord recognition models
"""

from typing import Union, Optional
from .base_chord_model import BaseChordModel
from .chroma_chord_model import ChromaChordModel
from .deep_learning_chord_model import DeepLearningChordModel

class ModelFactory:
    """
    Factory class for creating chord recognition models.
    Provides a unified interface for creating different types of models.
    """

    @staticmethod
    def create_model(
        model_type: str = "chroma",
        sample_rate: int = 22050,
        hop_length: int = 512,
        n_fft: int = 2048,
        model_path: Optional[str] = None,
        **kwargs
    ) -> BaseChordModel:
        """
        Create a chord recognition model.

        Args:
            model_type: Type of model to create ("chroma", "deep_learning")
            sample_rate: Audio sample rate
            hop_length: Hop length for feature extraction
            n_fft: FFT window size
            model_path: Path to trained model file (for deep learning models)
            **kwargs: Additional model-specific parameters

        Returns:
            Initialized chord recognition model

        Raises:
            ValueError: If model_type is not supported
        """
        if model_type.lower() == "chroma":
            return ChromaChordModel(
                sample_rate=sample_rate,
                hop_length=hop_length,
                n_fft=n_fft
            )
        elif model_type.lower() in ["deep_learning", "dl", "neural", "nn"]:
            return DeepLearningChordModel(
                sample_rate=sample_rate,
                hop_length=hop_length,
                n_fft=n_fft,
                model_path=model_path
            )
        else:
            raise ValueError(f"Unsupported model type: {model_type}. Supported types: 'chroma', 'deep_learning'")

    @staticmethod
    def get_available_models() -> list:
        """
        Get list of available model types.

        Returns:
            List of available model type names
        """
        return ["chroma", "deep_learning"]

    @staticmethod
    def get_model_info(model_type: str) -> dict:
        """
        Get information about a specific model type.

        Args:
            model_type: Type of model

        Returns:
            Dictionary with model information

        Raises:
            ValueError: If model_type is not supported
        """
        model_info = {
            "chroma": {
                "name": "Chroma Chord Model",
                "description": "Rule-based chord recognition using chromagram analysis",
                "features": ["Template matching", "Chroma features", "Harmonic analysis"],
                "dependencies": ["librosa", "numpy"],
                "training_required": False
            },
            "deep_learning": {
                "name": "Deep Learning Chord Model",
                "description": "Neural network-based chord recognition",
                "features": ["Multi-feature extraction", "Neural network inference", "High accuracy"],
                "dependencies": ["librosa", "numpy", "tensorflow/pytorch"],
                "training_required": True
            }
        }

        if model_type.lower() not in model_info:
            raise ValueError(f"Unknown model type: {model_type}")

        return model_info[model_type.lower()]
