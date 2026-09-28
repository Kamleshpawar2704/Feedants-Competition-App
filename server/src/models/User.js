const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
