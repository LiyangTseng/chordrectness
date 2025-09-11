"""
Pydantic models for the Chord Analyzer API
"""

from pydantic import BaseModel
from typing import List, Optional

class ChordAnalysisRequest(BaseModel):
    """Request model for chord analysis"""
    url: str
    start_time: float
    end_time: Optional[float] = None
    analysis_id: str

class ChordResult(BaseModel):
    """Model for individual chord result"""
    chord: str
    confidence: float
    start_time: float
    end_time: float

class ChordAnalysisResponse(BaseModel):
    """Response model for chord analysis"""
    analysis_id: str
    status: str
    chords: List[ChordResult]
    key: str
    tempo: float
    time_signature: str
