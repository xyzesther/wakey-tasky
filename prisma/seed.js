const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
	// 创建一个测试用户
	const user = await prisma.user.create({
		data: {}, // 只需要 id 字段，自动生成
	});
	console.log("Seeded user:", user.id);

	// 创建一个主任务，并为该用户关联
	const mainTask = await prisma.mainTask.create({
		data: {
			title: "测试主任务",
			description: "这是一个用于测试的主任务。",
			status: "PENDING",
			user: {
				connect: { id: user.id },
			},
			subtasks: {
				create: [
					{
						title: "子任务一",
						description: "第一个子任务。",
						status: "PENDING",
					},
					{
						title: "子任务二",
						description: "第二个子任务。",
						status: "PENDING",
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
