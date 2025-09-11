# Chord Analyzer Service

A Python service for chord recognition using chromagram analysis. This service can analyze audio files and detect chord progressions using machine learning techniques.

## Features

- **Chromagram Analysis**: Uses librosa to extract chroma features from audio
- **Chord Recognition**: Detects chord symbols using template matching
- **YouTube Integration**: Can extract audio directly from YouTube URLs
- **REST API**: FastAPI-based service with automatic documentation
- **Docker Support**: Containerized for easy deployment

## Project Structure

```
services/chord-analyzer/
├── src/                    # Source code
│   ├── __init__.py
│   ├── chord_analyzer.py   # Core chord recognition model
│   └── main.py            # FastAPI application
├── tests/                  # Test suite
│   ├── __init__.py
│   ├── test_chord_recognition.py
│   ├── test_api.py
│   └── run_tests.py
├── test_audio/            # Test audio files
│   └── just_as_i_am_a_flat_sharp_11.wav
├── data/                  # Data files (models, etc.)
├── models/                # Trained models
├── requirements.txt       # Python dependencies
├── setup.py              # Package setup
└── README.md             # This file
```

## Installation

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run tests:
```bash
cd tests
python run_tests.py
```

3. Start the service:
```bash
cd src
python main.py
```

### Docker

```bash
docker build -t chord-analyzer .
docker run -p 8001:8001 chord-analyzer
```

## Usage

### API Endpoints

- `GET /health` - Health check
- `POST /analyze` - Analyze chords in audio

### Example API Call

```python
import requests

response = requests.post("http://localhost:8001/analyze", json={
    "url": "https://youtube.com/watch?v=example",
    "start_time": 80.0,
    "end_time": 81.0,
    "analysis_id": "test-123"
})

result = response.json()
print(f"Detected chords: {result['chords']}")
```

### Direct Usage

```python
from src.chord_analyzer import ChordRecognitionModel

model = ChordRecognitionModel()
chords = model.predict("path/to/audio.wav", start_time=80.0, end_time=81.0)

for chord in chords:
    print(f"{chord['symbol']} ({chord['start_time']:.1f}s - {chord['end_time']:.1f}s)")
```

## Testing

Run all tests:
```bash
cd tests
python run_tests.py
```

Run specific test suite:
```bash
python run_tests.py chord_recognition
python run_tests.py api
```

## Development

### Adding New Chord Templates

Edit `src/chord_analyzer.py` and add new patterns to the `chord_templates` dictionary:

```python
chord_templates = {
    'Cmaj7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],  # C-E-G-B
    # Add more patterns...
}
```

### Running Tests

The test suite includes:
- Unit tests for chord recognition
- API endpoint tests
- Integration tests with real audio files

Make sure the test audio file is in `test_audio/` directory.

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc
