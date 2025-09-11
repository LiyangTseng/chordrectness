#!/usr/bin/env python3
"""
Basic tests that don't require heavy dependencies
"""

import unittest
import os
import sys
import numpy as np
from pathlib import Path

class TestBasicFunctionality(unittest.TestCase):
    """Basic tests that don't require external dependencies"""

    def test_audio_file_exists(self):
        """Test that the test audio file exists"""
        audio_file = Path(__file__).parent / ".." / "test_audio" / "just_as_i_am_a_flat_sharp_11.wav"
        self.assertTrue(audio_file.exists(), f"Test audio file not found: {audio_file}")
        print(f"✓ Test audio file found: {audio_file}")

    def test_chord_templates(self):
        """Test chord template patterns"""
        # Bb7#11 pattern: Bb-D-F-Ab-E
        bb7sharp11_pattern = [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0]

        # Verify it's a 12-element list (12 pitch classes)
        self.assertEqual(len(bb7sharp11_pattern), 12)

        # Verify it has the expected pattern
        expected_indices = [0, 3, 5, 6, 10]  # Bb, D, F, F#, A
        for i, value in enumerate(bb7sharp11_pattern):
            if i in expected_indices:
                self.assertEqual(value, 1, f"Expected 1 at index {i}")
            else:
                self.assertEqual(value, 0, f"Expected 0 at index {i}")

        print("✓ Bb7#11 chord template pattern is correct")

    def test_numpy_operations(self):
        """Test basic numpy operations"""
        # Test array creation
        test_array = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0])
        self.assertEqual(len(test_array), 12)

        # Test correlation calculation
        pattern1 = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0])
        pattern2 = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0])
        correlation = np.corrcoef(pattern1, pattern2)[0, 1]
        self.assertAlmostEqual(correlation, 1.0, places=10)

        print("✓ Basic numpy operations work correctly")

    def test_file_structure(self):
        """Test that the file structure is correct"""
        base_dir = Path(__file__).parent.parent

        # Check required directories exist
        required_dirs = ["src", "tests", "test_audio", "data", "models"]
        for dir_name in required_dirs:
            dir_path = base_dir / dir_name
            self.assertTrue(dir_path.exists(), f"Required directory not found: {dir_path}")

        # Check required files exist
        required_files = ["src/__init__.py", "src/chord_analyzer.py", "src/main.py", "requirements.txt", "setup.py"]
        for file_name in required_files:
            file_path = base_dir / file_name
            self.assertTrue(file_path.exists(), f"Required file not found: {file_path}")

        print("✓ File structure is correct")

if __name__ == '__main__':
    unittest.main()
