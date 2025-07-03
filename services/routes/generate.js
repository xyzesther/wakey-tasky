const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { getProvider } = require("../ai/registry"); // Adjust the path as necessary
// const requireAuth = require("../middleware/auth");

const prisma = new PrismaClient();

// Use the AI provider's taskParser
const taskParser = getProvider().taskParser;

router.post("/", async (req, res) => {
	const { prompt, userId } = req.body;

	if (!prompt || prompt.trim() === "") {
		return res.status(400).json({ error: "Prompt is required." });
	}

	if (!userId) {
		return res.status(400).json({ error: "User ID is required." });
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return res.status(404).json({ error: "User not found." });
		}

		// Use the AI parser through the new structure
		const currentDateTime = new Date().toISOString();
		const tasksFromAI = await taskParser(prompt, currentDateTime);

		if (!Array.isArray(tasksFromAI) || tasksFromAI.length === 0) {
			return res.status(500).json({ error: "AI failed to generate tasks." });
		}

		console.log("Received prompt:", prompt);
		console.log("Generated tasks:", tasksFromAI);

		// Save the tasks to DB
		const createdTasks = await Promise.all(
			tasksFromAI.map(async (t) => {
				return prisma.mainTask.create({
					data: {
						title: t.title,
						description: t.description || "",
						userId,
						status: "PENDING",
						subtasks: {
							create: t.subtasks?.map(sub => ({
								title: sub.title,
								description: sub.description || "",
								status: "PENDING",
							})) || [],
						},
					},
					include: {
						subtasks: true,
					},
				});
			})
		);

		res.status(201).json({ tasks: createdTasks });
	} catch (err) {
		console.error("Error generating tasks:", err);
		res.status(500).json({
			error: "Failed to generate tasks",
			details: err.message,
		});
	}
});

module.exports = router;
