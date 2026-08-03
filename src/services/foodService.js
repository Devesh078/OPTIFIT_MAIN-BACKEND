const axios = require("axios");
const { getDefaultUnit } = require("./foodUnits");

// =========================
// SEARCH FOOD (for dropdown / suggestions)
// =========================
const searchFood = async (query) => {
  try {
    const response = await axios.get(
      "https://api.spoonacular.com/food/ingredients/search",
      {
        params: {
          query,
          number: 10,
          apiKey: process.env.SPOONACULAR_API_KEY
        }
      }
    );

    const resultsWithUnits = response.data.results.map((item) => ({
      ...item,
      defaultUnit: getDefaultUnit(item.name)
    }));

    return { ...response.data, results: resultsWithUnits };
  } catch (error) {
    console.log("SEARCH ERROR:", error.message);
    throw error;
  }
};

// =========================
// GET NUTRITION (SMART MATCH)
// =========================
const getNutrition = async (query) => {
  try {
    const cleanedQuery = query.toLowerCase().trim();

    // 🔥 STEP 1: Try full query
    let searchRes = await axios.get(
      "https://api.spoonacular.com/food/ingredients/search",
      {
        params: {
          query: cleanedQuery,
          number: 5,
          apiKey: process.env.SPOONACULAR_API_KEY
        }
      }
    );

    let results = searchRes.data.results;

    // 🔥 STEP 2: Fallback → last word
    if (!results.length) {
      const fallbackQuery = cleanedQuery.split(" ").pop();

      searchRes = await axios.get(
        "https://api.spoonacular.com/food/ingredients/search",
        {
          params: {
            query: fallbackQuery,
            number: 5,
            apiKey: process.env.SPOONACULAR_API_KEY
          }
        }
      );

      results = searchRes.data.results;
    }

    if (!results.length) {
      throw new Error("Food not found");
    }

    // 🔥 STEP 3: Smart matching
    const bestMatch =
      results.find(item =>
        item.name.toLowerCase().includes(cleanedQuery) ||
        cleanedQuery.includes(item.name.toLowerCase())
      ) || results[0];

    // ✅ DEBUG (NOW CORRECT PLACE)
    console.log("QUERY:", cleanedQuery);
    console.log("RESULTS:", results.map(r => r.name));
    console.log("SELECTED:", bestMatch.name);

    const foodId = bestMatch.id;

    // 🔥 STEP 4: Get nutrition
    const nutritionRes = await axios.get(
      `https://api.spoonacular.com/food/ingredients/${foodId}/information`,
      {
        params: {
          amount: 100,
          unit: "g",
          apiKey: process.env.SPOONACULAR_API_KEY
        }
      }
    );

    const nutrients = nutritionRes.data.nutrition.nutrients;

    const getValue = (name) => {
      const item = nutrients.find(n => n.name === name);
      return item ? item.amount : 0;
    };

    return {
      calories: getValue("Calories"),
      protein: getValue("Protein"),
      carbs: getValue("Carbohydrates"),
      fats: getValue("Fat")
    };

  } catch (error) {
    console.log("SPOONACULAR ERROR:", error.message);

    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    };
  }
};


// =========================
// EXPORTS
// =========================
module.exports = {
  searchFood,
  getNutrition
};