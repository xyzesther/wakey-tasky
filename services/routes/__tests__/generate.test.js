const request = require("supertest");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const generateRouter = require("../generate");

const app = express();
app.use(express.json());
app.use("/api/generate", generateRouter);

const prisma = new PrismaClient();

describe("POST /api/generate", () => {
	let testUser;

	beforeAll(async () => {
		// Create a test user
		testUser = await prisma.user.create({
			data: {
				hasAddedThreeMainTasks: false,
			},
		});
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
	});

	it("should create main tasks without subtasks", async () => {
		const response = await request(app).post("/api/generate").send({
			prompt: "Create a test task",
			userId: testUser.id,
		});

		expect(response.status).toBe(201);
		expect(response.body.tasks).toBeDefined();
		expect(Array.isArray(response.body.tasks)).toBe(true);
		expect(response.body.tasks.length).toBeGreaterThan(0);

		// Verify task structure
		const task = response.body.tasks[0];
		expect(task).toHaveProperty("title");
		expect(task).toHaveProperty("description");
		expect(task).toHaveProperty("userId", testUser.id);
		expect(task).toHaveProperty("statusId", "PENDING");
		expect(task).toHaveProperty("status");
	});

	it("should return 400 if prompt is missing", async () => {
		const response = await request(app).post("/api/generate").send({
			userId: testUser.id,
		});

		expect(response.status).toBe(400);
		expect(response.body.error).toBe("Prompt is required.");
	});

	it("should return 400 if userId is missing", async () => {
		const response = await request(app).post("/api/generate").send({
			prompt: "Create a test task",
		});

		expect(response.status).toBe(400);
		expect(response.body.error).toBe("User ID is required.");
	});

	it("should return 404 if user does not exist", async () => {
		const response = await request(app).post("/api/generate").send({
			prompt: "Create a test task",
			userId: "non-existent-id",
		});

		expect(response.status).toBe(404);
		expect(response.body.error).toBe("User not found.");
	});
});
