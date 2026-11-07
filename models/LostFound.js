
const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    type: {
      type: String,
      enum: ["Lost", "Found"],
      required: true
    },

    category: {
      type: String,
      enum: [
        "Electronics",
        "Documents",
        "Clothing",
        "Accessories",
        "Books",
        "Others"
      ],
      required: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: Date,
      required: true
    },

    image: {
      type: String,
      default: ""
    },

    contact: {
      type: String,
      required: true,
      trim: true
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Resolved"],
      default: "Pending"
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    reviewedAt: {
      type: Date,
      default: null
    },

    adminRemarks: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LostFound", lostFoundSchema);
