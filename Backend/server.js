// Load environment variables from a .env file
const dotenv = require('dotenv');
require('dotenv').config({ path: './backend/.env' });
// Import the function to connect to the database
const connectDB = require('./config/db');
// Import the CORS middleware
const cors = require('cors');
// Import the Express framework
const express = require('express');

// Configure environment variables
dotenv.config();

// Connect to the database
connectDB();

// Initialize the Express application
const app = express();

// Middleware to parse JSON bodies from requests
app.use(express.json());
// Enable CORS for all routes
app.use(cors());

// Import route handlers
const authRoutes = require('./routes/auth'); // For user authentication
const userRoutes = require('./routes/user'); // For user-related actions
const dataRoutes = require('./routes/data'); // For syncing and fetching data
const reportRoutes = require('./routes/reports'); // For generating productivity reports

// Mount the route handlers to their respective paths
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/reports', reportRoutes);

// Define a simple root route to confirm the API is running
app.get('/', (req, res) => {
  res.send('Productivity Tracker API is running...');
});

// Set the port for the server, using the environment variable or defaulting to 5000
const PORT = process.env.PORT || 5000;

// Start the server and listen for incoming requests
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));