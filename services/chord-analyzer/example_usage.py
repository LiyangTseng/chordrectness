#!/usr/bin/env python3
"""
Example usage of ChromaChordModel
Demonstrates how to use the chord recognition system
"""

import os
import sys
import librosa

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models.chroma_chord_model import ChromaChordModel
from models.model_factory import ModelFactory

def main():
    """Main example function"""

    # Method 1: Using factory pattern
    print("\n1. Factory Pattern:")
    print("-" * 30)
    model = ModelFactory.create_model("chroma")
    print(f"Factory model: {type(model).__name__}")

    # Test with audio file
    audio_file = "data/test_audio/just_as_i_am_a_flat_sharp_11.wav"

    assert os.path.exists(audio_file), f"Audio file not found: {audio_file}"
    print(f"\n2. Audio Analysis:")
    print("-" * 30)
    print(f"Audio file: {audio_file}")

    try:
        # First, let's check the audio duration
        y, sr = librosa.load(audio_file, sr=22050, mono=True)
        duration = len(y) / sr
        print(f"  Audio duration: {duration:.2f} seconds")

        # Method 1: Direct prediction (high-level interface)
        print(f"\n  Method 1 - Direct prediction:")
        result = model.predict_chord(audio_file)
        print(f"    Chord: {result['chord']}")
        print(f"    Confidence: {result['confidence']:.2f}")

        # Method 2: Step-by-step (flexible interface)
        print(f"\n  Method 2 - Step-by-step:")
        features = model.extract_features(y, sr)
        result2 = model.predict_chord_from_features(features)
        print(f"    Chord: {result2['chord']}")
        print(f"    Confidence: {result2['confidence']:.2f}")

        # Debug: Let's see what the chroma vector looks like
        print(f"\n  Debug - Chroma vector (first 6 values): {features[:, 0][:6]}")
        print(f"  Debug - Bb7#11 template: {model.chord_templates.get_template('Bb7#11')[:6]}")

    except Exception as e:
        print(f"Error during analysis: {e}")
        print("Make sure librosa is installed: pip install librosa")

    print("\n" + "=" * 50)
    print("Example completed!")

if __name__ == "__main__":
    main()
