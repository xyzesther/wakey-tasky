const { PrismaClient } = require('@prisma/client');
const express = require('express');
const router = express.Router();
const prisma = new PrismaClient();
const axios = require('axios');

// Load environment variables
const LLM_API_KEY = process.env.LLM_API_KEY || 'your-key-here';
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:3001/api/v1';
const WORKSPACE_SLUG = process.env.WORKSPACE_SLUG || 'your-workspace-slug';

// Endpoint to break down a task using LLM
router.post('/break-down-task', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Task text is required'
      });
    }
    
    // Call the AnythingLLM API
    const prompt = `Break down this task into 3-5 smaller subtasks with estimated durations in minutes: "${text}"`;
    
    const response = await axios.post(`${LLM_BASE_URL}/chat`, {
      prompt: prompt,
      workspace: WORKSPACE_SLUG,
      history: [],
      model: "default"
    }, {
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Parse the response to extract subtasks
    const subtasks = parseSubtasksFromResponse(response.data.response);
    
    res.json({
      success: true,
      data: {
        subtasks: subtasks
      }
    });
  } catch (error) {
    console.error('Error breaking down task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to break down task',
      details: error.message
    });
  }
});

// Helper function to parse subtasks from LLM response
function parseSubtasksFromResponse(text) {
  // This is a simplified parser - you may need a more robust one
  // depending on how structured the LLM responses are
  const lines = text.split('\n').filter(line => line.trim());
  
  return lines.map(line => {
    // Extract title and duration (looking for patterns like "Title - 30 min")
    const durationMatch = line.match(/(\d+)\s*min/);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 30; // Default to 30 min
    
    // Remove duration from title
    let title = line;
    if (durationMatch) {
      title = line.substring(0, line.lastIndexOf(durationMatch[0])).trim();
    }
    
    // Remove any leading numbers or bullets
    title = title.replace(/^[\d\.\-\•\*]+\s*/, '');
    
    return {
      title: title,
      duration: duration,
      status: 'PENDING'
    };
  });
}

module.exports = router; 