const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { logWorkout, getWorkoutStreak, getWeeklyCalories } = require("../controllers/workoutController");

router.post("/log", protect, logWorkout);
router.get("/streak", protect, getWorkoutStreak);
router.get("/weekly-calories", protect, getWeeklyCalories);

module.exports = router;