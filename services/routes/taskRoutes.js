const { PrismaClient } = require('@prisma/client');
const express = require('express');
const router = express.Router();
const prisma = new PrismaClient();

// Import AI components
const { getProvider } = require('../ai/registry');
const { getTaskPrompt } = require('../ai/prompts/task');
const { chat } = require('../ai/models/openai');

// POST endpoint to generate tasks from user input using AI
router.post('/generate-task', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Task text content is required'
      });
    }

    // Use AI to generate tasks
    const currentDateTime = new Date().toISOString();
    const prompt = getTaskPrompt(text, currentDateTime);
    
    console.log('Calling AI with prompt:', prompt);
    const aiResponse = await chat(prompt);
    console.log('AI response:', aiResponse);

    // Parse AI response
    let tasksFromAI;
    try {
      tasksFromAI = JSON.parse(aiResponse);
      if (!Array.isArray(tasksFromAI)) {
        throw new Error('AI response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response',
        details: parseError.message
      });
    }

    // Create tasks in database based on AI response
    const createdTasks = await Promise.all(
      tasksFromAI.map(async (taskData) => {
        const taskCreateData = {
          title: taskData.title,
          status: taskData.status || 'PENDING',
          duration: taskData.duration || 5, // Default to 5 minutes if no subtasks
          subtasks: {
            create: taskData.subtasks?.map(subtask => ({
              title: subtask.title,
              status: subtask.status || 'PENDING',
              duration: subtask.duration
            })) || []
          }
        };

        // Add user connection if userId is provided
        if (userId) {
          taskCreateData.user = { connect: { id: userId } };
        }

        return prisma.mainTask.create({
          data: taskCreateData,
          include: { subtasks: true }
        });
      })
    );

    res.status(201).json({
      success: true,
      data: createdTasks
    });

  } catch (error) {
    console.error('Error generating tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate tasks',
      details: error.message
    });
  }
});

// GET all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.mainTask.findMany({
      include: {
        subtasks: true
      }
    });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      details: error.message
    });
  }
});

// GET single task by ID
router.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.mainTask.findUnique({
      where: { id },
      include: {
        subtasks: true
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      details: error.message
    });
  }
});

// PATCH: update task status
router.patch('/tasks/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const updatedTask = await prisma.mainTask.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Task status updated',
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task status',
      details: error.message
    });
  }
});

// DELETE task and subtasks
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.subtask.deleteMany({
      where: { taskId: id }
    });

    const deleted = await prisma.mainTask.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: deleted
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      details: error.message
    });
  }
});

// Debugging route
router.get('/debug-tasks', async (req, res) => {
  try {
    const tasks = await prisma.mainTask.findMany({
      include: {
        subtasks: true
      }
    });

    res.json({
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Error fetching debug tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

// Cleanup
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// PATCH endpoint to update subtask status
router.patch('/subtasks/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    // Get the current subtask to check its previous status
    const currentSubtask = await prisma.subtask.findUnique({
      where: { id },
      include: {
        task: true
      }
    });

    if (!currentSubtask) {
      return res.status(404).json({
        success: false,
        error: 'Subtask Not Found'
      });
    }

    // Update the subtask's status
    const updatedSubtask = await prisma.subtask.update({
      where: { id },
      data: { status },
      include: {
        task: {
          include: {
            subtasks: true
          }
        }
      }
    });

    const { task } = updatedSubtask;
    
    // Check if we need to update the main task status
    let mainTaskUpdated = false;

    // If subtask changed from PENDING to IN_PROGRESS and main task is not IN_PROGRESS
    if (currentSubtask.status === 'PENDING' && 
        status === 'IN_PROGRESS' && 
        task.status !== 'IN_PROGRESS') {
      
      await prisma.mainTask.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS' }
      });
      mainTaskUpdated = true;
    }
    // Check if all subtasks are now COMPLETED
    else if (status === 'COMPLETED') {
      const allCompleted = task.subtasks.every(s => 
        s.id === id ? status === 'COMPLETED' : s.status === 'COMPLETED'
      );

      if (allCompleted && task.status !== 'COMPLETED') {
        await prisma.mainTask.update({
          where: { id: task.id },
          data: { status: 'COMPLETED' }
        });
        mainTaskUpdated = true;
      }
    }

    // Fetch the updated main task if it was modified
    let updatedMainTask = null;
    if (mainTaskUpdated) {
      updatedMainTask = await prisma.mainTask.findUnique({
        where: { id: task.id },
        include: { subtasks: true }
      });
    }

    res.json({
      success: true,
      message: 'Subtask status updated',
      data: updatedSubtask,
      mainTaskUpdated: mainTaskUpdated,
      updatedMainTask: updatedMainTask
    });

  } catch (error) {
    console.error('Error updating subtask status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subtask status',
      details: error.message
    });
  }
});

module.exports = router;