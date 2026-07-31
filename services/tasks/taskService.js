const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function deriveMainTaskStatus(subtasks) {
  if (!subtasks.length) {
    return 'PENDING';
  }

  const statuses = subtasks.map((subtask) => subtask.status);

  if (statuses.every((status) => status === 'COMPLETED')) {
    return 'COMPLETED';
  }

  if (statuses.every((status) => status === 'CANCELLED')) {
    return 'CANCELLED';
  }

  if (statuses.some((status) => status === 'IN_PROGRESS' || status === 'COMPLETED')) {
    return 'IN_PROGRESS';
  }

  return 'PENDING';
}

function validateStatus(status) {
  if (!TASK_STATUSES.includes(status)) {
    const error = new Error(`Invalid task status: ${status}`);
    error.code = 'INVALID_STATUS';
    throw error;
  }
}

async function reconcileMainTask(tx, taskId) {
  const subtasks = await tx.subtask.findMany({
    where: { taskId },
    select: { status: true, duration: true }
  });

  const status = deriveMainTaskStatus(subtasks);
  const duration = subtasks.reduce(
    (total, subtask) => total + (subtask.duration || 0),
    0
  );

  return tx.mainTask.update({
    where: { id: taskId },
    data: { status, duration }
  });
}

async function setSubtaskStatus(prisma, subtaskId, status) {
  validateStatus(status);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.subtask.findUnique({
      where: { id: subtaskId }
    });

    if (!existing) {
      const error = new Error('Subtask not found');
      error.code = 'NOT_FOUND';
      throw error;
    }

    const updatedSubtask = await tx.subtask.update({
      where: { id: subtaskId },
      data: { status }
    });
    const updatedMainTask = await reconcileMainTask(tx, existing.taskId);

    return { updatedSubtask, updatedMainTask };
  });
}

async function updateSubtask(prisma, subtaskId, changes) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subtask.findUnique({
      where: { id: subtaskId }
    });

    if (!existing) {
      const error = new Error('Subtask not found');
      error.code = 'NOT_FOUND';
      throw error;
    }

    const updatedSubtask = await tx.subtask.update({
      where: { id: subtaskId },
      data: changes
    });
    const updatedMainTask = await reconcileMainTask(tx, existing.taskId);

    return { updatedSubtask, updatedMainTask };
  });
}

module.exports = {
  TASK_STATUSES,
  deriveMainTaskStatus,
  setSubtaskStatus,
  updateSubtask
};
