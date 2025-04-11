require("dotenv").config();
const express = require("express");
const request = require("supertest");
const generateRouter = require("../api/src/routes/generate"); // 路径根据实际情况调整

// 创建一个 Express app，并挂载你的 router
const app = express();
app.use(express.json()); // 确保使用 JSON 解析中间件
app.use("/api/generate", generateRouter);

const prompt =
	"I have to go to a meeting for algorithms class this morning at 10am and then finish my homework for discrete math to be submitted tomorrow 3pm, and then I need to write a ticket for the adhd project to send today";

describe("POST /api/generate", () => {
	it("should generate main  tasks based on the prompt", async () => {
		const response = await request(app).post("/api/generate").send({ prompt });

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("main tasks");
	});

	it("should return a 400 error if prompt is missing", async () => {
		const response = await request(app).post("/api/generate").send({}); // Sending an empty body

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error", "Prompt is required.");
	});
});
