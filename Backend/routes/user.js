// Import necessary libraries and models
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Middleware to protect routes
const User = require('../models/user'); // User model

// GET endpoint to retrieve user preferences
router.get('/preferences', protect, async (req, res) => {
  try {
    // Find the user by ID and select only the 'preferences' field
    const user = await User.findById(req.user.id).select('preferences');
    
    if (user) {
      // If the user is found, send back their preferences
      res.json(user.preferences);
    } else {
      // If no user is found with the given ID
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    // Handle any server-side errors
    res.status(500).json({ message: 'Server error fetching preferences' });
  }
});

// PUT endpoint to update user preferences
router.put('/preferences', protect, async (req, res) => {
  // Destructure the preference fields from the request body
  const { reportFrequency, notificationsEnabled } = req.body;

  try {
    // Find the user by their ID
    const user = await User.findById(req.user.id);

    if (user) {
      // Update the report frequency if it's provided in the request body
      if (reportFrequency) user.preferences.reportFrequency = reportFrequency;
      
      // Update the notifications enabled status if it's a boolean value
      if (typeof notificationsEnabled === 'boolean') user.preferences.notificationsEnabled = notificationsEnabled;

      // Save the updated user document to the database
      await user.save();
      
      // Send back the updated preferences
      res.json(user.preferences);
    } else {
      // If no user is found with the given ID
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    // Handle any server-side errors
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

// Export the router
module.exports = router;