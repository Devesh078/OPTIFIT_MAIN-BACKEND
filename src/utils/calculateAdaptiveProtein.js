const calculateBaseProtein = (
  weight,
  goal
) => {

  switch (goal) {

    case "muscle_build":
      return Math.round(
        weight * 2.2
      );

    case "weight_loss":
      return Math.round(
        weight * 1.8
      );

    default:
      return Math.round(
        weight * 1.6
      );
  }

};

module.exports = {
  calculateBaseProtein
};