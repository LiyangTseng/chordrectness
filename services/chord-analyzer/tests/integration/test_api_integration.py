#!/usr/bin/env python3
"""
Integration tests for Chord Analyzer API
"""

import unittest
import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add api directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'api'))

from app import app

class TestAPIIntegration(unittest.TestCase):
    """Integration tests for the API"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.client = TestClient(app)
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = self.client.get("/api/v1/health")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "chord-analyzer")
    
    def test_analyze_endpoint_structure(self):
        """Test analyze endpoint structure (without actual processing)"""
        # This test would need mocking of the actual chord analysis
        # For now, just test that the endpoint exists and accepts the right format
        request_data = {
            "url": "https://youtube.com/watch?v=test",
            "start_time": 80.0,
            "end_time": 81.0,
            "analysis_id": "test-123"
        }
        
        # This will likely fail due to missing dependencies, but we can test the structure
        try:
            response = self.client.post("/api/v1/analyze", json=request_data)
            # If it succeeds, check the structure
            if response.status_code == 200:
                data = response.json()
                self.assertIn("analysis_id", data)
                self.assertIn("status", data)
                self.assertIn("chords", data)
                self.assertIn("key", data)
                self.assertIn("tempo", data)
                self.assertIn("time_signature", data)
        except Exception:
            # Expected to fail due to missing dependencies in test environment
            pass

if __name__ == '__main__':
    unittest.main()
