const VALID_STATUSES = new Set([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]);

class TaskValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TaskValidationError';
  }
}

function parseJson(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new TaskValidationError('AI response is empty');
  }

  const withoutFence = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  try {
    return JSON.parse(withoutFence);
  } catch (error) {
    throw new TaskValidationError(`AI response is not valid JSON: ${error.message}`);
  }
}

function readTitle(value, path) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TaskValidationError(`${path}.title must be a non-empty string`);
  }

  const title = value.trim();
  if (title.length > 120) {
    throw new TaskValidationError(`${path}.title is longer than 120 characters`);
  }
  return title;
}

function readStatus(value, path) {
  const status = value == null ? 'PENDING' : value;
  if (typeof status !== 'string' || !VALID_STATUSES.has(status)) {
    throw new TaskValidationError(`${path}.status is invalid`);
  }
  return status;
}

function readDuration(value, path, max) {
  const duration = Number(value);
  if (!Number.isInteger(duration) || duration < 1 || duration > max) {
    throw new TaskValidationError(
      `${path}.duration must be an integer between 1 and ${max}`
    );
  }
  return duration;
}

function validateSubtask(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TaskValidationError(`${path} must be an object`);
  }

  return {
    title: readTitle(value.title, path),
    description:
      typeof value.description === 'string'
        ? value.description.trim().slice(0, 500) || null
        : null,
    status: readStatus(value.status, path),
    duration: readDuration(value.duration, path, 120)
  };
}

function validateTask(value, index) {
  const path = `tasks[${index}]`;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TaskValidationError(`${path} must be an object`);
  }

  if (value.subtasks != null && !Array.isArray(value.subtasks)) {
    throw new TaskValidationError(`${path}.subtasks must be an array`);
  }

  const subtasks = (value.subtasks || []).map((subtask, subtaskIndex) =>
    validateSubtask(subtask, `${path}.subtasks[${subtaskIndex}]`)
  );
  const duration = subtasks.length
    ? subtasks.reduce((total, subtask) => total + subtask.duration, 0)
    : readDuration(value.duration ?? 5, path, 720);

  return {
    title: readTitle(value.title, path),
    status: readStatus(value.status, path),
    duration,
    subtasks
  };
}

function parseAndValidateTasks(raw) {
  const parsed = parseJson(raw);
  const tasks = Array.isArray(parsed) ? parsed : parsed?.tasks;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new TaskValidationError('AI response must contain a non-empty tasks array');
  }
  if (tasks.length > 20) {
    throw new TaskValidationError('AI response contains more than 20 tasks');
  }

  return tasks.map(validateTask);
}

module.exports = {
  TaskValidationError,
  parseAndValidateTasks
};
