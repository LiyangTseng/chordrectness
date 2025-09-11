# Chord Analyzer Service

A Python service for single chord recognition using chromagram analysis. This service follows clean architecture principles with proper separation of concerns.

## Features

- **Single Chord Detection**: Focused on predicting one chord for user-provided time slices
- **Clean Architecture**: Proper separation of models, services, utilities, and API layers
- **Object-Oriented Design**: Abstract base classes with concrete implementations
- **Chromagram Analysis**: Uses librosa to extract chroma features from audio
- **Template Matching**: Detects chord symbols using shared chord templates
- **YouTube Integration**: Can extract audio directly from YouTube URLs
- **REST API**: FastAPI-based service with automatic documentation
- **Docker Support**: Containerized for easy deployment
- **Comprehensive Testing**: Unit tests for all components

## Clean Architecture

```
services/chord-analyzer/
├── api/                    # API layer (FastAPI)
│   ├── app.py             # FastAPI application
│   ├── models.py          # Pydantic models
│   └── routes.py          # API routes
├── models/                 # Domain models (chord recognition)
│   ├── base_chord_model.py        # Abstract base class
│   ├── chroma_chord_model.py      # Chroma-based implementation
│   ├── deep_learning_chord_model.py  # ML placeholder
│   └── model_factory.py           # Factory pattern
├── services/              # Business logic layer
│   ├── audio_processor.py         # Audio processing service
│   └── chord_analysis_service.py  # Chord analysis orchestration
├── utils/                 # Shared utilities
│   ├── chord_templates.py         # Chord pattern templates
│   ├── audio_utils.py             # Audio processing utilities
│   ├── confidence_utils.py        # Confidence calculation
│   └── mock_data.py              # Mock data generation
├── tests/                 # Test layer
│   ├── unit/              # Unit tests
│   │   ├── test_chord_models.py   # Model tests
│   │   └── test_utilities.py      # Utility tests
│   └── integration/       # Integration tests
├── data/                  # Data files
│   └── test_audio/        # Test audio files
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
└── setup.py             # Package setup
```

## Key Design Principles

### 1. Single Responsibility Principle
- **Models**: Focus only on chord recognition logic
- **Services**: Orchestrate business logic
- **Utils**: Provide shared functionality
- **API**: Handle HTTP requests/responses

### 2. Open/Closed Principle
- Easy to add new model types (CNN, RNN, etc.) without modifying existing code
- Factory pattern allows runtime model selection

### 3. Dependency Inversion
- High-level modules don't depend on low-level modules
- Both depend on abstractions (base classes)

### 4. Clean Naming
- Descriptive, purpose-driven names
- No abbreviations or unclear terms

## Installation

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run tests:
```bash
python tests/run_tests.py unit
```

3. Start the service:
```bash
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
- `POST /analyze` - Analyze single chord in audio

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
print(f"Detected chord: {result['chord']}")
print(f"Confidence: {result['confidence']}")
```

### Direct Usage

```python
from models.model_factory import ModelFactory

# Create a chroma model
model = ModelFactory.create_model("chroma")

# Predict single chord
result = model.predict_chord("path/to/audio.wav", start_time=80.0, end_time=81.0)
print(f"Chord: {result['chord']}, Confidence: {result['confidence']}")
```

## Testing

Run all tests:
```bash
python tests/run_tests.py unit
```

Run specific test categories:
```bash
python tests/unit/test_chord_models.py
python tests/unit/test_utilities.py
```

## Development

### Adding New Chord Templates

Edit `utils/chord_templates.py` and add new patterns to the `TEMPLATES` dictionary:

```python
TEMPLATES = {
    'Cmaj7': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],  # C-E-G-B
    # Add more patterns...
}
```

### Adding New Model Types

1. Create new model class inheriting from `BaseChordModel`
2. Implement required abstract methods
3. Add to `ModelFactory`
4. Add tests

### Test Coverage

The test suite includes:
- Unit tests for all utilities
- Model interface consistency tests
- Chord template matching tests
- Confidence calculation tests
- Mock data generation tests

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc