const {
  calculateProteinTarget
} = require(
  "./calorieService"
);

const generateActionPlan = async (
  context
) => {

  const proteinTarget =
    calculateProteinTarget(
      {
        weight:
          context.profile.weight,

        goal:
          context.profile.goal
      },

      context.summary
        ?.averageSleepLast7Days || 8
    );

  return {

    sleep:
      "Target 8 hours sleep",

    protein:
      `${proteinTarget}g protein`,

    hydration:
      "3 liters water",

    workout:
      "Moderate workout",

    priority:
      "Recovery"

  };

};

module.exports = {
  generateActionPlan
};