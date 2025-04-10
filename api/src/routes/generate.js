const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { generateSubtasksWithAI } = require("../../utils/openai");
const requireAuth = require("../../middleware/auth");

const prisma = new PrismaClient();
//检查参数是否提供
router.post("/", requireAuth, async (req, res) => {
	const { prompt } = req.body;
	if (!prompt || prompt.trim() === "") {
		return res.status(400).json({ error: "Prompt is required." });
	}
	//计算总时间,调用 AI 生成子任务
	try {
		const subtasks = await generateSubtasksWithAI(prompt);
		const totalTime = subtasks.reduce((sum, s) => sum + s.estimatedTime, 0);
		//建任务并存进数据库
		const task = await prisma.mainTask.create({
			data: {
				title: prompt,
				userId: req.user.id,
				subtasks: {
					create: subtasks.map((s) => ({
						title: s.name,
						description: s.description || "",
						estimatedTime: s.estimatedTime || 30,
					})),
				},
			},
			include: {
				subtasks: true,
			},
		});

		res.status(201).json({ task });
	} catch (err) {
		res
			.status(500)
			.json({ error: "Failed to generate task", details: err.message });
	}
});

module.exports = router;
