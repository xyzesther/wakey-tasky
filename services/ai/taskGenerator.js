const { chat } = require('./models/openai');
const { getTaskPrompt } = require('./prompts/task');
const { parseAndValidateTasks } = require('./taskParser');

function getRepairPrompt(rawResponse, validationError) {
  return [
    {
      role: 'system',
      content:
        'Repair the supplied task data. Return only a JSON object with a non-empty "tasks" array. ' +
        'Every task and subtask needs a non-empty title and a valid status. ' +
        'Subtask duration must be an integer from 1 to 120 minutes.'
    },
    {
      role: 'user',
      content:
        `Validation error: ${validationError.message}\n\n` +
        `Invalid output:\n${String(rawResponse).slice(0, 20000)}`
    }
  ];
}

async function generateTasksFromText(userText, currentDateTime = new Date().toISOString()) {
  const options = { response_format: { type: 'json_object' } };
  const firstResponse = await chat(getTaskPrompt(userText, currentDateTime), options);

  try {
    return parseAndValidateTasks(firstResponse);
  } catch (firstError) {
    const repairedResponse = await chat(
      getRepairPrompt(firstResponse, firstError),
      { ...options, temperature: 0 }
    );
    return parseAndValidateTasks(repairedResponse);
  }
}

module.exports = { generateTasksFromText };
