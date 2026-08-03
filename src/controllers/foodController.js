const FoodLog = require("../models/FoodLog");
const { calculateDailyTotals } = require("../services/nutritionService");
const foodService = require("../services/foodService");
const indianFoods = require("../data/indianFoods.json");

// =========================
// LOG FOOD
// =========================


/* ===============================
   🔥 1️⃣ BMR Calculation
================================ */

const calculateBMR = (user) => {
  const { weight, height, age, gender } = user;

  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

/* ===============================
   🔥 2️⃣ Activity Multiplier
================================ */

const getActivityMultiplier = (level) => {
  switch (level) {
    case "sedentary":
      return 1.2;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    default:
      return 1.55;
  }
};

/* ===============================
   🔥 3️⃣ Calorie Goal Based On Goal Type
================================ */

const calculateCalorieGoal = (user) => {
  const bmr = calculateBMR(user);
  const tdee = bmr * getActivityMultiplier(user.activityLevel);

  switch (user.goal) {
    case "muscle_build":
      return Math.round(tdee + 300);
    case "weight_loss":
      return Math.round(tdee - 400);
    case "maintenance":
    default:
      return Math.round(tdee);
  }
};

/* ===============================
   🔥 4️⃣ Base Protein Goal
================================ */

const calculateProteinGoal = (user) => {
  const weight = user.weight;

  switch (user.goal) {
    case "muscle_build":
      return Math.round(weight * 2.2);
    case "weight_loss":
      return Math.round(weight * 1.8);
    case "maintenance":
    default:
      return Math.round(weight * 1.6);
  }
};

/* ===============================
   🔥 5️⃣ Daily Nutrition Totals
================================ */

const logFood = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // ✅ IMPORTANT (keep this)

    const food = await FoodLog.create({
      userId: req.user._id,
      date: today,   // ✅ FIXED BACK
      ...req.body
    });

    res.status(201).json(food);
  } catch (error) {
    console.log("LOG FOOD ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
// =========================
// GET DAILY TOTALS
// =========================
const getDailyNutrition = async (req, res) => {
  try {
    const start = new Date();
start.setHours(0, 0, 0, 0);

const end = new Date();
end.setHours(23, 59, 59, 999);

    const totals = await calculateDailyTotals(req.user._id, start,end);
    res.json(totals);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// GET TODAY FOODS
// =========================
const getTodayFoods = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const foods = await FoodLog.find({
      userId: req.user._id,
      date:{
        $gte: start,
        $lte: end
      }
    }).sort({ createdAt: -1 });

    res.json(foods);
  } catch (error) {
    console.log("GET TODAY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// =========================
// SEARCH FOOD (AUTOCOMPLETE)
// =========================
const searchFood = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Food query is required" });
    }

    const query = q.toLowerCase();

    // ✅ LOCAL SEARCH (case-insensitive)
    const matchedFoods = Object.keys(indianFoods).filter(food =>
      food.toLowerCase().includes(query)
    );

    if (matchedFoods.length > 0) {
      return res.json({
        success: true,
        source: "local",
        foods: matchedFoods.map(food => ({ name: food }))
      });
    }

    // 🔹 Spoonacular fallback
    const foodData = await foodService.searchFood(query);

    const foods = foodData.results.map(food => ({
      id: food.id,
      name: food.name,
      image: food.image
    }));

    res.json({
      success: true,
      source: "spoonacular",
      foods
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Food search failed"
    });
  }
};

// =========================
// UNIT MAP
// =========================
const unitMap = {
  g: 1,
  gram: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  L: 1000,    // ← add uppercase L
  cup: 200,
  piece: 50,
  tbsp: 15,
  tsp: 5,
};

// =========================
// GET FOOD NUTRITION
// =========================
const getFoodNutrition = async (req, res) => {
  try {
    const { name, quantity = 1, unit = "g" } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Food name required" });
    }

    const query = name.toLowerCase();

    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    // ✅ LOCAL FOOD MATCH (single item)
    const matchedFood = Object.keys(indianFoods).find(food =>
      food.toLowerCase().includes(query)
    );

    if (matchedFood) {
      const base = indianFoods[matchedFood];

      const grams = Number(quantity) * (unitMap[unit] || 1);
      const factor = grams / 100;

      calories = base.calories * factor;
      protein = base.protein * factor;
      carbs = base.carbs * factor;
      fats = base.fats * factor;
    }

    // 🔹 SPOONACULAR FALLBACK
    else {
      const data = await foodService.getNutrition(query);

      const grams = Number(quantity) * (unitMap[unit] || 1);
      const factor = grams / 100;

      calories = data.calories * factor;
      protein = data.protein * factor;
      carbs = data.carbs * factor;
      fats = data.fats * factor;
    }

    return res.json({
      nutrition: {
        calories: Math.round(calories),
        protein: +protein.toFixed(1),
        carbs: +carbs.toFixed(1),
        fats: +fats.toFixed(1)
      }
    });

  } catch (error) {
    console.log("NUTRITION ERROR:", error.message);

    return res.json({
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      }
    });
  }
};

const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    const food = await FoodLog.findByIdAndDelete(id);

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// =========================
// EXPORTS
// =========================
module.exports = {
  logFood,
  getDailyNutrition,
  getTodayFoods,
  searchFood,
  getFoodNutrition,
  deleteFood
};