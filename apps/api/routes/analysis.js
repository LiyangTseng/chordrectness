/**
 * Analysis routes for chord recognition
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const AnalysisService = require('../services/AnalysisService');
const { validateYouTubeUrl } = require('../utils/validators');
const logger = require('../utils/logger');

// Initialize analysis service
const analysisService = new AnalysisService();

/**
 * @route   POST /api/analysis/start
 * @desc    Start chord analysis for a YouTube video segment
 * @access  Public
 */
router.post('/start', [
  body('url')
    .isURL()
    .custom(validateYouTubeUrl)
    .withMessage('Please provide a valid YouTube URL'),
  body('startTime')
    .isFloat({ min: 0 })
    .withMessage('Start time must be a positive number'),
  body('endTime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('End time must be a positive number'),
  body('analysisId')
    .optional()
    .isUUID()
    .withMessage('Analysis ID must be a valid UUID')
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { url, startTime, endTime, analysisId } = req.body;

    logger.info(`Starting analysis for ${url} (${startTime}s - ${endTime || 'end'}s)`);

    // Start analysis
    const result = await analysisService.startAnalysis({
      url,
      startTime,
      endTime,
      analysisId
    });

    res.status(202).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error starting analysis:', error);
    res.status(500).json({
      error: 'Failed to start analysis',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/analysis/:analysisId
 * @desc    Get analysis status and results
 * @access  Public
 */
router.get('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;

    if (!analysisId) {
      return res.status(400).json({
        error: 'Analysis ID is required'
      });
    }

    const result = await analysisService.getAnalysisStatus(analysisId);

    if (!result) {
      return res.status(404).json({
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting analysis status:', error);
    res.status(500).json({
      error: 'Failed to get analysis status',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/analysis/:analysisId/result
 * @desc    Get analysis results (chord progression)
 * @access  Public
 */
router.get('/:analysisId/result', async (req, res) => {
  try {
    const { analysisId } = req.params;

    const result = await analysisService.getAnalysisResult(analysisId);

    if (!result) {
      return res.status(404).json({
        error: 'Analysis result not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting analysis result:', error);
    res.status(500).json({
      error: 'Failed to get analysis result',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/analysis/:analysisId
 * @desc    Cancel/delete an analysis
 * @access  Public
 */
router.delete('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;

    const result = await analysisService.cancelAnalysis(analysisId);

    res.json({
      success: true,
      message: 'Analysis cancelled successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error cancelling analysis:', error);
    res.status(500).json({
      error: 'Failed to cancel analysis',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/analysis
 * @desc    Get list of recent analyses
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const analyses = await analysisService.getRecentAnalyses({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: analyses
    });

  } catch (error) {
    logger.error('Error getting recent analyses:', error);
    res.status(500).json({
      error: 'Failed to get recent analyses',
      message: error.message
    });
  }
});

module.exports = router;
