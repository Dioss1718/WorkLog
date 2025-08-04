// Import necessary libraries and models
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Middleware to protect routes
const ProductivityData = require('../models/ProductivityData'); // Productivity data model
const BlockedSiteList = require('../models/BlockedSiteList'); // Blocked sites model

// Helper function to extract the domain from a URL
function getDomain(url) {
  try {
    // Create a URL object to parse the URL string
    const urlObj = new URL(url);
    // Get the hostname and convert it to lowercase
    let hostname = urlObj.hostname.toLowerCase();
    // Remove the 'www.' prefix if it exists
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    // Return the clean domain name
    return hostname;
  } catch (e) {
    // Return null if the URL is invalid
    return null;
  }
}

// POST endpoint to sync user data (productivity and blocked sites)
router.post('/sync', protect, async (req, res) => {
  // Destructure the data from the request body
  const { websiteTime, blockedSites } = req.body;

  // Check if any data was provided
  if (!websiteTime && !blockedSites) {
    return res.status(400).json({ message: 'No data to sync provided.' });
  }

  try {
    // Get the user ID from the request object (added by the 'protect' middleware)
    const userId = req.user.id;

    // --- Handle productivity data sync ---
    if (websiteTime && typeof websiteTime === 'object') {
      // Loop through each date in the provided productivity data
      for (const date in websiteTime) {
        const dailyData = websiteTime[date];

        if (!dailyData || typeof dailyData !== 'object') continue;

        // Normalize the data by grouping time by domain
        const normalizedData = {};
        for (const site in dailyData) {
          const domain = getDomain(site);
          if (domain) {
            normalizedData[domain] = (normalizedData[domain] || 0) + dailyData[site];
          }
        }

        // Find existing productivity data for the user on that specific date
        let existingData = await ProductivityData.findOne({ user: userId, date });

        if (existingData) {
          // If data exists, update the existing document
          for (const domain in normalizedData) {
            // Add the new time to the existing time for each domain
            existingData.websiteTime.set(domain, (existingData.websiteTime.get(domain) || 0) + normalizedData[domain]);
          }
          await existingData.save();
        } else {
          // If no data exists, create a new document
          const newDailyData = new ProductivityData({
            user: userId,
            date,
            websiteTime: normalizedData
          });
          await newDailyData.save();
        }
      }
    }

    // --- Handle blocked sites list sync ---
    if (Array.isArray(blockedSites)) {
      // Normalize the list of blocked sites to just their domains
      const normalizedSites = blockedSites
        .map(getDomain)
        .filter(Boolean); // Remove any null values from invalid URLs

      // Find the user's existing blocked site list
      let existingBlockedList = await BlockedSiteList.findOne({ user: userId });

      if (existingBlockedList) {
        // If a list exists, combine the old and new sites and remove duplicates
        const combined = [...existingBlockedList.sites, ...normalizedSites];
        const uniqueSites = [...new Set(combined)]; // Create a new set to get unique values
        existingBlockedList.sites = uniqueSites;
        await existingBlockedList.save();
      } else {
        // If no list exists, create a new one with the provided sites
        const newBlockedList = new BlockedSiteList({
          user: userId,
          sites: [...new Set(normalizedSites)] // Ensure the initial list has unique sites
        });
        await newBlockedList.save();
      }
    }

    // Send a success response
    res.status(200).json({ message: 'Data synced successfully!' });

  } catch (error) {
    // Handle any server-side errors
    res.status(500).json({ message: 'Server error during data sync' });
  }
});

// GET endpoint to retrieve the user's blocked sites list
router.get('/blocked-sites', protect, async (req, res) => {
  try {
    // Find the blocked site list for the logged-in user
    const blockedList = await BlockedSiteList.findOne({ user: req.user.id });
    if (blockedList) {
      // If a list is found, return the array of sites
      res.json(blockedList.sites);
    } else {
      // If no list is found, return an empty array
      res.json([]);
    }
  } catch (error) {
    // Handle any server-side errors
    res.status(500).json({ message: 'Server error fetching blocked sites' });
  }
});

// Export the router
module.exports = router;