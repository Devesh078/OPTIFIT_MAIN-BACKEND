const express = require("express");
const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const {
  getTodayCoach,
  chatWithCoach,
  getChatHistory,
  getCoachSummary
} =
require("../controllers/coachController");

router.get(
  "/",
  authMiddleware,
  getTodayCoach
);

router.get(
  "/history",
  authMiddleware,
  getChatHistory
);

router.get(
  "/summary",
  authMiddleware,
  getCoachSummary
);

router.post(
  "/chat",
  authMiddleware,
  chatWithCoach
);

module.exports = router;    