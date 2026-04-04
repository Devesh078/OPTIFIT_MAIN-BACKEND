const Water = require("../models/WaterLog");
const calculateWaterGoal = require("../utils/waterCalculator");

// Helper: today's date (start of day)
const getToday = () => {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  ist.setHours(0, 0, 0, 0);
  return ist;
};

// ==========================
// GET TODAY WATER
// ==========================
exports.getTodayWater = async (req, res) => {
  try {
    const today = getToday();

    let water = await Water.findOne({
      userId: req.user._id,
      date: today
    });

    if (!water) {
      water = await Water.create({
        userId: req.user._id,
        date: today
      });
    }

    const goal = calculateWaterGoal(req.user);

    res.json({
      goal,
      totalWater: water.totalWater,
      logs: water.logs,
      reminderInterval: water.reminderInterval
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// ADD WATER
// ==========================
exports.addWater = async (req, res) => {
  try {
    const { amount } = req.body;
    const today = getToday();

    let water = await Water.findOne({
      userId: req.user._id,
      date: today
    });

    if (!water) {
      water = await Water.create({
        userId: req.user._id,
        date: today
      });
    }

    const newLog = {
      amount,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata"  // ✅ IST timezone
      })
    };

    water.totalWater += amount;
    water.logs.unshift(newLog);

    await water.save();

    res.json({
      totalWater: water.totalWater,
      logs: water.logs
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// SET REMINDER
// ==========================
exports.setReminder = async (req, res) => {
  try {
    const { interval } = req.body;
    const today = getToday();

    let water = await Water.findOne({
      userId: req.user._id,
      date: today
    });

    if (!water) {
      water = await Water.create({
        userId: req.user._id,
        date: today
      });
    }

    water.reminderInterval = interval;
    await water.save();

    res.json({ reminderInterval: water.reminderInterval });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};