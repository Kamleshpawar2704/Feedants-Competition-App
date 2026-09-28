const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
  {
    position: { type: String, required: true },
    amount: { type: Number, required: true },
    medal: { type: String, default: "star" }
  },
  { _id: false }
);

const winnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    position: { type: String, required: true },
    avatarUrl: { type: String, default: "" }
  },
  { _id: false }
);

const competitionSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    prizePool: { type: Number, required: true },
    entryFee: { type: Number, required: true },
    maxParticipants: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, required: true, min: 0, default: 0 },
    registrationClosesAt: { type: Date, required: true },
    submissionStartsAt: { type: Date, required: true },
    submissionEndsAt: { type: Date, required: true },
    resultAt: { type: Date, required: true },
    judge: {
      name: { type: String, required: true },
      title: { type: String, required: true },
      experience: { type: String, required: true },
      avatarUrl: { type: String, default: "" },
      introVideoUrl: { type: String, default: "" }
    },
    description: { type: String, required: true },
    judgingParameters: [{ type: String }],
    rules: [{ type: String }],
    rewards: [rewardSchema],
    previousWinners: [winnerSchema],
    referralReward: { type: Number, default: 0 }
  },
  { timestamps: true }
);

competitionSchema.methods.getLifecycle = function () {
  const now = new Date();

  if (now < this.registrationClosesAt) return "registration_open";
  if (now >= this.submissionStartsAt && now < this.submissionEndsAt) return "submission_open";
  if (now >= this.submissionEndsAt) return "closed";
  return "upcoming";
};

module.exports = mongoose.model("Competition", competitionSchema);
