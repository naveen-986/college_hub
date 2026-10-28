
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
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
      required: true,
      select: false
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20
    },
    
showPhone: {
  type: Boolean,
  default: false
},


    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student"
    },

    branch: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    },

    year: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", ""],
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
