const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
	// Create a test user
	const user = await prisma.user.create({
		data: {}, // only need id field, auto-generated
	});
	console.log("Seeded user:", user.id);

	// Create a main task, and associate it with the user
	const mainTask = await prisma.mainTask.create({
		data: {
			title: "Test Main Task",
			duration: 75,
			status: "PENDING",
			user: {
				connect: { id: user.id },
			},
			subtasks: {
				create: [
					{
						title: "Subtask One",
						description: "The first subtask.",
						status: "PENDING",
						duration: 30,
					},
					{
						title: "Subtask Two",
						description: "The second subtask.",
						status: "PENDING",
						duration: 45,
					},
				],
			},
		},
		include: { subtasks: true },
	});
	console.log("Seeded main task:", mainTask.id);
	mainTask.subtasks.forEach((subtask) => {
		console.log("  Seeded subtask:", subtask.id);
	});
}

main()
	.catch((e) => {
		console.error("Seeding failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
