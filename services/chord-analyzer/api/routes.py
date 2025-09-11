"""
API routes for the Chord Analyzer Service
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from loguru import logger
import tempfile
import os
import sys

from .models import ChordAnalysisRequest, ChordAnalysisResponse, ChordResult
from services.chord_analysis_service import ChordAnalysisService

# Create router
router = APIRouter()

# Initialize service
chord_service = ChordAnalysisService()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "chord-analyzer"}

@router.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Chord Analysis API is running", "version": "1.0.0"}

@router.post("/analyze/audio")
async def analyze_audio_file(
    file: UploadFile = File(...),
    start_time: float = Form(0.0),
    end_time: float = Form(None),
    model_type: str = Form("chroma")
):
    """
    Analyze chord in uploaded audio file
    """
    try:
        logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")

        # Validate file type by extension
        if not file.filename or not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.flac', '.ogg')):
            logger.error(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="File must be an audio file (wav, mp3, m4a, flac, ogg)")

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Initialize service with specified model type
            service = ChordAnalysisService(model_type=model_type)

            # Analyze the audio file
            result = service.analyze_audio_file(temp_file_path, start_time, end_time)

            return {
                "chord": result['chord'],
                "confidence": result['confidence'],
                "chroma_vector": result.get('chroma_vector', []),
                "analysis_time": result.get('analysis_time', 0.0),
                "model_type": model_type
            }

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        logger.error(f"Error in audio analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/models")
async def get_available_models():
    """
    Get list of available chord analysis models
    """
    return {
        "models": [
            {
                "name": "chroma",
                "description": "Chroma-based chord recognition using harmonic analysis",
                "type": "traditional"
            },
            {
                "name": "deep_learning",
                "description": "Deep learning-based chord recognition (placeholder)",
                "type": "ml"
            }
        ]
    }


@router.get("/chord-templates")
async def get_chord_templates():
    """
    Get available chord templates
    """
    try:
        from models.audio.templates import ChordTemplates
        templates = ChordTemplates.get_all_chord_names()
        return {"chord_templates": templates}
    except Exception as e:
        logger.error(f"Error getting chord templates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get chord templates: {str(e)}")

@router.post("/analyze", response_model=ChordAnalysisResponse)
async def analyze_chords(request: ChordAnalysisRequest):
    """Analyze chords in audio from YouTube URL"""
    try:
        logger.info(f"Starting chord analysis for {request.url} at {request.start_time}")

        # Analyze chords using the service
        chords_data = chord_service.analyze_youtube_audio(
            request.url,
            request.start_time,
            request.end_time
        )

        # Convert to ChordResult objects
        chords = [
            ChordResult(
                chord=chord['chord'],
                confidence=chord['confidence'],
                start_time=chord['start_time'],
                end_time=chord['end_time']
            )
            for chord in chords_data
        ]

        # Detect key
        key = chord_service.detect_key(chords_data)

        return ChordAnalysisResponse(
            analysis_id=request.analysis_id,
            status="completed",
            chords=chords,
            key=key,
            tempo=120.0,  # Default tempo
            time_signature="4/4"
        )

    except Exception as e:
        logger.error(f"Error in chord analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
