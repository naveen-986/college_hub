const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Academic",
        "Examination",
        "Events",
        "Placement",
        "General"
      ]
    },

    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);