const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { parseTasks } = require("../../utils/openai"); // parseTasks
const requireAuth = require("../../middleware/auth");

const prisma = new PrismaClient();

router.post("/", requireAuth, async (req, res) => {
	const { prompt } = req.body;

	// ✅ 1. 检查输入
	if (!prompt || prompt.trim() === "") {
		return res.status(400).json({ error: "Prompt is required." });
	}

	try {
		//  2. 调用 AI 拆成多个“主任务”
		const currentDateTime = new Date().toISOString();
		const tasksFromAI = await parseTasks(prompt, currentDateTime);

		//  3. 检查返回格式
		if (!Array.isArray(tasksFromAI) || tasksFromAI.length === 0) {
			return res.status(500).json({ error: "AI failed to generate tasks." });
		}

		// 4. 存入数据库，每个任务是 mainTask
		const createdTasks = await Promise.all(
			tasksFromAI.map((t) =>
				prisma.mainTask.create({
					data: {
						title: t.title,
						description: t.description || "",
						userId: req.user.id,
					},
				})
			)
		);

		//5. 返回创建成功的所有任务
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
