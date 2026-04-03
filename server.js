require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/app");

const PORT = 5000;

connectDB();

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend Connected Successfully 🚀" });
});

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/food", require("./src/routes/foodRoutes")); // (if not already)
app.use("/api/water", require("./src/routes/waterRoutes"));   // ✅ ADD THIS

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});