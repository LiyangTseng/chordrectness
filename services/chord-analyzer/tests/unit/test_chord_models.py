#!/usr/bin/env python3
"""
Unit tests for simplified chord models
"""

import unittest
import os
import sys
import numpy as np
from pathlib import Path

# Add project root to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from models.audio.templates import ChordTemplates
from models.chroma_chord_model import ChromaChordModel
from models.model_factory import ModelFactory

class TestChordTemplates(unittest.TestCase):
    """Test cases for ChordTemplates"""
    
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

class TestChromaChordModel(unittest.TestCase):
    """Test cases for ChromaChordModel"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.model = ChromaChordModel()
        self.test_audio_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'test_audio', 'just_as_i_am_a_flat_sharp_11.wav')
    
    def test_model_initialization(self):
        """Test model initialization"""
        self.assertIsNotNone(self.model)
        self.assertIsNotNone(self.model.chord_templates)
        self.assertIsInstance(self.model.chord_templates, ChordTemplates)
    
    def test_predict_chord_interface(self):
        """Test predict_chord method exists and has correct signature"""
        # Check method exists
        self.assertTrue(hasattr(self.model, 'predict_chord'))
        
        # Check it's callable
        self.assertTrue(callable(self.model.predict_chord))
    
    def test_predict_chord_with_audio(self):
        """Test chord prediction with real audio file"""
        try:
            result = self.model.predict_chord(self.test_audio_path)
            
            self.assertIsInstance(result, dict)
            self.assertIn('chord', result)
            self.assertIn('confidence', result)
            
            # Should detect a chord (any chord is fine for this test)
            self.assertIsInstance(result['chord'], str)
            self.assertIsInstance(result['confidence'], (int, float))
            self.assertGreaterEqual(result['confidence'], 0.0)
            self.assertLessEqual(result['confidence'], 1.0)
            
        except ImportError:
            self.skipTest("librosa not available")
        except Exception as e:
            self.fail(f"Failed to predict chord: {e}")
    
    def test_chord_detection(self):
        """Test that chord detection returns valid results"""
        try:
            result = self.model.predict_chord(self.test_audio_path)
            
            # Test that we get a valid chord result
            self.assertIsInstance(result, dict)
            self.assertIn('chord', result)
            self.assertIn('confidence', result)
            
            # Test that chord is a string and confidence is a number
            self.assertIsInstance(result['chord'], str)
            self.assertIsInstance(result['confidence'], (int, float))
            self.assertGreater(len(result['chord']), 0)
            
        except ImportError:
            self.skipTest("librosa not available")
        except Exception as e:
            self.fail(f"Failed to predict chord: {e}")

class TestModelFactory(unittest.TestCase):
    """Test cases for ModelFactory"""
    
    def test_create_chroma_model(self):
        """Test creating chroma model"""
        model = ModelFactory.create_model("chroma")
        
        self.assertIsInstance(model, ChromaChordModel)
        self.assertTrue(hasattr(model, 'predict_chord'))
    
    def test_model_interface_consistency(self):
        """Test that all models have consistent interface"""
        chroma_model = ModelFactory.create_model("chroma")
        dl_model = ModelFactory.create_model("deep_learning")
        
        # Both should have the same interface
        for method in ['predict_chord']:
            self.assertTrue(hasattr(chroma_model, method))
            self.assertTrue(hasattr(dl_model, method))

if __name__ == '__main__':
    unittest.main()
