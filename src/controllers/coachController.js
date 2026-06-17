const Readiness = require("../models/Readiness");
const Protein = require("../models/Protein");
const Workout = require("../models/Workout");
const { generateCoachMessage } = require("../services/coachService");
const {askCoach} = require("../services/ragService");
const {getUserContext} = require("../services/retrievalService");
const {generateActionPlan} = require("../services/actionPlanService");
const {
  calculateProteinTarget
} = require("../services/calorieService");

const User =
require("../models/User");

const Sleep =
require("../models/Sleep");
const ChatHistory =
require("../models/ChatHistory");
const calculateWaterGoal =
require("../utils/waterCalculator");
const chatWithCoach =
async (req, res) => {

  try {

    const { question } = req.body;

    const answer =
    await askCoach(
      req.user,
      question
    );

    await ChatHistory.create({
    userId: req.user,
    question,
    answer
   });
    res.json({
      answer
    });

  } catch(error) {

    console.log(error);

    res.status(500).json({
      message: error.message
    });

  }

};

const getChatHistory =
async (req, res) => {

  try {

    const chats =
    await ChatHistory.find({
      userId: req.user
    })
    .sort({ createdAt: -1 });

    res.json(chats);

  } catch(error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }

};
const getTodayCoach = async (req, res) => {

  try {

    const today = new Date();
    today.setHours(0,0,0,0);

    const readiness = await Readiness.findOne({
      userId: req.user,
      date: today
    });

    const sleep = await Sleep.findOne({
      userId: req.user,
      date: today
    });

    const protein = await Protein.findOne({
      userId: req.user,
      date: today
    });

    const workout = await Workout.findOne({
      userId: req.user,
      date: today
    });

    const message = generateCoachMessage({

      readinessScore: readiness?.score || 70,
      readinessStatus: readiness?.status || "GOOD",

      sleepHours: sleep?.sleepHours || 8,
      sleepDebt: readiness?.debtScore || 0,

      recoveryScore: readiness?.recoveryScore || 80,

      adjustedProtein: protein?.adjustedProtein || 0,
      baseProtein: protein?.baseProtein || 0,

      workoutIntensity: workout?.intensity || "none"

    });
   
    res.json({
      readinessScore: readiness?.score,
      readinessStatus: readiness?.status,
      coachMessage: message
    });

  }
  catch(error)
  {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
 const getCoachSummary = async (
  req,
  res
) => {

  try {

    const context =
      await getUserContext(
        req.user
      );
    const user =
  await User.findById(
    req.user._id || req.user
  );
const waterGoal =
calculateWaterGoal(user);
const today = new Date();
today.setHours(0,0,0,0);

const endOfToday = new Date();
endOfToday.setHours(
  23,59,59,999
);

const sleepData =
  await Sleep.findOne({
    userId: user._id,
    date: {
      $gte: today,
      $lte: endOfToday
    }
  });

const proteinTarget =
  calculateProteinTarget(
    user,
    sleepData?.sleepHours || 8
  );

    const plan =
await generateActionPlan(
  context,
  req.user
);

res.json({
  success: true,

  plan,

  proteinGoal:
  proteinTarget,

  waterGoal,

  readinessScore:
  context.summary
    ?.recoveryScore || 70,


  readinessStatus:
  context.summary?.recoveryScore >= 75
    ? "Excellent"
    : context.summary?.recoveryScore >= 60
    ? "Good"
    : "Needs Recovery",
  averageSleep:
    context.summary
      ?.averageSleepLast7Days || 0

   
});
  } catch (error) {

    console.log(error);

    res.status(500).json({
      message:
        "Failed to load coach summary"
    });

  }

};

module.exports = {
  getTodayCoach,
  chatWithCoach,
  getChatHistory,
  getCoachSummary
};