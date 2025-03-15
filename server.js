const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const taskApi = require('./api/taskApi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API Routes
app.use('/api', taskApi);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the server for potential use in main.js
module.exports = server; 