
const mongoose = require("mongoose");

const clubRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    clubRole: {
      type: String,
      enum: [
        "President",
        "Vice President",
        "Secretary",
        "Joint Secretary",
        "Coordinator",
        "Member"
      ],
      default: "Member"
    }
  },
  { timestamps: true }
);

clubRequestSchema.index(
  { student: 1, club: 1 },
  { unique: true }
);

module.exports = mongoose.model("ClubRequest", clubRequestSchema);
