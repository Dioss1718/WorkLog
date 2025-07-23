const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ProductivityData = require('../models/ProductivityData');
const BlockedSiteList = require('../models/BlockedSiteList');

function getDomain(url) {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch (e) {
    return null;
  }
}

router.post('/sync', protect, async (req, res) => {
  const { websiteTime, blockedSites } = req.body;

  if (!websiteTime && !blockedSites) {
    return res.status(400).json({ message: 'No data to sync provided.' });
  }

  try {
    const userId = req.user.id;

    if (websiteTime && typeof websiteTime === 'object') {
      for (const date in websiteTime) {
        const dailyData = websiteTime[date];

        if (!dailyData || typeof dailyData !== 'object') continue;

        const normalizedData = {};
        for (const site in dailyData) {
          const domain = getDomain(site);
          if (domain) {
            normalizedData[domain] = (normalizedData[domain] || 0) + dailyData[site];
          }
        }

        let existingData = await ProductivityData.findOne({ user: userId, date });

        if (existingData) {
          for (const domain in normalizedData) {
            existingData.websiteTime.set(domain, (existingData.websiteTime.get(domain) || 0) + normalizedData[domain]);
          }
          await existingData.save();
        } else {
          const newDailyData = new ProductivityData({
            user: userId,
            date,
            websiteTime: normalizedData
          });
          await newDailyData.save();
        }
      }
    }

    if (Array.isArray(blockedSites)) {
      const normalizedSites = blockedSites
        .map(getDomain)
        .filter(Boolean);

      let existingBlockedList = await BlockedSiteList.findOne({ user: userId });

      if (existingBlockedList) {
        const combined = [...existingBlockedList.sites, ...normalizedSites];
        const uniqueSites = [...new Set(combined)];
        existingBlockedList.sites = uniqueSites;
        await existingBlockedList.save();
      } else {
        const newBlockedList = new BlockedSiteList({
          user: userId,
          sites: [...new Set(normalizedSites)]
        });
        await newBlockedList.save();
      }
    }

    res.status(200).json({ message: 'Data synced successfully!' });

  } catch (error) {
    res.status(500).json({ message: 'Server error during data sync' });
  }
});

router.get('/blocked-sites', protect, async (req, res) => {
  try {
    const blockedList = await BlockedSiteList.findOne({ user: req.user.id });
    if (blockedList) {
      res.json(blockedList.sites);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching blocked sites' });
  }
});

module.exports = router;