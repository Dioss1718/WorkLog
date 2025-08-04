// Import necessary libraries and models
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Middleware to protect routes
const ProductivityData = require('../models/ProductivityData'); // Productivity data model

// Helper function to fetch and send a daily productivity report
async function getDailyReport(userId, date, res) {
  try {
    // Find productivity data for a specific user and date
    const data = await ProductivityData.findOne({ user: userId, date });

    if (data) {
      // If data is found, convert the Mongoose Map to a plain object
      const report = Object.fromEntries(data.websiteTime);
      // Send the date and the report as a JSON response
      res.json({ date, report });
    } else {
      // If no data is found, send a 404 Not Found response
      res.status(404).json({ message: `No productivity data found for ${date}` });
    }
  } catch (error) {
    // Handle any server-side errors
    res.status(500).json({ message: 'Server error fetching daily report' });
  }
}

// GET endpoint to retrieve a daily report for a specific date
router.get('/daily/:date', protect, async (req, res) => {
  // Get the user ID from the protected route
  const userId = req.user.id;
  // Get the date from the URL parameters
  const date = req.params.date;
  // Use the helper function to fetch and send the report
  await getDailyReport(userId, date, res);
});

// GET endpoint to retrieve a daily report for the current day
router.get('/daily', protect, async (req, res) => {
  // Get the user ID from the protected route
  const userId = req.user.id;
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().slice(0, 10);
  // Use the helper function to fetch and send the report for today
  await getDailyReport(userId, today, res);
});

// GET endpoint to retrieve a monthly report for a specific year and month
router.get('/monthly/:year/:month', protect, async (req, res) => {
  // Get the user ID from the protected route
  const userId = req.user.id;
  // Get the year and month from the URL parameters
  const { year, month } = req.params;

  // Validate the year and month parameters
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid year or month provided.' });
  }

  // Define the start and end dates for the given month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  try {
    // Find all productivity data documents for the user within the specified date range
    const monthlyData = await ProductivityData.find({
      user: userId,
      createdAt: {
        $gte: startDate, // Greater than or equal to the start date
        $lte: endDate, // Less than or equal to the end date
      },
    });

    // Aggregate the data by summing up the time spent on each website
    const aggregatedReport = {};
    monthlyData.forEach(dayData => {
      dayData.websiteTime.forEach((time, domain) => {
        // Add the time spent on the current domain to the total
        aggregatedReport[domain] = (aggregatedReport[domain] || 0) + time;
      });
    });

    // Send the aggregated monthly report as a JSON response
    res.json({
      year: parseInt(year),
      month: parseInt(month),
      report: aggregatedReport,
    });
  } catch (error) {
    // Handle any server-side errors
    res.status(500).json({ message: 'Server error fetching monthly report' });
  }
});

// Export the router
module.exports = router;