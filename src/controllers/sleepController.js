const Sleep = require("../models/Sleep");

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// ─────────────────────────────────────────
// POST /api/sleep  &  POST /api/sleep/log
// ─────────────────────────────────────────
const logSleep = async (req, res) => {
  try {
    const { sleepHours } = req.body;

    if (!sleepHours) {
      return res.status(400).json({ message: "Sleep hours required" });
    }

    const parsed = parseFloat(sleepHours);
    if (isNaN(parsed) || parsed < 0 || parsed > 24) {
      return res
        .status(400)
        .json({ message: "sleepHours must be a number between 0 and 24" });
    }

    const today = new Date();

    // NOTE: req.user._id is used because protect middleware
    // attaches the full user object (not just the id) to req.user
    let sleepEntry = await Sleep.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay(today), $lte: endOfDay(today) },
    });

    if (!sleepEntry) {
      sleepEntry = await Sleep.create({
        userId: req.user._id,
        date: startOfDay(today),
        sleepHours: parsed,
      });
    } else {
      sleepEntry.sleepHours = parsed;
      await sleepEntry.save();
    }

    res.status(200).json(sleepEntry);
  } catch (error) {
    console.error("logSleep error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET /api/sleep/today
// ─────────────────────────────────────────
const getTodaySleep = async (req, res) => {
  try {
    const today = new Date();

    const sleepEntry = await Sleep.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay(today), $lte: endOfDay(today) },
    });

    res.status(200).json(sleepEntry || null);
  } catch (error) {
    console.error("getTodaySleep error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET /api/sleep/history?range=week|month|all
// ─────────────────────────────────────────
const getSleepHistory = async (req, res) => {
  try {
    const { range = "week" } = req.query;

    let daysBack;
    if (range === "week") daysBack = 7;
    else if (range === "month") daysBack = 28;
    else daysBack = null; // "all" — no date filter

    const query = { userId: req.user._id };

    if (daysBack) {
      const from = new Date();
      from.setDate(from.getDate() - (daysBack - 1));
      query.date = { $gte: startOfDay(from) };
    }

    const records = await Sleep.find(query).sort({ date: 1 });

    const DAILY_TARGET = 8;

    const history = records.map((r) => {
      const sleepHours = r.sleepHours;
      const debt = Math.max(0, DAILY_TARGET - sleepHours);
      const dateKey = r.date.toISOString().split("T")[0];
      return { date: dateKey, sleepHours, debt };
    });

    const totalSleep = history.reduce((sum, r) => sum + r.sleepHours, 0);
    const totalDebt = history.reduce((sum, r) => sum + r.debt, 0);
    const avgSleep = history.length ? totalSleep / history.length : 0;

    return res.status(200).json({
      range,
      history,
      stats: {
        avgSleep: parseFloat(avgSleep.toFixed(2)),
        totalDebt: parseFloat(totalDebt.toFixed(2)),
        daysLogged: history.length,
      },
    });
  } catch (error) {
    console.error("getSleepHistory error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET /api/sleep/overall
// ─────────────────────────────────────────
const getOverallSleepStats = async (req, res) => {
  try {
    const DAILY_TARGET = 8;

    const records = await Sleep.find({ userId: req.user._id }).sort({
      date: 1,
    });

    const history = records.map((r) => {
      const sleepHours = r.sleepHours;
      const debt = Math.max(0, DAILY_TARGET - sleepHours);
      const dateKey = r.date.toISOString().split("T")[0];
      return { date: dateKey, sleepHours, debt };
    });

    const totalSleep = history.reduce((sum, r) => sum + r.sleepHours, 0);
    const totalDebt = history.reduce((sum, r) => sum + r.debt, 0);
    const avgSleep = history.length ? totalSleep / history.length : 0;

    return res.status(200).json({
      daysLogged: history.length,
      avgSleep: parseFloat(avgSleep.toFixed(2)),
      totalDebt: parseFloat(totalDebt.toFixed(2)),
      recentHistory: history.slice(-5).reverse(), // last 5, newest first
    });
  } catch (error) {
    console.error("getOverallSleepStats error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  logSleep,
  getTodaySleep,
  getSleepHistory,
  getOverallSleepStats,
};