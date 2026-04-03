const Workout = require("../models/Workout");
const { calculateCaloriesBurned } = require("../services/workoutService");

const logWorkout = async (req, res) => {
  try {
    const { type, duration, intensity } = req.body;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const caloriesBurned = calculateCaloriesBurned(type, intensity, duration);

    const workout = await Workout.create({
      userId: req.user,
      date: start,
      type,
      duration,
      intensity,
      caloriesBurned,
    });

    res.status(201).json(workout);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ NEW: Get workout streak
const getWorkoutStreak = async (req, res) => {
  try {
    const userId = req.user._id;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check backwards from today
    for (let i = 0; i < 365; i++) {
      const start = new Date(today);
      start.setDate(today.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const workout = await Workout.findOne({
        userId,
        date: { $gte: start, $lte: end },
      });

      if (workout) {
        streak++;
      } else if (i > 0) {
        // Allow today to have no workout yet
        break;
      }
    }

    res.json({ streak });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ NEW: Get weekly calories burned
const getWeeklyCalories = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const workouts = await Workout.find({
        userId,
        date: { $gte: start, $lte: end },
      });

      let total = 0;
      workouts.forEach((w) => { total += w.caloriesBurned || 0; });
      result.push(total);
    }

    res.json({ weeklyCalories: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { logWorkout, getWorkoutStreak, getWeeklyCalories };