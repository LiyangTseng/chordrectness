"""
Chord Analysis Service
Orchestrates chord detection using the model and audio processor
"""

import numpy as np
from typing import List, Optional, Dict, Any
from loguru import logger

from models.model_factory import ModelFactory

class ChordAnalysisService:
    """
    Service that orchestrates chord analysis by combining the model and audio processor.
    This is the main business logic layer.
    """

    def __init__(self, model_type: str = "chroma", model_path: Optional[str] = None):
        """
        Initialize the chord analysis service.

        Args:
            model_type: Type of model to use ("chroma", "deep_learning")
            model_path: Path to trained model file (for deep learning models)
        """
        self.model = ModelFactory.create_model(
            model_type=model_type,
            model_path=model_path
        )

    def analyze_audio_file(self, file_path: str, start_time: float = 0, end_time: Optional[float] = None) -> dict:
        """
        Analyze a single chord in an audio file.

        Args:
            file_path: Path to audio file
            start_time: Start time in seconds (for segmentation)
            end_time: End time in seconds (for segmentation)

        Returns:
            Dictionary with chord analysis result including chroma vector
        """
        try:
            import time
            start_analysis = time.time()

            # If we need to segment the audio, do it here in the service layer
            if start_time > 0 or end_time:
                from models.audio.processing import AudioUtils
                import librosa

                # Load the full audio
                audio_data, sr = AudioUtils.load_audio(file_path, self.model.sample_rate)

                # Segment the audio
                if end_time:
                    segmented_audio = AudioUtils.segment_audio_by_time(
                        audio_data, start_time, end_time, sr
                    )
                else:
                    segmented_audio = AudioUtils.segment_audio_by_time(
                        audio_data, start_time, None, sr
                    )

                # Save segmented audio to temporary file
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                    import soundfile as sf
                    sf.write(temp_file.name, segmented_audio, sr)
                    temp_path = temp_file.name

                try:
                    # Analyze the segmented audio
                    chord_result = self.model.predict_chord(temp_path)
                finally:
                    import os
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
            else:
                # Analyze the full audio file
                chord_result = self.model.predict_chord(file_path)

            # Get chroma vector for visualization
            from models.audio.processing import AudioUtils
            audio_data, sr = AudioUtils.load_audio(file_path, self.model.sample_rate)
            features = self.model.extract_features(audio_data, sr)
            chroma_avg = np.mean(features, axis=1)
            chroma_avg = AudioUtils.normalize_vector(chroma_avg)

            # Add additional information
            chord_result['chroma_vector'] = chroma_avg.tolist()
            chord_result['analysis_time'] = time.time() - start_analysis

            return chord_result

        except Exception as e:
            logger.error(f"Error in chord analysis: {e}")
            raise

    def detect_key(self, chords_data: List[Dict[str, Any]]) -> str:
        """
        Detect the key signature from chord analysis results.

        Args:
            chords_data: List of chord analysis results

        Returns:
            Detected key signature
        """
        try:
            # Simple key detection based on most common chord
            if not chords_data:
                return "Unknown"
            
            # Count chord occurrences
            chord_counts = {}
            for chord_data in chords_data:
                chord = chord_data.get('chord', '')
                if chord:
                    chord_counts[chord] = chord_counts.get(chord, 0) + 1
            
            if not chord_counts:
                return "Unknown"
            
            # Get the most common chord
            most_common_chord = max(chord_counts, key=chord_counts.get)
            
            # Simple key detection logic (this could be enhanced)
            if 'maj' in most_common_chord or '7' in most_common_chord:
                # Extract root note
                root = most_common_chord.split('maj')[0].split('7')[0].split('m')[0]
                return f"{root} Major"
            elif 'm' in most_common_chord and 'maj' not in most_common_chord:
                root = most_common_chord.split('m')[0]
                return f"{root} Minor"
            else:
                return f"{most_common_chord} (Unknown)"
                
        except Exception as e:
            logger.error(f"Error detecting key: {e}")
            return "Unknown"

