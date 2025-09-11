#!/usr/bin/env python3
"""
Test runner for Chord Analyzer Service
"""

import unittest
import sys
import os
from pathlib import Path

def run_all_tests():
    """Run all tests in the tests directory"""
    # Add src directory to Python path
    src_path = os.path.join(os.path.dirname(__file__), '..', 'src')
    sys.path.insert(0, src_path)
    
    # Discover and run tests
    loader = unittest.TestLoader()
    start_dir = os.path.dirname(__file__)
    suite = loader.discover(start_dir, pattern='test_*.py')
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Return success status
    return result.wasSuccessful()

def run_specific_test(test_name):
    """Run a specific test"""
    # Add src directory to Python path
    src_path = os.path.join(os.path.dirname(__file__), '..', 'src')
    sys.path.insert(0, src_path)
    
    # Import and run specific test
    if test_name == 'chord_recognition':
        from test_chord_recognition import TestChordRecognitionModel
        suite = unittest.TestLoader().loadTestsFromTestCase(TestChordRecognitionModel)
    elif test_name == 'api':
        from test_api import TestChordAnalyzer, TestChordAnalysisRequest, TestChordResult, TestChordAnalysisResponse
        suite = unittest.TestSuite()
        suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestChordAnalyzer))
        suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestChordAnalysisRequest))
        suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestChordResult))
        suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestChordAnalysisResponse))
    else:
        print(f"Unknown test: {test_name}")
        return False
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

def main():
    """Main test runner"""
    if len(sys.argv) > 1:
        test_name = sys.argv[1]
        success = run_specific_test(test_name)
    else:
        success = run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()