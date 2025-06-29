const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
	console.log("Seeding default statuses...");

	const statuses = [
		{ id: "PENDING", name: "Pending" },
		{ id: "IN_PROGRESS", name: "In Progress" },
		{ id: "COMPLETED", name: "Completed" },
		{ id: "CANCELLED", name: "Cancelled" },
	];

	for (const status of statuses) {
		try {
			await prisma.status.upsert({
				where: { id: status.id },
				update: {},
				create: status,
			});
			console.log(`Seeded status: ${status.id}`);
		} catch (error) {
			console.error(`Failed to seed status: ${status.id}`, error);
		}
	}

	console.log("Seeding completed.");
}

main()
	.catch((e) => {
		console.error("Seeding failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
