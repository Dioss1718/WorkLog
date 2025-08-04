// Import necessary libraries
const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Import the User model
const jwt = require('jsonwebtoken'); // Used for creating JSON Web Tokens
require('dotenv').config(); // Load environment variables from a .env file

// Helper function to generate a JWT token
const generateToken = (id) => {
  // Sign a new token with the user's ID, a secret key, and an expiration time
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // The token will expire in 30 days
  });
};

// POST endpoint for user registration
router.post('/register', async (req, res) => {
  // Destructure username, email, and password from the request body
  const { username, email, password } = req.body;

  // Check if all required fields are present
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check if a user with the given email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user with the provided data
    user = await User.create({ username, email, password });

    // If the user was created successfully, send a success response
    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id), // Generate and return a token
      });
    } else {
      // If the user creation failed for some reason
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    // Handle any server-side errors
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST endpoint for user login
router.post('/login', async (req, res) => {
  // Destructure email and password from the request body
  const { email, password } = req.body;

  // Check if all required fields are present
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Find a user by their email
    const user = await User.findOne({ email });

    // Check if the user exists and if the provided password matches the stored password
    if (user && (await user.matchPassword(password))) {
      // If credentials are valid, send a success response with user data and a token
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id), // Generate and return a token
      });
    } else {
      // If the user doesn't exist or the password is incorrect
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    // Handle any server-side errors
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Export the router to be used in the main application file
module.exports = router;