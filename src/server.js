const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const taskApi = require("../services/routes/taskRoutes"); 
const generateRoutes = require("../services/routes/generate"); // Adjust the path as necessary
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Test database connection before starting the server
async function testDatabaseConnection() {
	try {
		// Simple query to test the connection
		await prisma.$queryRaw`SELECT 1`;
		console.log("Database connection successful");
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// API Routes
app.use("/api", taskApi);
app.use("/api/generate", generateRoutes); // Add the new route here

// Start server with database check
async function startServer() {
	const dbConnected = await testDatabaseConnection();

	if (!dbConnected) {
		console.error("Server not started due to database connection failure");
		process.exit(1);
	}

	const server = app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});

	// Clean up connections on server close
	server.on("close", async () => {
		await prisma.$disconnect();
		console.log("Database connection closed");
	});

	return server;
}

// Handle the promise
startServer()
	.then((server) => {
		// Export the server for potential use in main.js
		module.exports = server;
	})
	.catch((error) => {
		console.error("Failed to start server:", error);
		process.exit(1);
	});
