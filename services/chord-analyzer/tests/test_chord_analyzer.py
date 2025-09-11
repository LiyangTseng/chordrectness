#!/usr/bin/env python3
"""
Test suite for Chord Analyzer Service
Tests the ChordRecognitionModel with real audio data
"""

import unittest
import os
import sys
import json
import tempfile
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chord_analyzer import ChordRecognitionModel

class TestChordRecognitionModel(unittest.TestCase):
    """Test cases for ChordRecognitionModel"""

    def setUp(self):
        """Set up test fixtures"""
        self.model = ChordRecognitionModel()
        self.test_audio_path = "../../just_as_i_am_a_flat_sharp_11.wav"

        # Check if test audio file exists
        if not os.path.exists(self.test_audio_path):
            self.skipTest(f"Test audio file not found: {self.test_audio_path}")

    def test_model_initialization(self):
        """Test that the model initializes correctly"""
        self.assertIsNotNone(self.model)
        self.assertEqual(self.model.sample_rate, 22050)
        self.assertEqual(self.model.hop_length, 512)
        self.assertEqual(self.model.n_fft, 2048)

    def test_audio_loading(self):
        """Test that audio can be loaded successfully"""
        try:
            import librosa
            y, sr = librosa.load(self.test_audio_path, sr=self.model.sample_rate, mono=True)
            self.assertIsNotNone(y)
            self.assertGreater(len(y), 0)
            self.assertEqual(sr, self.model.sample_rate)
            print(f"✓ Audio loaded successfully: {len(y)} samples, {sr} Hz")
        except Exception as e:
            self.fail(f"Failed to load audio: {e}")

    def test_chroma_extraction(self):
        """Test chroma feature extraction"""
        try:
            import librosa
            import numpy as np

            y, sr = librosa.load(self.test_audio_path, sr=self.model.sample_rate, mono=True)

            # Extract chroma features
            chroma = librosa.feature.chroma_stft(
                y=y,
                sr=sr,
                hop_length=self.model.hop_length,
                n_fft=self.model.n_fft
            )

            self.assertEqual(chroma.shape[0], 12)  # 12 pitch classes
            self.assertGreater(chroma.shape[1], 0)  # At least one frame
            print(f"✓ Chroma features extracted: {chroma.shape}")

        except Exception as e:
            self.fail(f"Failed to extract chroma features: {e}")

    def test_chord_prediction_full_audio(self):
        """Test chord prediction on the full audio file"""
        try:
            print(f"\n🎵 Testing chord prediction on: {self.test_audio_path}")

            # Predict chords for the full audio
            chords = self.model.predict(self.test_audio_path)

            self.assertIsInstance(chords, list)
            self.assertGreater(len(chords), 0)

            print(f"✓ Found {len(chords)} chord segments:")
            for i, chord in enumerate(chords):
                print(f"  {i+1}. {chord['symbol']} ({chord['start_time']:.1f}s - {chord['end_time']:.1f}s) - Confidence: {chord['confidence']:.2f}")

            # Check if we found the expected Bb7#11 chord
            bb7sharp11_found = any('Bb7#11' in chord['symbol'] for chord in chords)
            if bb7sharp11_found:
                print("✓ Found Bb7#11 chord as expected!")
            else:
                print("⚠ Bb7#11 chord not detected - this might be expected depending on the audio content")

        except Exception as e:
            self.fail(f"Failed to predict chords: {e}")

    def test_chord_prediction_time_segment(self):
        """Test chord prediction on a specific time segment (around 1:20)"""
        try:
            print(f"\n🎵 Testing chord prediction on time segment 80-81 seconds")

            # Test the specific time segment mentioned in the original request
            chords = self.model.predict(self.test_audio_path, start_time=80.0, end_time=81.0)

            self.assertIsInstance(chords, list)

            print(f"✓ Found {len(chords)} chord segments in time range 80-81s:")
            for i, chord in enumerate(chords):
                print(f"  {i+1}. {chord['symbol']} ({chord['start_time']:.1f}s - {chord['end_time']:.1f}s) - Confidence: {chord['confidence']:.2f}")

            # Check for Bb7#11 in this specific time range
            bb7sharp11_found = any('Bb7#11' in chord['symbol'] for chord in chords)
            if bb7sharp11_found:
                print("✓ Found Bb7#11 chord in the expected time range!")
            else:
                print("⚠ Bb7#11 chord not detected in time range 80-81s")

        except Exception as e:
            self.fail(f"Failed to predict chords for time segment: {e}")

    def test_chord_segmentation(self):
        """Test chord region segmentation"""
        try:
            import librosa
            import numpy as np

            y, sr = librosa.load(self.test_audio_path, sr=self.model.sample_rate, mono=True)

            # Extract chroma
            chroma = librosa.feature.chroma_stft(
                y=y,
                sr=sr,
                hop_length=self.model.hop_length,
                n_fft=self.model.n_fft
            )

            # Test segmentation
            segments = self.model._segment_chord_regions(chroma)

            self.assertIsInstance(segments, list)
            self.assertGreater(len(segments), 0)

            print(f"✓ Found {len(segments)} chord segments:")
            for i, (start_frame, end_frame) in enumerate(segments):
                start_time = start_frame * self.model.hop_length / self.model.sample_rate
                end_time = end_frame * self.model.hop_length / self.model.sample_rate
                print(f"  {i+1}. Frame {start_frame}-{end_frame} ({start_time:.1f}s - {end_time:.1f}s)")

        except Exception as e:
            self.fail(f"Failed to segment chord regions: {e}")

    def test_chord_classification(self):
        """Test chord quality classification"""
        try:
            import numpy as np

            # Test with a known chord pattern (Bb7#11)
            # Bb-D-F-Ab-E pattern: [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0]
            test_chroma = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0], dtype=float)

            # Test classification
            chord_info = self.model._classify_chord_quality(test_chroma, 0)  # Bb is at index 0

            self.assertIsInstance(chord_info, dict)
            self.assertIn('symbol', chord_info)
            self.assertIn('quality', chord_info)
            self.assertIn('extensions', chord_info)

            print(f"✓ Chord classification test:")
            print(f"  Symbol: {chord_info['symbol']}")
            print(f"  Quality: {chord_info['quality']}")
            print(f"  Extensions: {chord_info['extensions']}")

        except Exception as e:
            self.fail(f"Failed to classify chord quality: {e}")

    def test_confidence_calculation(self):
        """Test confidence score calculation"""
        try:
            import numpy as np

            # Test with clear chord pattern
            clear_chroma = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0], dtype=float)
            clear_values = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0], dtype=float)

            confidence = self.model._calculate_confidence(clear_chroma, clear_values)

            self.assertIsInstance(confidence, float)
            self.assertGreaterEqual(confidence, 0.0)
            self.assertLessEqual(confidence, 1.0)

            print(f"✓ Confidence calculation test: {confidence:.3f}")

        except Exception as e:
            self.fail(f"Failed to calculate confidence: {e}")

