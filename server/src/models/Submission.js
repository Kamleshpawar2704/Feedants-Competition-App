const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    competitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competition",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    videoUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["submitted", "under_review", "accepted", "rejected"],
      default: "submitted"
    },
    submittedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

submissionSchema.index({ competitionId: 1, userId: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
