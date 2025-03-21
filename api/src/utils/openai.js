// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();
const OpenAI = require("openai");
require('dotenv').config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Function to parse tasks from user input
const parseTasks = async (content, currentDateTime) => {
    const systemPrompt = `You are a task management assistant. Your job is to extract individual tasks from a user's input and format them for storage in a database.

    CRITICAL RULES:
    1. Identify each task clearly and concisely.
    2. Include any relevant details such as due time and duration.
    3. Format each task as a JSON object with fields: "title", "duration", "dueTime", and "priority" if applicable.

    Example input: "I have a lot of tasks today and I need to read 3 papers and attend a meeting all due today."
    Example output:
    [
      { "title": "Read paper 1", "duration": "30 min", "dueTime": "March 23", "priority": "high" }
    ]

    IMPORTANT:
    - Ensure each task is a complete and actionable item.
    - Use JSON format for output.
    - Consider the current date and time: ${currentDateTime}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Extract tasks from this input:\n\n${content}`
                }
            ],
            temperature: 0.3
        });

        // Log the raw response content
        //console.log("Raw Response:", response.choices[0].message.content);

        // Remove markdown code block delimiters
        const rawContent = response.choices[0].message.content;
        const jsonContent = rawContent.replace(/```json|```/g, '').trim();

        const tasks = JSON.parse(jsonContent);
        //console.log("Parsed Tasks:", tasks);
        return tasks;

    } catch (error) {
        console.error("Error parsing tasks:", error);
        return [];
    }
};

// Export OpenAI functions
module.exports = {
	parseTasks
};
