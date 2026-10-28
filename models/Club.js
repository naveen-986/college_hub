
const mongoose = require("mongoose");

const clubUpdateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    category: {
      type: String,
      required: true
    },
    emoji: {
      type: String,
      default: "🎓"
    },
    description: {
      type: String,
      required: true
    },
    activities: {
      type: [String],
      default: []
    },
    events: [
      {
        name: {
          type: String,
          required: true
        },
        date: {
          type: String,
          default: "Coming Soon"
        }
      }
    ],
    updates: {
      type: [clubUpdateSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Club", clubSchema);
