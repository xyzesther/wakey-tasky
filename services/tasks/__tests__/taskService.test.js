const {
  deriveMainTaskStatus,
  setSubtaskStatus
} = require('../taskService');

describe('deriveMainTaskStatus', () => {
  test.each([
    [[], 'PENDING'],
    [[{ status: 'PENDING' }], 'PENDING'],
    [[{ status: 'CANCELLED' }], 'CANCELLED'],
    [[{ status: 'COMPLETED' }, { status: 'COMPLETED' }], 'COMPLETED'],
    [[{ status: 'COMPLETED' }, { status: 'PENDING' }], 'IN_PROGRESS'],
    [[{ status: 'IN_PROGRESS' }, { status: 'PENDING' }], 'IN_PROGRESS'],
    [[{ status: 'CANCELLED' }, { status: 'PENDING' }], 'PENDING']
  ])('derives the parent state from all children', (subtasks, expected) => {
    expect(deriveMainTaskStatus(subtasks)).toBe(expected);
  });
});

describe('setSubtaskStatus', () => {
  test('updates child and parent in the same transaction', async () => {
    const tx = {
      subtask: {
        findUnique: jest.fn().mockResolvedValue({ id: 'sub-1', taskId: 'task-1' }),
        update: jest.fn().mockResolvedValue({
          id: 'sub-1',
          taskId: 'task-1',
          status: 'COMPLETED'
        }),
        findMany: jest.fn().mockResolvedValue([
          { status: 'COMPLETED', duration: 25 },
          { status: 'COMPLETED', duration: 35 }
        ])
      },
      mainTask: {
        update: jest.fn().mockResolvedValue({
          id: 'task-1',
          status: 'COMPLETED',
          duration: 60
        })
      }
    };
    const prisma = {
      $transaction: jest.fn((operation) => operation(tx))
    };

    const result = await setSubtaskStatus(prisma, 'sub-1', 'COMPLETED');

    expect(tx.mainTask.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'COMPLETED', duration: 60 }
    });
    expect(result.updatedMainTask.status).toBe('COMPLETED');
  });
});
