const Recovery = require("../models/Recovery");
const Sleep = require("../models/Sleep");
const FoodLog = require("../models/FoodLog");
const StepLog = require("../models/StepLog");
const User = require("../models/User");
const { calculateSleepDebt } = require("../services/sleepService");
const { calculateRecoveryScore } = require("../services/recoveryService");
const { calculateProteinTarget } = require("../services/calorieService");
const { DEFAULT_STEP_GOAL } = require("../services/stepService");

const generateRecoveryScore = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const userId = req.user._id;

    // ✅ Sleep
    const sleepLog = await Sleep.findOne({
      userId,
      date: { $gte: start, $lte: end }
    });
    const sleepHours = sleepLog ? sleepLog.sleepHours : 0;
    const sleepDebt = await calculateSleepDebt(userId);

    // ✅ Protein
    const user = await User.findById(userId);
    const proteinTarget = calculateProteinTarget(user, sleepHours);
    const foodLogs = await FoodLog.find({
      userId,
      date: { $gte: start, $lte: end }
    });
    let consumedProtein = 0;
    foodLogs.forEach(f => { consumedProtein += f.protein || 0; });
    const proteinPercent = proteinTarget > 0
      ? (consumedProtein / proteinTarget) * 100
      : 0;

    // ✅ Steps
    const stepLog = await StepLog.findOne({
      userId,
      date: { $gte: start, $lte: end }
    });
    const steps = stepLog?.steps || 0;
    const stepPercent = (steps / DEFAULT_STEP_GOAL) * 100;

    // ✅ Calculate score with all 3 factors
    const score = calculateRecoveryScore(
      sleepHours,
      sleepDebt,
      proteinPercent,
      stepPercent
    );

    // Save or update
    let recoveryEntry = await Recovery.findOne({
      userId,
      date: { $gte: start, $lte: end }
    });

    if (!recoveryEntry) {
      recoveryEntry = await Recovery.create({
        userId,
        date: start,
        score,
        sleepHours,
        sleepDebt
      });
    } else {
      recoveryEntry.score = score;
      recoveryEntry.sleepHours = sleepHours;
      recoveryEntry.sleepDebt = sleepDebt;
      await recoveryEntry.save();
    }

    res.status(200).json(recoveryEntry);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { generateRecoveryScore };