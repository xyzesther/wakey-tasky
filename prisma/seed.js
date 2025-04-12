const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
	// Create default statuses
	const statuses = [
		{ id: "PENDING", name: "Pending" },
		{ id: "IN_PROGRESS", name: "In Progress" },
		{ id: "COMPLETED", name: "Completed" },
		{ id: "CANCELLED", name: "Cancelled" },
	];

	console.log("Seeding default statuses...");

	for (const status of statuses) {
		await prisma.status.upsert({
			where: { id: status.id },
			update: {},
			create: status,
		});
	}

	console.log("Seeding completed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
