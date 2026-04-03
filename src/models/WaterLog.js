const mongoose = require("mongoose");

const waterLogSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    time: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const waterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    totalWater: {
      type: Number,
      default: 0
    },

    logs: [waterLogSchema],

    reminderInterval: {
      type: Number, // in minutes
      default: 60
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Water", waterSchema);