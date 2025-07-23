const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/user');

router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences');
    if (user) {
      res.json(user.preferences);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching preferences' });
  }
});

router.put('/preferences', protect, async (req, res) => {
  const { reportFrequency, notificationsEnabled } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (user) {
      if (reportFrequency) user.preferences.reportFrequency = reportFrequency;
      if (typeof notificationsEnabled === 'boolean') user.preferences.notificationsEnabled = notificationsEnabled;

      await user.save();
      res.json(user.preferences);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

module.exports = router;