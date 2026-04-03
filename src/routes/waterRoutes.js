const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  getTodayWater,
  addWater,
  setReminder
} = require("../controllers/waterController");

router.use(protect);

router.get("/today", getTodayWater);
router.post("/add", addWater);
router.post("/reminder", setReminder);

module.exports = router;