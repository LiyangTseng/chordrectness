#!/usr/bin/env python3
"""
Test runner for Chord Analyzer Service
"""

import unittest
import sys
import os
from pathlib import Path

def run_unit_tests():
    """Run unit tests"""
    print("🧪 Running Unit Tests")
    print("=" * 40)

    # Add necessary paths
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services'))
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

    # Discover and run unit tests
    loader = unittest.TestLoader()
    start_dir = os.path.join(os.path.dirname(__file__), 'unit')
    suite = loader.discover(start_dir, pattern='test_*.py')

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()

def run_integration_tests():
    """Run integration tests"""
    print("\n🔗 Running Integration Tests")
    print("=" * 40)

    # Add necessary paths
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

    # Discover and run integration tests
    loader = unittest.TestLoader()
    start_dir = os.path.join(os.path.dirname(__file__), 'integration')
    suite = loader.discover(start_dir, pattern='test_*.py')

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()

def run_all_tests():
    """Run all tests"""
    print("🎵 Chord Analyzer Test Suite")
    print("=" * 50)

    unit_success = run_unit_tests()
    integration_success = run_integration_tests()

    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"  Unit Tests: {'✓ PASS' if unit_success else '❌ FAIL'}")
    print(f"  Integration Tests: {'✓ PASS' if integration_success else '❌ FAIL'}")

    overall_success = unit_success and integration_success
    print(f"\nOverall: {'🎉 ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")

    return overall_success

def main():
    """Main test runner"""
    if len(sys.argv) > 1:
        test_type = sys.argv[1]
        if test_type == 'unit':
            success = run_unit_tests()
        elif test_type == 'integration':
            success = run_integration_tests()
        else:
            print(f"Unknown test type: {test_type}")
            print("Usage: python run_tests.py [unit|integration]")
            return 1
    else:
        success = run_all_tests()

    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()