const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const taskApi = require('../services/routes/taskRoutes');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
let httpServer = null;

app.use(cors());
app.use(bodyParser.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api', taskApi);

async function startServer() {
  if (httpServer) {
    return httpServer;
  }

  await prisma.$queryRaw`SELECT 1`;
  const port = Number(process.env.PORT) || 3000;

  httpServer = await new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      resolve(server);
    });
    server.once('error', reject);
  });

  return httpServer;
}

async function stopServer() {
  if (httpServer) {
    const server = httpServer;
    httpServer = null;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await prisma.$disconnect();
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer, stopServer };
