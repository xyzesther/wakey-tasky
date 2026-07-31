const OpenAI = require("openai");
require("dotenv").config();

let openai;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Missing OPENAI_API_KEY in environment variables.");
    error.code = "MISSING_OPENAI_API_KEY";
    throw error;
  }

  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openai;
}

async function chat(messages, options = {}) {
  try {
    const res = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages,
      ...options
    });
    const content = res.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("The model returned an empty response.");
    }
    return content;
  } catch (err) {
    if (err.code === "MISSING_OPENAI_API_KEY") {
      throw err;
    }
    throw new Error("OpenAI API call failed: " + err.message);
  }
}

module.exports = { chat };
