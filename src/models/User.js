const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: function () {
        return !this.googleId; // password not required for Google users
      }
    },

    googleId: {
      type: String,
      default: null
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true
    },

    age: {
      type: Number,
      required: true
    },

    height: {
      type: Number,
      required: true
    },

    weight: {
      type: Number,
      required: true
    },

    goal: {
      type: String,
      enum: ["muscle_build", "weight_loss", "maintenance"],
      default: "maintenance"
    },

    activityLevel: {
      type: String,
      enum: ["sedentary", "moderate", "active"],
      default: "moderate"
    },

    // ── Email Verification ──
    isEmailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationOTP: {
      type: String,
      default: null
    },

    emailVerificationOTPExpiry: {
      type: Date,
      default: null
    },

    // ── Forgot Password ──
    resetPasswordOTP: {
      type: String,
      default: null
    },

    resetPasswordOTPExpiry: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);