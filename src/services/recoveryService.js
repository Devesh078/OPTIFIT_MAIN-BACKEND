const calculateRecoveryScore = (sleepHours, sleepDebt, proteinPercent = 0, stepPercent = 0) => {
  let score = 100;

  // ✅ Sleep penalty (max -30)
  if (sleepHours < 5) {
    score -= 30;
  } else if (sleepHours < 6) {
    score -= 20;
  } else if (sleepHours < 7) {
    score -= 10;
  }

  // ✅ Sleep debt penalty (max -20)
  const debtPenalty = Math.min(sleepDebt * 3, 20);
  score -= debtPenalty;

  // ✅ Protein bonus/penalty (max ±15)
  if (proteinPercent >= 90) {
    score += 10;
  } else if (proteinPercent >= 70) {
    score += 5;
  } else if (proteinPercent < 50) {
    score -= 15;
  } else if (proteinPercent < 70) {
    score -= 8;
  }

  // ✅ Activity/steps bonus/penalty (max ±10)
  if (stepPercent >= 100) {
    score += 10;
  } else if (stepPercent >= 70) {
    score += 5;
  } else if (stepPercent < 30) {
    score -= 10;
  } else if (stepPercent < 50) {
    score -= 5;
  }

  // Clamp between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
};

module.exports = { calculateRecoveryScore };