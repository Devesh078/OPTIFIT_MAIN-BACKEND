const workoutKnowledge =
require("../data/workoutKnowledge");

const getWorkoutRecommendation =
(readinessScore = 70) => {

  if (readinessScore < 40)
    return workoutKnowledge.LOW;

  if (readinessScore < 80)
    return workoutKnowledge.MODERATE;

  return workoutKnowledge.HIGH;
};

module.exports = {
  getWorkoutRecommendation
};