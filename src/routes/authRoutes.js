const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  registerUser,
  verifyEmailOTP,
  resendVerificationOTP,
  loginUser,
  googleLogin,
  registerGoogleUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

// ── Registration & Verification ──
router.post("/register", registerUser);
router.post("/verify-email", verifyEmailOTP);
router.post("/resend-otp", resendVerificationOTP);

// ── Login ──
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.post("/google-register", registerGoogleUser);

// ── Password Reset ──
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ── Profile ──
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;