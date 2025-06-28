const { chat } = require("./models/openai");
const { getTaskPrompt } = require("./prompts/task");

async function parseTasks(userText, currentDateTime) {
  const messages = getTaskPrompt(userText, currentDateTime);

  try {
    const raw = await chat(messages);
    const json = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(json);
  } catch (err) {
    console.error("AI parsing failed:", err);
    return [];
  }
}

module.exports = {
  getProvider: () => ({ taskParser: parseTasks })
};