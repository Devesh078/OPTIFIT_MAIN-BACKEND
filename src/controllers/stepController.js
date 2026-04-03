const StepLog = require("../models/StepLog");

// ✅ Log / Update today's steps
const logSteps = async (req, res) => {
  try {
    const { steps } = req.body;

    if (!steps && steps !== 0) {
      return res.status(400).json({ message: "Steps required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let log = await StepLog.findOne({
      userId: req.user._id, // ✅ FIXED
      date: today,
    });

    if (!log) {
      log = await StepLog.create({
        userId: req.user._id,
        date: today,
        steps,
      });
    } else {
      log.steps = steps; // overwrite with total steps
      await log.save();
    }

    res.json(log);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get today's summary
const getStepSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await StepLog.findOne({
      userId: req.user._id,
      date: today,
    });

    const steps = log ? log.steps : 0;

    const calories = Math.floor(steps * 0.04);
    const goal = 10000;

    res.json({
      steps,
      goal,
      remaining: Math.max(goal - steps, 0),
      caloriesBurned: calories,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ NEW: Weekly steps (for chart)
const getWeeklySteps = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Days.push(new Date(d));
    }

    const data = await Promise.all(
      last7Days.map(async (date) => {
        const log = await StepLog.findOne({
          userId: req.user._id,
          date,
        });

        return log ? log.steps : 0;
      })
    );

    res.json({
      weeklySteps: data,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  logSteps,
  getStepSummary,
  getWeeklySteps, // ✅ export
};