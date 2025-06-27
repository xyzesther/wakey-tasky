const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { parseTasks } = require("../utils/openai"); // parseTasks
//const requireAuth = require("../middleware/auth");

const prisma = new PrismaClient();

router.post("/", async (req, res) => {
	const { prompt, userId } = req.body;

	// Check input
	if (!prompt || prompt.trim() === "") {
		return res.status(400).json({ error: "Prompt is required." });
	}

	if (!userId) {
		return res.status(400).json({ error: "User ID is required." });
	}

	try {
		// Get user
		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			return res.status(404).json({ error: "User not found." });
		}

		// Generate tasks using AI
		const currentDateTime = new Date().toISOString();
		const tasksFromAI = await parseTasks(prompt, currentDateTime);

		//  3. 检查返回格式
		if (!Array.isArray(tasksFromAI) || tasksFromAI.length === 0) {
			return res.status(500).json({ error: "AI failed to generate tasks." });
		}

		console.log("Received prompt:", prompt);
		console.log("Generated tasks:", tasksFromAI);

		// Create main tasks in database (without subtasks)
		const createdTasks = await Promise.all(
			tasksFromAI.map(async (t) => {
				// Create the main task
				return prisma.mainTask.create({
					data: {
						title: t.title,
						description: t.description || "",
						userId: userId,
						statusId: "PENDING",
					},
					include: {
						status: true,
					},
				});
			})
		);

		// Update user's task count flag if needed
		if (!user.hasAddedThreeMainTasks && createdTasks.length > 0) {
			const taskCount = await prisma.mainTask.count({
				where: { userId: userId },
			});

			if (taskCount >= 3) {
				await prisma.user.update({
					where: { id: userId },
					data: { hasAddedThreeMainTasks: true },
				});
			}
		}

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
