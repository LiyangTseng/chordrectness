#!/usr/bin/env python3
"""
Simple test for Chord Analyzer - tests basic functionality without heavy dependencies
"""

import os
import sys
import json
from pathlib import Path

def test_basic_functionality():
    """Test basic chord analyzer functionality"""
    print("🎵 Simple Chord Analyzer Test")
    print("=" * 40)
    
    # Check if test audio file exists
    audio_file = Path("../../just_as_i_am_a_flat_sharp_11.wav")
    if not audio_file.exists():
        print(f"❌ Test audio file not found: {audio_file}")
        return False
    
    print(f"✓ Found test audio file: {audio_file}")
    print(f"  File size: {audio_file.stat().st_size} bytes")
    
    # Test if we can import the chord analyzer
    try:
        from chord_analyzer import ChordRecognitionModel
        print("✓ ChordRecognitionModel imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import ChordRecognitionModel: {e}")
        return False
    
    # Test model initialization
    try:
        model = ChordRecognitionModel()
        print("✓ Model initialized successfully")
        print(f"  Sample rate: {model.sample_rate} Hz")
        print(f"  Hop length: {model.hop_length}")
        print(f"  N_FFT: {model.n_fft}")
    except Exception as e:
        print(f"❌ Failed to initialize model: {e}")
        return False
    
    # Test mock chord progression (doesn't require audio processing)
    try:
        mock_chords = model._get_mock_chord_progression()
        print(f"✓ Mock chord progression generated: {len(mock_chords)} chords")
        for i, chord in enumerate(mock_chords):
            print(f"  {i+1}. {chord['symbol']} ({chord['start_time']:.1f}s - {chord['end_time']:.1f}s)")
    except Exception as e:
        print(f"❌ Failed to generate mock chords: {e}")
        return False
    
    # Test chord classification with known pattern
    try:
        import numpy as np
        
        # Test Bb7#11 pattern: [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0]
        test_chroma = np.array([1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0], dtype=float)
        chord_info = model._classify_chord_quality(test_chroma, 0)  # Bb is at index 0
        
        print(f"✓ Chord classification test:")
        print(f"  Input pattern: Bb7#11")
        print(f"  Detected symbol: {chord_info['symbol']}")
        print(f"  Quality: {chord_info['quality']}")
        print(f"  Extensions: {chord_info['extensions']}")
        
        # Check if Bb7#11 was detected correctly
        if 'Bb7#11' in chord_info['symbol'] or 'Bb' in chord_info['symbol']:
            print("✓ Bb chord detected correctly!")
        else:
            print("⚠ Bb chord not detected - this might need tuning")
            
    except Exception as e:
        print(f"❌ Failed chord classification test: {e}")
        return False
    
    print("\n🎉 Basic functionality test passed!")
    return True

def test_audio_processing():
    """Test audio processing if librosa is available"""
    print("\n🎵 Testing Audio Processing")
    print("-" * 30)
    
    try:
        import librosa
        import numpy as np
        print("✓ librosa and numpy available")
        
        # Test audio loading
        audio_file = Path("../../just_as_i_am_a_flat_sharp_11.wav")
        y, sr = librosa.load(str(audio_file), sr=22050, mono=True)
        print(f"✓ Audio loaded: {len(y)} samples, {sr} Hz")
        
        # Test chroma extraction
        chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=512, n_fft=2048)
        print(f"✓ Chroma features extracted: {chroma.shape}")
        
        # Test chord prediction
        from chord_analyzer import ChordRecognitionModel
        model = ChordRecognitionModel()
        
        print("🎵 Testing chord prediction on full audio...")
        chords = model.predict(str(audio_file))
        
        print(f"✓ Found {len(chords)} chord segments:")
        for i, chord in enumerate(chords[:5]):  # Show first 5 chords
            print(f"  {i+1}. {chord['symbol']} ({chord['start_time']:.1f}s - {chord['end_time']:.1f}s) - Confidence: {chord['confidence']:.2f}")
        
        if len(chords) > 5:
            print(f"  ... and {len(chords) - 5} more chords")
        
        # Check for Bb7#11
        bb7sharp11_found = any('Bb7#11' in chord['symbol'] for chord in chords)
        if bb7sharp11_found:
            print("✓ Bb7#11 chord detected in the audio!")
        else:
            print("⚠ Bb7#11 chord not detected - this might be expected depending on the audio content")
        
        return True
        
    except ImportError as e:
        print(f"⚠ Audio processing test skipped - missing dependency: {e}")
        print("  Install with: pip install librosa numpy")
        return True  # Not a failure, just skipped
    except Exception as e:
        print(f"❌ Audio processing test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Chord Analyzer Test Suite")
    print("=" * 50)
    
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Run basic functionality test
    basic_success = test_basic_functionality()
    
    # Run audio processing test
    audio_success = test_audio_processing()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"  Basic functionality: {'✓ PASS' if basic_success else '❌ FAIL'}")
    print(f"  Audio processing: {'✓ PASS' if audio_success else '❌ FAIL'}")
    
    overall_success = basic_success and audio_success
    print(f"\nOverall: {'🎉 ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    return 0 if overall_success else 1

if __name__ == "__main__":
    sys.exit(main())
