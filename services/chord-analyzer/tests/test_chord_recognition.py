#!/usr/bin/env python3
"""
Unit tests for Chord Recognition Model
"""

import unittest
import os
import sys
import numpy as np
from pathlib import Path

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from chord_analyzer import ChordRecognitionModel

class TestChordRecognitionModel(unittest.TestCase):
    """Test cases for ChordRecognitionModel"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.model = ChordRecognitionModel()
        self.test_audio_path = os.path.join(os.path.dirname(__file__), '..', 'test_audio', 'just_as_i_am_a_flat_sharp_11.wav')
        
        # Check if test audio file exists
        if not os.path.exists(self.test_audio_path):
            self.skipTest(f"Test audio file not found: {self.test_audio_path}")
    
    def test_model_initialization(self):
        """Test that the model initializes correctly"""
        self.assertIsNotNone(self.model)
        self.assertEqual(self.model.sample_rate, 22050)
        self.assertEqual(self.model.hop_length, 512)
        self.assertEqual(self.model.n_fft, 2048)
    
    def test_chord_classification_bb7sharp11(self):
        """Test chord classification for Bb7#11 pattern"""
        # Bb7#11 pattern: Bb-D-F-Ab-E
        # Pitch classes: Bb(0), C(1), C#(2), D(3), D#(4), E(5), F(6), F#(7), G(8), G#(9), A(10), A#(11)
        # Bb7#11: [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0]
        test_chroma = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0], dtype=float)
        
        chord_info = self.model._classify_chord_quality(test_chroma, 0)  # Bb is at index 0
        
        self.assertIsInstance(chord_info, dict)
        self.assertIn('symbol', chord_info)
        self.assertIn('quality', chord_info)
        self.assertIn('extensions', chord_info)
        
        # Should detect Bb chord
        self.assertIn('Bb', chord_info['symbol'])
    
    def test_chord_classification_major(self):
        """Test chord classification for major chord pattern"""
        # C major pattern: C-E-G
        test_chroma = np.array([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0], dtype=float)
        
        chord_info = self.model._classify_chord_quality(test_chroma, 0)  # C is at index 0
        
        self.assertIn('C', chord_info['symbol'])
        self.assertEqual(chord_info['quality'], 'major')
    
    def test_chord_classification_minor(self):
        """Test chord classification for minor chord pattern"""
        # A minor pattern: A-C-E
        test_chroma = np.array([1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0], dtype=float)
        
        chord_info = self.model._classify_chord_quality(test_chroma, 9)  # A is at index 9
        
        self.assertIn('A', chord_info['symbol'])
        self.assertEqual(chord_info['quality'], 'minor')
    
    def test_confidence_calculation(self):
        """Test confidence score calculation"""
        # Test with clear chord pattern
        clear_chroma = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0], dtype=float)
        clear_values = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0], dtype=float)
        
        confidence = self.model._calculate_confidence(clear_chroma, clear_values)
        
        self.assertIsInstance(confidence, float)
        self.assertGreaterEqual(confidence, 0.0)
        self.assertLessEqual(confidence, 1.0)
    
    def test_mock_chord_progression(self):
        """Test mock chord progression generation"""
        mock_chords = self.model._get_mock_chord_progression()
        
        self.assertIsInstance(mock_chords, list)
        self.assertGreater(len(mock_chords), 0)
        
        # Check structure of first chord
        first_chord = mock_chords[0]
        self.assertIn('symbol', first_chord)
        self.assertIn('start_time', first_chord)
        self.assertIn('end_time', first_chord)
        self.assertIn('confidence', first_chord)
        self.assertIn('root', first_chord)
        self.assertIn('quality', first_chord)
        self.assertIn('extensions', first_chord)
    
    @unittest.skipUnless(
        os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'test_audio', 'just_as_i_am_a_flat_sharp_11.wav')),
        "Test audio file not available"
    )
    def test_audio_loading(self):
        """Test that audio can be loaded successfully"""
        try:
            import librosa
            y, sr = librosa.load(self.test_audio_path, sr=self.model.sample_rate, mono=True)
            self.assertIsNotNone(y)
            self.assertGreater(len(y), 0)
            self.assertEqual(sr, self.model.sample_rate)
        except ImportError:
            self.skipTest("librosa not available")
        except Exception as e:
            self.fail(f"Failed to load audio: {e}")
    
    @unittest.skipUnless(
        os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'test_audio', 'just_as_i_am_a_flat_sharp_11.wav')),
        "Test audio file not available"
    )
    def test_chroma_extraction(self):
        """Test chroma feature extraction"""
        try:
            import librosa
            y, sr = librosa.load(self.test_audio_path, sr=self.model.sample_rate, mono=True)
            
            chroma = librosa.feature.chroma_stft(
                y=y,
                sr=sr,
                hop_length=self.model.hop_length,
                n_fft=self.model.n_fft
            )
            
            self.assertEqual(chroma.shape[0], 12)  # 12 pitch classes
            self.assertGreater(chroma.shape[1], 0)  # At least one frame
        except ImportError:
            self.skipTest("librosa not available")
        except Exception as e:
            self.fail(f"Failed to extract chroma features: {e}")
    
    @unittest.skipUnless(
        os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'test_audio', 'just_as_i_am_a_flat_sharp_11.wav')),
        "Test audio file not available"
    )
    def test_chord_prediction_with_audio(self):
        """Test chord prediction with real audio file"""
        try:
            import librosa
            chords = self.model.predict(self.test_audio_path)
            
            self.assertIsInstance(chords, list)
            self.assertGreater(len(chords), 0)
            
            # Check structure of first chord
            first_chord = chords[0]
            self.assertIn('symbol', first_chord)
            self.assertIn('start_time', first_chord)
            self.assertIn('end_time', first_chord)
            self.assertIn('confidence', first_chord)
            
        except ImportError:
            self.skipTest("librosa not available")
        except Exception as e:
            self.fail(f"Failed to predict chords: {e}")

if __name__ == '__main__':
    unittest.main()
