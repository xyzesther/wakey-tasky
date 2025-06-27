const { PrismaClient } = require('@prisma/client');
const express = require('express');
const router = express.Router();
const prisma = new PrismaClient();

// POST endpoint to generate tasks from user input
router.post('/generate-task', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { text, startTime, endTime } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Task text content is required'
      });
    }

    // Process date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    let scheduledDateTime = new Date(tomorrow);
    if (startTime) {
      try {
        const [hours, minutes] = startTime.split(':').map(Number);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
      } catch (e) {
        console.error('Error parsing start time:', e);
        scheduledDateTime.setHours(9, 0, 0, 0);
      }
    } else {
      scheduledDateTime.setHours(9, 0, 0, 0);
    }

    let endDateTime = null;
    if (endTime) {
      try {
        endDateTime = new Date(tomorrow);
        const [hours, minutes] = endTime.split(':').map(Number);
        endDateTime.setHours(hours, minutes, 0, 0);
      } catch (e) {
        console.error('Error parsing end time:', e);
      }
    }

    // Create main task and subtasks
    const task = await prisma.mainTask.create({
      data: {
        title: `Task: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
        description: text,
        status: 'PENDING',
        subtasks: {
          create: [
            {
              title: 'Prepare for task',
              status: 'PENDING',
              startAt: scheduledDateTime,
              endAt: new Date(scheduledDateTime.getTime() + 30 * 60000)
            },
            {
              title: 'Complete task',
              status: 'PENDING',
              startAt: new Date(scheduledDateTime.getTime() + 30 * 60000),
              endAt: endDateTime || new Date(scheduledDateTime.getTime() + 90 * 60000)
            }
          ]
        }
      },
      include: {
        subtasks: true
      }
    });

    res.status(201).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
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

    // Check if all subtasks are now COMPLETED
    const { task } = updatedSubtask;
    const allCompleted = task.subtasks.every(s => s.status === 'COMPLETED');

    if (allCompleted && task.status !== 'COMPLETED') {
      await prisma.mainTask.update({
        where: { id: task.id },
        data: { status: 'COMPLETED' }
      });
    }

    res.json({
      success: true,
      message: 'Subtask status updated',
      data: updatedSubtask
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