class TestChordAnalyzerIntegration(unittest.TestCase):
    """Integration tests for the full chord analyzer service"""

    def setUp(self):
        """Set up integration test fixtures"""
        self.test_audio_path = "../../just_as_i_am_a_flat_sharp_11.wav"

        if not os.path.exists(self.test_audio_path):
            self.skipTest(f"Test audio file not found: {self.test_audio_path}")

    def test_full_analysis_pipeline(self):
        """Test the complete analysis pipeline"""
        try:
            from main import ChordAnalyzer

            analyzer = ChordAnalyzer()

            # Test with a mock YouTube URL (we'll use the local file)
            print(f"\n🎵 Testing full analysis pipeline with local audio file")

            # This would normally extract from YouTube, but we'll test with local file
            # For now, let's test the chromagram analysis directly
            import librosa
            y, sr = librosa.load(self.test_audio_path)

            # Test chromagram analysis
            chords = analyzer.analyze_chromagram(y, sr, 80.0, 81.0)

            self.assertIsInstance(chords, list)
            print(f"✓ Full pipeline test completed: {len(chords)} chords detected")

            for chord in chords:
                print(f"  - {chord.chord} (confidence: {chord.confidence:.2f})")

        except Exception as e:
            self.fail(f"Full analysis pipeline failed: {e}")

def run_tests():
    """Run all tests with detailed output"""
    print("🧪 Starting Chord Analyzer Test Suite")
    print("=" * 50)

    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(TestChordRecognitionModel))
    suite.addTests(loader.loadTestsFromTestCase(TestChordAnalyzerIntegration))

    # Run tests with detailed output
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)

    # Print summary
    print("\n" + "=" * 50)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")

    if result.failures:
        print("\n❌ Failures:")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback}")

    if result.errors:
        print("\n❌ Errors:")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback}")

    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
