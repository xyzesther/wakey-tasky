const { chat } = require("../services/ai/models/openai"); // this is the path to the openai model

(async () => {
  try {
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Say hello to me!" }
    ];

    const response = await chat(messages);
    console.log("✅ OpenAI API call successful!");
    console.log("Response:", response);
  } catch (err) {
    console.error("❌ OpenAI API call failed:", err.message);
  }
})();
