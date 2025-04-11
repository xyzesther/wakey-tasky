require("dotenv").config();
const express = require("express");
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const generateRouter = require("../api/src/routes/generate"); // 路径根据实际情况调整

// 创建一个 Express app，并挂载你的 router
const app = express();
app.use(express.json()); // 确保使用 JSON 解析中间件
app.use("/api/generate", generateRouter);

const prisma = new PrismaClient();
let testUser;

const prompt =
	"I have to go to a meeting for algorithms class this morning at 10am and then finish my homework for discrete math to be submitted tomorrow 3pm, and then I need to write a ticket for the adhd project to send today";

describe("POST /api/generate", () => {
	beforeAll(async () => {
		// Create a test user
		testUser = await prisma.user.create({
			data: {
				hasAddedThreeMainTasks: false,
			},
		});
		console.log("Created test user with ID:", testUser.id);
	});

	afterAll(async () => {
		// Clean up test data
		await prisma.mainTask.deleteMany({
			where: { userId: testUser.id },
		});
		await prisma.user.delete({
			where: { id: testUser.id },
		});
		await prisma.$disconnect();
		console.log("Cleaned up test data");
	});

	it("should generate main tasks based on the prompt", async () => {
		const response = await request(app).post("/api/generate").send({
			prompt,
			userId: testUser.id,
		});

		expect(response.status).toBe(201);
		expect(response.body).toHaveProperty("tasks");
		expect(Array.isArray(response.body.tasks)).toBe(true);
		console.log("Generated tasks:", response.body.tasks);
	});

	it("should return a 400 error if prompt is missing", async () => {
		const response = await request(app).post("/api/generate").send({
			userId: testUser.id,
		});

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error", "Prompt is required.");
	});

	it("should return a 400 error if userId is missing", async () => {
		const response = await request(app).post("/api/generate").send({
			prompt,
		});

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty("error", "User ID is required.");
	});
});
