const { PrismaClient } = require('@prisma/client');
const express = require('express');
const router = express.Router();
const prisma = new PrismaClient();

// POST endpoint to generate tasks from user input
router.post('/generate-task', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    // Create a new user input record
    const userInput = await prisma.userInput.create({
      data: {
        text,
        processed: false,
      }
    });

    // Here you would typically have some logic to analyze the text
    // and determine what tasks to create. For now, I'll create a simple task.
    
    // Get tomorrow at 9 AM for scheduling
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const task = await prisma.task.create({
      data: {
        inputId: userInput.id,
        title: `Task from: ${text.substring(0, 30)}...`,
        status: 'PENDING',
        scheduledTime: tomorrow,
        application: 'calendar',
        subtasks: {
          create: [
            {
              title: 'Prepare for task',
              status: 'PENDING',
              duration: 30 // 30 minutes
            },
            {
              title: 'Complete task',
              status: 'PENDING',
              duration: 60 // 60 minutes
            }
          ]
        }
      },
      include: {
        subtasks: true
      }
    });

    // Log the task object to see what's actually returned
    console.log('Created task:', JSON.stringify(task, null, 2));

    // Update the userInput as processed
    await prisma.userInput.update({
      where: { id: userInput.id },
      data: { processed: true }
    });

    res.status(201).json({
      success: true,
      data: {
        userInput,
        task: {
          id: task.id,
          inputId: task.inputId,
          title: task.title,
          status: task.status,
          scheduledTime: task.scheduledTime,
          endTime: task.endTime,
          application: task.application,
          subtasks: task.subtasks
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate task',
      details: error.message
    });
  }
});

// GET endpoint to retrieve all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        subtasks: true,
        input: true
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

// GET endpoint to retrieve a specific task by ID
router.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: true,
        input: true
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

// Add this endpoint for debugging
router.get('/debug-tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        subtasks: true
      }
    });
    
    res.json({
      count: tasks.length,
      tasks: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clean up Prisma when the app is shutting down
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = router; 