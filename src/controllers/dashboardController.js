const User = require("../models/User");
const FoodLog = require("../models/FoodLog");
const WaterLog = require("../models/WaterLog");
const StepLog = require("../models/StepLog");
const Sleep = require("../models/Sleep");
const Recovery = require("../models/Recovery");
const ProteinQuality = require("../models/ProteinQuality");
const Workout = require("../models/Workout");

const {
  calculateDailyCalories,
  calculateProteinTarget,
} = require("../services/calorieService");

const calculateWaterGoal = require("../utils/waterCalculator"); // ✅ Fix 3: correct import

const {
  DEFAULT_STEP_GOAL,
  calculateStepCalories,
} = require("../services/stepService");

const getDashboard = async (req, res) => {
  try {
    // ✅ Fix 1: use req.user._id everywhere (protect middleware attaches full user object)
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // USER
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // TARGETS
    const calorieData = calculateDailyCalories(user);

    const sleepData = await Sleep.findOne({
      userId,
      date: { $gte: today, $lte: endOfToday },
    });
    const sleepHours = sleepData?.sleepHours || 8;
    const proteinTarget = calculateProteinTarget(user, sleepHours);

    // FOOD
    const foods = await FoodLog.find({
      userId,
      date: { $gte: today, $lte: endOfToday },
    });
    let consumedCalories = 0;
    let consumedProtein = 0;
    foods.forEach((f) => {
      consumedCalories += f.calories || 0;
      consumedProtein += f.protein || 0;
    });

    // WORKOUT
    const workouts = await Workout.find({
      userId,
      date: { $gte: today, $lte: endOfToday },
    });
    let burnedCalories = 0;
    workouts.forEach((w) => {
      burnedCalories += w.caloriesBurned || 0;
    });

    // STEPS
    const stepLog = await StepLog.findOne({
      userId,
      date: { $gte: today, $lte: endOfToday },
    });
    const steps = stepLog?.steps || 0;
    const stepCalories = calculateStepCalories(steps);

    // ✅ Fix 2: WaterLog stores ONE doc per day with totalWater field — read it directly
    const waterLog = await WaterLog.findOne({
      userId,
      date: { $gte: today, $lte: endOfToday },
    });
    const waterConsumed = waterLog?.totalWater || 0;

    // ✅ Fix 3: pass full user object (waterCalculator needs weight, activityLevel, age)
    const waterGoal = calculateWaterGoal(user);

    // ✅ Auto-calculate recovery if not exists today
let recovery = await Recovery.findOne({
  userId,
  date: { $gte: today, $lte: endOfToday },
});

if (!recovery) {
  const { calculateSleepDebt } = require("../services/sleepService");
  const { calculateRecoveryScore } = require("../services/recoveryService");
  const { calculateProteinTarget } = require("../services/calorieService");

  const sleepDebt = await calculateSleepDebt(userId);
  const proteinTarget = calculateProteinTarget(user, sleepHours);
  const proteinPercent = proteinTarget > 0
    ? (consumedProtein / proteinTarget) * 100
    : 0;
  const stepPercent = (steps / DEFAULT_STEP_GOAL) * 100;

  const score = calculateRecoveryScore(
    sleepHours,
    sleepDebt,
    proteinPercent,
    stepPercent
  );

  recovery = await Recovery.create({
    userId,
    date: today,
    score,
    sleepHours,
    sleepDebt,
  });
}

    // PROTEIN QUALITY
    const proteinQuality = await ProteinQuality.findOne({
      userId,
      date: { $gte: today, $lte: endOfToday },
    });

    res.json({
      user,

      calories: {
        target: calorieData.finalCalories,
        consumed: consumedCalories,
        burned: burnedCalories + stepCalories,
        remaining:
          calorieData.finalCalories -
          consumedCalories +
          burnedCalories +
          stepCalories,
      },

      protein: {
        target: proteinTarget,
        consumed: consumedProtein,
        remaining: proteinTarget - consumedProtein,
      },

      water: {
        goal: waterGoal,
        consumed: waterConsumed,
        remaining: waterGoal - waterConsumed,
      },

      steps: {
        goal: DEFAULT_STEP_GOAL,
        steps,
        caloriesBurned: stepCalories,
        remaining: DEFAULT_STEP_GOAL - steps,
      },

      sleep: sleepData || null,
      recovery: recovery || null,
      proteinQuality: proteinQuality || null,

      workout: {
        caloriesBurned: burnedCalories,
      },
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getDashboard };