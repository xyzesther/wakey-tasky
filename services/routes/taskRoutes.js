const { PrismaClient } = require('@prisma/client');
const express = require('express');
const { generateTasksFromText } = require('../ai/taskGenerator');
const {
  TASK_STATUSES,
  setSubtaskStatus,
  updateSubtask
} = require('../tasks/taskService');

const router = express.Router();
const prisma = new PrismaClient();

function sendError(res, error, fallbackMessage) {
  if (error.code === 'NOT_FOUND' || error.code === 'P2025') {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  if (error.code === 'INVALID_STATUS') {
    return res.status(400).json({ success: false, error: error.message });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({
    success: false,
    error: fallbackMessage
  });
}

router.post('/generate-task', async (req, res) => {
  try {
    const { text, userId } = req.body;

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task text content is required'
      });
    }

    const tasksFromAI = await generateTasksFromText(text.trim());
    const createOperations = tasksFromAI.map((taskData) => {
      const taskCreateData = {
        title: taskData.title,
        status: taskData.status,
        duration: taskData.duration,
        subtasks: {
          create: taskData.subtasks.map((subtask) => ({
            title: subtask.title,
            description: subtask.description,
            status: subtask.status,
            duration: subtask.duration
          }))
        }
      };

      if (userId) {
        taskCreateData.user = { connect: { id: userId } };
      }

      return prisma.mainTask.create({
        data: taskCreateData,
        include: { subtasks: true }
      });
    });

    const createdTasks = await prisma.$transaction(createOperations);
    return res.status(201).json({ success: true, data: createdTasks });
  } catch (error) {
    console.error('Failed to generate tasks:', error);
    const status = error.name === 'TaskValidationError' ? 502 : 500;
    return res.status(status).json({
      success: false,
      error:
        status === 502
          ? 'AI returned invalid task data after one repair attempt'
          : 'Failed to generate tasks'
    });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.mainTask.findMany({
      include: { subtasks: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: tasks });
  } catch (error) {
    return sendError(res, error, 'Failed to fetch tasks');
  }
});

router.get('/tasks/:id', async (req, res) => {
  try {
    const task = await prisma.mainTask.findUnique({
      where: { id: req.params.id },
      include: { subtasks: true }
    });

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    return res.json({ success: true, data: task });
  } catch (error) {
    return sendError(res, error, 'Failed to fetch task');
  }
});

router.patch('/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const updatedTask = await prisma.mainTask.update({
      where: { id: req.params.id },
      data: { status }
    });
    return res.json({
      success: true,
      message: 'Task status updated',
      data: updatedTask
    });
  } catch (error) {
    return sendError(res, error, 'Failed to update task status');
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [, deleted] = await prisma.$transaction([
      prisma.subtask.deleteMany({ where: { taskId: id } }),
      prisma.mainTask.delete({ where: { id } })
    ]);

    return res.json({
      success: true,
      message: 'Task deleted successfully',
      data: deleted
    });
  } catch (error) {
    return sendError(res, error, 'Failed to delete task');
  }
});

router.patch('/subtasks/:id/status', async (req, res) => {
  try {
    const result = await setSubtaskStatus(
      prisma,
      req.params.id,
      req.body.status
    );
    return res.json({
      success: true,
      message: 'Subtask status updated',
      data: result.updatedSubtask,
      mainTaskUpdated: true,
      updatedMainTask: result.updatedMainTask
    });
  } catch (error) {
    return sendError(res, error, 'Failed to update subtask status');
  }
});

router.patch('/subtasks/:id', async (req, res) => {
  const changes = {};

  if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
    if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Subtask title is required'
      });
    }
    changes.title = req.body.title.trim().slice(0, 120);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
    if (req.body.description != null && typeof req.body.description !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Subtask description must be text'
      });
    }
    changes.description = req.body.description?.trim().slice(0, 500) || null;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'duration')) {
    const duration = Number(req.body.duration);
    if (!Number.isInteger(duration) || duration < 1 || duration > 120) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be an integer between 1 and 120'
      });
    }
    changes.duration = duration;
  }

  if (!Object.keys(changes).length) {
    return res.status(400).json({
      success: false,
      error: 'No editable subtask fields were provided'
    });
  }

  try {
    const result = await updateSubtask(prisma, req.params.id, changes);
    return res.json({
      success: true,
      message: 'Subtask updated',
      data: result.updatedSubtask,
      updatedMainTask: result.updatedMainTask
    });
  } catch (error) {
    return sendError(res, error, 'Failed to update subtask');
  }
});

router.get('/debug-tasks', async (req, res) => {
  try {
    const tasks = await prisma.mainTask.findMany({
      include: { subtasks: true }
    });
    return res.json({ count: tasks.length, tasks });
  } catch (error) {
    return sendError(res, error, 'Failed to fetch debug tasks');
  }
});

router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = router;
