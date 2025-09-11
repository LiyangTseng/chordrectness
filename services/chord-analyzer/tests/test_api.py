#!/usr/bin/env python3
"""
Unit tests for Chord Analyzer API
"""

import unittest
import os
import sys
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import ChordAnalyzer, ChordAnalysisRequest, ChordResult, ChordAnalysisResponse

class TestChordAnalyzer(unittest.TestCase):
    """Test cases for ChordAnalyzer class"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.analyzer = ChordAnalyzer()
        self.test_audio_path = os.path.join(os.path.dirname(__file__), '..', 'test_audio', 'just_as_i_am_a_flat_sharp_11.wav')
    
    def test_chord_analyzer_initialization(self):
        """Test ChordAnalyzer initialization"""
        self.assertIsNotNone(self.analyzer)
        self.assertIn('Bb7#11', self.analyzer.chord_templates)
        self.assertIn('Bb7', self.analyzer.chord_templates)
        self.assertIn('C', self.analyzer.chord_templates)
    
    def test_chord_template_matching(self):
        """Test chord template matching"""
        # Test Bb7#11 pattern
        bb7sharp11_pattern = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0], dtype=float)
        best_chord, score = self.analyzer.match_chord_template(bb7sharp11_pattern)
        
        self.assertIsInstance(best_chord, str)
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)
    
    def test_key_detection(self):
        """Test key detection from chord list"""
        # Test with Bb chords
        chords = [
            ChordResult(chord="Bb7#11", confidence=0.9, start_time=0.0, end_time=2.0),
            ChordResult(chord="Bb7", confidence=0.8, start_time=2.0, end_time=4.0),
            ChordResult(chord="Bb", confidence=0.7, start_time=4.0, end_time=6.0),
        ]
        
        key = self.analyzer.detect_key(chords)
        self.assertIsInstance(key, str)
        self.assertIn("Bb", key)
    
    def test_key_detection_empty_list(self):
        """Test key detection with empty chord list"""
        key = self.analyzer.detect_key([])
        self.assertEqual(key, "Unknown")
    
    @unittest.skipUnless(
        os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'test_audio', 'just_as_i_am_a_flat_sharp_11.wav')),
        "Test audio file not available"
    )
    def test_chromagram_analysis(self):
        """Test chromagram analysis with real audio"""
        try:
            import librosa
            y, sr = librosa.load(self.test_audio_path)
            
            # Test analysis around 80 seconds (1:20)
            chords = self.analyzer.analyze_chromagram(y, sr, 80.0, 81.0)
            
            self.assertIsInstance(chords, list)
            
            if chords:
                first_chord = chords[0]
                self.assertIsInstance(first_chord, ChordResult)
                self.assertIsInstance(first_chord.chord, str)
                self.assertIsInstance(first_chord.confidence, float)
                self.assertIsInstance(first_chord.start_time, float)
                self.assertIsInstance(first_chord.end_time, float)
        
        except ImportError:
            self.skipTest("librosa not available")
        except Exception as e:
            self.fail(f"Failed chromagram analysis: {e}")

class TestChordAnalysisRequest(unittest.TestCase):
    """Test cases for ChordAnalysisRequest model"""
    
    def test_request_creation(self):
        """Test ChordAnalysisRequest creation"""
        request = ChordAnalysisRequest(
            url="https://youtube.com/watch?v=test",
            start_time=80.0,
            end_time=81.0,
            analysis_id="test-123"
        )
        
        self.assertEqual(request.url, "https://youtube.com/watch?v=test")
        self.assertEqual(request.start_time, 80.0)
        self.assertEqual(request.end_time, 81.0)
        self.assertEqual(request.analysis_id, "test-123")
    
    def test_request_without_end_time(self):
        """Test ChordAnalysisRequest without end_time"""
        request = ChordAnalysisRequest(
            url="https://youtube.com/watch?v=test",
            start_time=80.0,
            analysis_id="test-123"
        )
        
        self.assertEqual(request.url, "https://youtube.com/watch?v=test")
        self.assertEqual(request.start_time, 80.0)
        self.assertIsNone(request.end_time)
        self.assertEqual(request.analysis_id, "test-123")

class TestChordResult(unittest.TestCase):
    """Test cases for ChordResult model"""
    
    def test_chord_result_creation(self):
        """Test ChordResult creation"""
        result = ChordResult(
            chord="Bb7#11",
            confidence=0.92,
            start_time=80.0,
            end_time=81.0
        )
        
        self.assertEqual(result.chord, "Bb7#11")
        self.assertEqual(result.confidence, 0.92)
        self.assertEqual(result.start_time, 80.0)
        self.assertEqual(result.end_time, 81.0)

class TestChordAnalysisResponse(unittest.TestCase):
    """Test cases for ChordAnalysisResponse model"""
    
    def test_response_creation(self):
        """Test ChordAnalysisResponse creation"""
        chords = [
            ChordResult(chord="Bb7#11", confidence=0.92, start_time=80.0, end_time=81.0)
        ]
        
        response = ChordAnalysisResponse(
            analysis_id="test-123",
            status="completed",
            chords=chords,
            key="Bb major",
            tempo=120.0,
            time_signature="4/4"
        )
        
        self.assertEqual(response.analysis_id, "test-123")
        self.assertEqual(response.status, "completed")
        self.assertEqual(len(response.chords), 1)
        self.assertEqual(response.key, "Bb major")
        self.assertEqual(response.tempo, 120.0)
        self.assertEqual(response.time_signature, "4/4")

if __name__ == '__main__':
    unittest.main()
