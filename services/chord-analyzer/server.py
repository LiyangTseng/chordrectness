"""
FastAPI Server for Chord Analyzer Service

This server provides REST API endpoints for chord recognition and analysis.
It supports audio file uploads and returns chord analysis results with chroma vectors.

Endpoints:
- GET /api/v1/health - Health check
- POST /api/v1/analyze/audio - Analyze uploaded audio file
- GET /api/v1/chord-templates - Get available chord templates
- GET /api/v1/models - Get available analysis models
"""

from api.app import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)