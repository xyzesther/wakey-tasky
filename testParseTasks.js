const { parseTasks } = require('./api/src/utils/openai');
require('dotenv').config();
const testContent = "I have to go to a meeting for algorithms class this morning at 10am and then finish my homework for discrete math to be submitted tomorrow 3pm, and then I need to write a ticket for the adhd project to send today";
const currentDateTime = new Date().toISOString();

(async () => {
    try {
        const tasks = await parseTasks(testContent, currentDateTime);
        console.log("Parsed Tasks:", tasks);
    } catch (error) {
        console.error("Error during task parsing test:", error);
    }
})(); 