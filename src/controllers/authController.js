const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateOTP, sendVerificationEmail, sendPasswordResetEmail } = require("../services/emailService");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password) => {
  // Min 8 chars, at least 1 letter and 1 number
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ─────────────────────────────────────────────
// REGISTER — Step 1: Validate + send OTP
// ─────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password, age, height, weight, goal, activityLevel, gender } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include letters and numbers."
      });
    }

    // Check if email already exists and verified
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser && !existingUser.isEmailVerified) {
      // Resend OTP to existing unverified user
      existingUser.password = hashedPassword;
      existingUser.emailVerificationOTP = otp;
      existingUser.emailVerificationOTPExpiry = otpExpiry;
      await existingUser.save();
    } else {
      // Create new unverified user
      await User.create({
        name,
        email,
        password: hashedPassword,
        age,
        height,
        weight,
        goal,
        activityLevel,
        gender,
        isEmailVerified: false,
        emailVerificationOTP: otp,
        emailVerificationOTPExpiry: otpExpiry,
      });
    }

    await sendVerificationEmail(email, otp);

    res.status(201).json({
      message: "OTP sent to your email. Please verify to complete registration.",
      email,
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// VERIFY EMAIL OTP — Step 2
// ─────────────────────────────────────────────
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (new Date() > user.emailVerificationOTPExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please register again." });
    }

    // Mark as verified
    user.isEmailVerified = true;
    user.emailVerificationOTP = null;
    user.emailVerificationOTPExpiry = null;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      message: "Email verified successfully!",
      token,
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// RESEND VERIFICATION OTP
// ─────────────────────────────────────────────
const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    const otp = generateOTP();
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, otp);

    res.status(200).json({ message: "OTP resent successfully." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Block login if email not verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        message: "Please verify your email before logging in.",
        needsVerification: true,
        email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = generateToken(user._id);
    res.status(200).json({ token });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GOOGLE LOGIN
// ─────────────────────────────────────────────
const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: "Google login failed. Missing data." });
    }

    let user = await User.findOne({ email });

    if (user) {
      // Existing user — link Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true; // Google emails are pre-verified
        await user.save();
      }
    } else {
      // New Google user — needs profile setup
      return res.status(206).json({
        message: "New Google user — profile setup required.",
        needsProfileSetup: true,
        email,
        name,
        googleId,
      });
    }

    const token = generateToken(user._id);
    res.status(200).json({ token });

  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// REGISTER GOOGLE USER (after profile setup)
// ─────────────────────────────────────────────
const registerGoogleUser = async (req, res) => {
  try {
    const { name, email, googleId, age, height, weight, goal, activityLevel, gender } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const user = await User.create({
      name,
      email,
      googleId,
      password: "GOOGLE_AUTH_" + googleId, // placeholder, never used
      age,
      height,
      weight,
      goal,
      activityLevel,
      gender,
      isEmailVerified: true, // Google emails are pre-verified
    });

    const token = generateToken(user._id);
    res.status(201).json({ token });

  } catch (error) {
    console.error("GOOGLE REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD — Send OTP
// ─────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user || !user.isEmailVerified) {
      return res.status(200).json({
        message: "If this email exists, an OTP has been sent."
      });
    }

    const otp = generateOTP();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(email, otp);

    res.status(200).json({ message: "If this email exists, an OTP has been sent." });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// RESET PASSWORD — Verify OTP + set new password
// ─────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include letters and numbers."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (new Date() > user.resetPasswordOTPExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, weight, height, goal, gender } = req.body;

    if (name !== undefined) user.name = name;
    if (weight !== undefined) user.weight = weight;
    if (height !== undefined) user.height = height;
    if (goal !== undefined) user.goal = goal;
    if (gender && ["male", "female"].includes(gender)) user.gender = gender;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};