const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ProductivityData = require('../models/ProductivityData');

async function getDailyReport(userId, date, res) {
  try {
    const data = await ProductivityData.findOne({ user: userId, date });

    if (data) {
      const report = Object.fromEntries(data.websiteTime);
      res.json({ date, report });
    } else {
      res.status(404).json({ message: `No productivity data found for ${date}` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching daily report' });
  }
}

router.get('/daily/:date', protect, async (req, res) => {
  const userId = req.user.id;
  const date = req.params.date;
  await getDailyReport(userId, date, res);
});

router.get('/daily', protect, async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0, 10);
  await getDailyReport(userId, today, res);
});

router.get('/monthly/:year/:month', protect, async (req, res) => {
  const userId = req.user.id;
  const { year, month } = req.params;

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid year or month provided.' });
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  try {
    const monthlyData = await ProductivityData.find({
      user: userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const aggregatedReport = {};

    monthlyData.forEach(dayData => {
      dayData.websiteTime.forEach((time, domain) => {
        aggregatedReport[domain] = (aggregatedReport[domain] || 0) + time;
      });
    });

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      report: aggregatedReport,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching monthly report' });
  }
});

module.exports = router;