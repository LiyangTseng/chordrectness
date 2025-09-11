#!/usr/bin/env python3
"""
Unit tests for utilities
"""

import unittest
import os
import sys
import numpy as np
from pathlib import Path

# Add project root to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from models.audio.templates import ChordTemplates
from models.audio.processing import AudioUtils
from models.audio.confidence import ConfidenceUtils

class TestChordTemplates(unittest.TestCase):
    """Test cases for ChordTemplates utility"""

    def test_get_template(self):
        """Test getting chord template by name"""
        template = ChordTemplates.get_template('C')
        self.assertEqual(len(template), 12)
        self.assertEqual(template[0], 1)  # C
        self.assertEqual(template[4], 1)  # E
        self.assertEqual(template[7], 1)  # G

    def test_get_template_bb7sharp11(self):
        """Test getting Bb7#11 template"""
        template = ChordTemplates.get_template('Bb7#11')
        self.assertEqual(len(template), 12)
        # Bb-D-F-Ab-E pattern: [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0]
        expected = [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0]
        self.assertEqual(template, expected)

    def test_get_all_chord_names(self):
        """Test getting all chord names"""
        names = ChordTemplates.get_all_chord_names()
        self.assertIn('C', names)
        self.assertIn('Bb7#11', names)
        self.assertIn('Cmaj7', names)
        self.assertGreater(len(names), 50)  # Should have many chords

    def test_match_chord(self):
        """Test chord matching"""
        # Test with Bb7#11 pattern
        bb7sharp11_pattern = [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0]
        chord, score = ChordTemplates.match_chord(bb7sharp11_pattern)

        self.assertIsInstance(chord, str)
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)

        # Should match Bb7#11
        self.assertEqual(chord, 'Bb7#11')
        self.assertAlmostEqual(score, 1.0, places=10)

class TestAudioUtils(unittest.TestCase):
    """Test cases for AudioUtils utility"""

    def test_segment_audio_by_time(self):
        """Test audio segmentation by time"""
        # Create mock audio data
        y = np.random.randn(22050)  # 1 second at 22050 Hz

        # Test segmentation
        segment = AudioUtils.segment_audio_by_time(y, 0.5, 0.8, 22050)

        expected_length = int(0.3 * 22050)  # 0.3 seconds
        self.assertEqual(len(segment), expected_length)

    def test_normalize_audio(self):
        """Test audio normalization"""
        # Test with normal audio
        audio = np.array([0.5, -0.3, 0.8, -0.9])
        normalized = AudioUtils.normalize_audio(audio)

        self.assertTrue(np.allclose(np.max(np.abs(normalized)), 1.0))

        # Test with zero audio
        zero_audio = np.zeros(10)
        normalized_zero = AudioUtils.normalize_audio(zero_audio)
        self.assertTrue(np.array_equal(normalized_zero, zero_audio))

class TestConfidenceUtils(unittest.TestCase):
    """Test cases for ConfidenceUtils utility"""

    def test_calculate_chord_confidence(self):
        """Test chord confidence calculation"""
        # Test with clear pattern
        features = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0])
        top_values = np.array([1, 1, 1, 1, 1])

        confidence = ConfidenceUtils.calculate_chord_confidence(features, top_values)

        self.assertIsInstance(confidence, float)
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)

    def test_calculate_correlation_confidence(self):
        """Test correlation confidence calculation"""
        # Test perfect correlation
        confidence = ConfidenceUtils.calculate_correlation_confidence(1.0)
        self.assertEqual(confidence, 1.0)

        # Test no correlation
        confidence = ConfidenceUtils.calculate_correlation_confidence(0.0)
        self.assertEqual(confidence, 0.5)

        # Test negative correlation
        confidence = ConfidenceUtils.calculate_correlation_confidence(-1.0)
        self.assertEqual(confidence, 0.0)

        # Test NaN
        confidence = ConfidenceUtils.calculate_correlation_confidence(float('nan'))
        self.assertEqual(confidence, 0.0)

class TestFileStructure(unittest.TestCase):
    """Test cases for file structure"""

    def test_audio_file_exists(self):
        """Test that the test audio file exists"""
        audio_file = Path(__file__).parent / ".." / ".." / "data" / "test_audio" / "just_as_i_am_a_flat_sharp_11.wav"
        self.assertTrue(audio_file.exists(), f"Test audio file not found: {audio_file}")
        print(f"✓ Test audio file found: {audio_file}")

    def test_file_structure(self):
        """Test that the file structure is correct"""
        base_dir = Path(__file__).parent.parent.parent

        # Check required directories exist
        required_dirs = ["models", "services", "api", "utils", "tests", "data"]
        for dir_name in required_dirs:
            dir_path = base_dir / dir_name
            self.assertTrue(dir_path.exists(), f"Required directory not found: {dir_path}")

        # Check required files exist
        required_files = [
            "models/base_chord_model.py",
            "models/chroma_chord_model.py",
            "models/deep_learning_chord_model.py",
            "models/model_factory.py",
            "utils/chord_templates.py",
            "utils/audio_utils.py",
            "utils/confidence_utils.py",
            "services/audio_processor.py",
            "services/chord_analysis_service.py",
            "api/app.py",
            "requirements.txt",
            "setup.py"
        ]
        for file_name in required_files:
            file_path = base_dir / file_name
            self.assertTrue(file_path.exists(), f"Required file not found: {file_path}")

        print("✓ File structure is correct")

if __name__ == '__main__':
    unittest.main()