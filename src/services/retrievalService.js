/*const User = require("../models/User");
const Sleep = require("../models/Sleep");
const Protein = require("../models/Protein");
const Readiness = require("../models/Readiness");
const ChatHistory =
require("../models/ChatHistory");
const {
  calculateProteinTarget
} = require("../services/calorieService");
const getUserContext = async (userId) => {

  const user = await User.findById(userId);

  const sleepHistory =
    await Sleep.find({
    userId
    })
    .sort({ date: -1 })
    .limit(7);

  const proteinHistory =
    await Protein.find({
    userId
    })
    .sort({ date: -1 })
    .limit(7);

  const readinessHistory =
    await Readiness.find({
    userId
    })
    .sort({ date: -1 })
    .limit(7);
  const recentChats =
    await ChatHistory.find({
    userId
    })
    .sort({ createdAt: -1 })
    .limit(5);

  const avgSleep =
  sleepHistory.length > 0
  ? Number(
      (
        sleepHistory.reduce(
          (sum, s) => sum + s.sleepHours,
          0
        ) / sleepHistory.length
      ).toFixed(1)
    )
  : 0;
   const proteinTarget =
  calculateProteinTarget(
    user,
    avgSleep || 8
  );
  console.log(
  "SUMMARY OBJECT:",
  JSON.stringify({
    averageSleepLast7Days: avgSleep,
    latestReadinessScore:
      readinessHistory[0]?.score,
    latestReadinessStatus:
      readinessHistory[0]?.status,
    latestAdjustedProtein:
      proteinHistory[0]?.adjustedProtein
  }, null, 2)
);
  return {
    profile: {
      name: user?.name,
      age: user?.age,
      gender: user?.gender,
      weight: user?.weight,
      height: user?.height,
      goal: user?.goal
    },
    summary: {
  averageSleepLast7Days: avgSleep,

  latestReadinessScore:
    readinessHistory[0]?.score,

  latestReadinessStatus:
    readinessHistory[0]?.status,

  latestAdjustedProtein:
    proteinHistory[0]?.adjustedProtein,

  proteinTarget
},
    sleepHistory,

    proteinHistory,

    readinessHistory,

    recentChats
    };
};

module.exports = {
  getUserContext
};*/

const User = require("../models/User");
const Sleep = require("../models/Sleep");
const Recovery = require("../models/Recovery");
const ChatHistory =
require("../models/ChatHistory");
const FoodLog =
require("../models/FoodLog");
const {
  calculateProteinTarget
} = require("../services/calorieService");

const getUserContext = async (
  userId
) => {

  const user =
  await User.findById(userId);

  const sleepHistory =
  await Sleep.find({
    userId
  })
  .sort({ date: -1 })
  .limit(7);

  const recoveryHistory =
  await Recovery.find({
    userId
  })
  .sort({ date: -1 })
  .limit(7);

  const recentChats =
  await ChatHistory.find({
    userId
  })
  .sort({ createdAt: -1 })
  .limit(5);

  const today = new Date();
today.setHours(0,0,0,0);

const endOfToday =
new Date();

endOfToday.setHours(
  23,59,59,999
);

const foods =
await FoodLog.find({
  userId,
  date: {
    $gte: today,
    $lte: endOfToday
  }
});

let consumedProtein = 0;
let consumedCalories = 0;

foods.forEach(food => {

  consumedProtein +=
    food.protein || 0;

  consumedCalories +=
    food.calories || 0;

});

  const avgSleep =
  sleepHistory.length > 0
  ? Number(
      (
        sleepHistory.reduce(
          (sum, s) =>
            sum + s.sleepHours,
          0
        ) / sleepHistory.length
      ).toFixed(1)
    )
  : 0;

  //const proteinTarget =
  //calculateProteinTarget(
    //user,
   // avgSleep || 8
  //);
  /*const today = new Date();
today.setHours(0,0,0,0);*/

/*const endOfToday = new Date();
endOfToday.setHours(
  23,59,59,999
);*/

const sleepData =
await Sleep.findOne({
  userId,
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

console.log(
  "AI PROTEIN TARGET:",
  proteinTarget
);

console.log(
  "TODAY SLEEP:",
  sleepData?.sleepHours
);

  /*const today = new Date();
today.setHours(0,0,0,0);

const endOfToday = new Date();
endOfToday.setHours(
  23,59,59,999
);*/

const todayRecovery =
await Recovery.findOne({
  userId,
  date: {
    $gte: today,
    $lte: endOfToday
  }
});
console.log(
  "TODAY RECOVERY:",
  todayRecovery
);

console.log(
  "TODAY RECOVERY:",
  todayRecovery
);

console.log(
  "AI RECOVERY SCORE:",
  todayRecovery?.score
);

  console.log(
  "AVG SLEEP:",
  avgSleep
);

console.log(
  "PROTEIN TARGET:",
  proteinTarget
);

console.log(
  "CONSUMED PROTEIN:",
  consumedProtein
);

console.log(
  "CONSUMED CALORIES:",
  consumedCalories
);
  return {

    profile: {
      name: user?.name,
      age: user?.age,
      gender: user?.gender,
      weight: user?.weight,
      height: user?.height,
      goal: user?.goal
    },

    summary: {

      averageSleepLast7Days:
      avgSleep,

      proteinTarget,

      consumedProtein,

      consumedCalories,

      recoveryScore:
todayRecovery?.score ||
recoveryHistory[0]?.score ||
70,

sleepDebt:
todayRecovery?.sleepDebt ||
recoveryHistory[0]?.sleepDebt ||
0

    },

    sleepHistory,

    recoveryHistory,

    recentChats

  };

};

module.exports = {
  getUserContext
};