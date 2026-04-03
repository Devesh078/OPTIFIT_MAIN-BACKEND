const calculateWaterGoal = (user) => {
  let water = user.weight * 35;

  if (user.activityLevel === "moderate") water += 300;
  if (user.activityLevel === "active") water += 600;

  if (user.age > 55) water -= 200;

  return Math.round(water);
};

module.exports = calculateWaterGoal;