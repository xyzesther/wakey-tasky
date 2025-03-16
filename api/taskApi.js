const { PrismaClient } = require('@prisma/client');
const express = require('express');
const router = express.Router();
const prisma = new PrismaClient();

// POST endpoint to generate tasks from user input
router.post('/generate-task', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { text, startTime, endTime } = req.body;
    
    // Validate required fields
    if (!text) {
      return res.status(400).json({ 
        success: false,
        error: 'Task text content is required' 
      });
    }

    // Create user input record
    let userInput;
    try {
      userInput = await prisma.userInput.create({
        data: {
          text,
          processed: false,
        }
      });
      console.log('Created user input:', userInput);
    } catch (dbError) {
      console.error('Error creating user input:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database error while creating user input',
        details: dbError.message
      });
    }

    // Process date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set scheduled start time
    let scheduledDateTime = new Date(tomorrow);
    if (startTime) {
      try {
        const [hours, minutes] = startTime.split(':').map(Number);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
      } catch (e) {
        console.error('Error parsing start time:', e);
        // Use default value 9:00 AM
        scheduledDateTime.setHours(9, 0, 0, 0);
      }
    } else {
      scheduledDateTime.setHours(9, 0, 0, 0);
    }
    
    // Set end time
    let endDateTime = null;
    if (endTime) {
      try {
        endDateTime = new Date(tomorrow);
        const [hours, minutes] = endTime.split(':').map(Number);
        endDateTime.setHours(hours, minutes, 0, 0);
      } catch (e) {
        console.error('Error parsing end time:', e);
        // If parsing fails, keep as null
      }
    }
    
    console.log('Processed times:', {
      startTime,
      endTime,
      scheduledDateTime,
      endDateTime
    });
    
    // Create task
    let task;
    try {
      task = await prisma.task.create({
        data: {
          inputId: userInput.id,
          title: `Task: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
          status: 'PENDING',
          scheduledTime: scheduledDateTime,
          endTime: endDateTime,
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
      console.log('Created task:', JSON.stringify(task, null, 2));
    } catch (dbError) {
      console.error('Error creating task:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database error while creating task',
        details: dbError.message
      });
    }

    // Update user input as processed
    try {
      await prisma.userInput.update({
        where: { id: userInput.id },
        data: { processed: true }
      });
    } catch (dbError) {
      console.error('Error updating user input status:', dbError);
      // Continue returning results since the main task was created
    }

    // Return success response
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
    console.error('Error generating task (uncaught):', error);
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

// 添加一个简单的测试端点
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

// DELETE endpoint to remove a task by ID
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete the subtasks to avoid foreign key constraints
    await prisma.subtask.deleteMany({
      where: {
        taskId: id
      }
    });
    
    // Then delete the task
    const deletedTask = await prisma.task.delete({
      where: { id }
    });
    
    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask
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

// Clean up Prisma when the app is shutting down
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = router; 