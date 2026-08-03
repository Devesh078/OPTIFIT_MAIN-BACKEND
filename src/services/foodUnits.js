const LIQUID_FOODS = [
  "milk", "water", "juice", "oil", "soda", "cola", "beer", "wine",
  "coffee", "tea", "smoothie", "shake", "cream", "broth", "soup",
  "vinegar", "syrup", "buttermilk", "energy drink", "protein shake"
];

function getDefaultUnit(foodName = "") {
  const name = foodName.toLowerCase();
  const isLiquid = LIQUID_FOODS.some((liquid) => name.includes(liquid));
  return isLiquid ? "ml" : "g";
}

module.exports = { getDefaultUnit, LIQUID_FOODS };