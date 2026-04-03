const express = require("express");
const router = express.Router();
const {
  logSleep,
  getTodaySleep,
  getSleepHistory,
  getOverallSleepStats,
} = require("../controllers/sleepController");

const protect = require("../middleware/authMiddleware");

// Log or update today's sleep
router.post("/", protect, logSleep);
router.post("/log", protect, logSleep);

// Get today's sleep entry (null if not logged)
router.get("/today", protect, getTodaySleep);

// Get sleep history: ?range=week | month | all
router.get("/history", protect, getSleepHistory);

// Get all-time overall sleep stats
router.get("/overall", protect, getOverallSleepStats);

module.exports = router;