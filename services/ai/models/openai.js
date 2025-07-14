const OpenAI = require("openai");
require("dotenv").config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chat(messages, options = {}) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages,
      ...options
    });
    return res.choices[0].message.content;
  } catch (err) {
    throw new Error("OpenAI API call failed: " + err.message);
  }
}

module.exports = { chat };