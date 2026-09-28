const mongoose = require("mongoose");
const Competition = require("../models/Competition");
const Registration = require("../models/Registration");
const Submission = require("../models/Submission");
const User = require("../models/User");

const DEMO_USER = {
  externalId: "demo-user-001",
  name: "Kamlesh"
};

function serializeCompetition(competition) {
  const data = competition.toObject();
  data.lifecycle = competition.getLifecycle();
  data.spotsLeft = Math.max(competition.maxParticipants - competition.registeredCount, 0);
  data.isFull = data.spotsLeft === 0;
  return data;
}

async function getCompetition(req, res) {
  const competition = await Competition.findOne({ slug: req.params.slug }).lean(false);

  if (!competition) {
    return res.status(404).json({ message: "Competition not found" });
  }

  const userExternalId = req.query.userId || DEMO_USER.externalId;
  const user = await User.findOne({ externalId: userExternalId });

  let registration = null;
  let submission = null;

  if (user) {
    registration = await Registration.findOne({
      competitionId: competition._id,
      userId: user._id,
      status: "registered"
    }).lean();

    submission = await Submission.findOne({
      competitionId: competition._id,
      userId: user._id
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  res.json({
    competition: serializeCompetition(competition),
    viewer: {
      userId: userExternalId,
      isRegistered: Boolean(registration),
      registrationId: registration?._id || null,
      submission: submission
        ? {
            id: submission._id,
            status: submission.status,
            videoUrl: submission.videoUrl,
            submittedAt: submission.submittedAt
          }
        : null
    }
  });
}

async function registerForCompetition(req, res) {
  const { userId = DEMO_USER.externalId } = req.body || {};

  const competition = await Competition.findById(req.params.id);
  if (!competition) return res.status(404).json({ message: "Competition not found" });

  const lifecycle = competition.getLifecycle();
  if (lifecycle !== "registration_open") {
    return res.status(409).json({ message: "Registration is closed for this competition." });
  }

  const user = await User.findOne({ externalId: userId });
  if (!user) return res.status(404).json({ message: "User not found" });

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const existing = await Registration.findOne({
        competitionId: competition._id,
        userId: user._id,
        status: "registered"
      }).session(session);

      if (existing) {
        result = {
          alreadyRegistered: true,
          registration: existing
        };
        return;
      }

      const updatedCompetition = await Competition.findOneAndUpdate(
        {
          _id: competition._id,
          registrationClosesAt: { $gt: new Date() },
          $expr: { $lt: ["$registeredCount", "$maxParticipants"] }
        },
        { $inc: { registeredCount: 1 } },
        { new: true, session }
      );

      if (!updatedCompetition) {
        const full = await Competition.findById(competition._id).session(session);
        if (full && full.registeredCount >= full.maxParticipants) {
          const error = new Error("Competition is full.");
          error.statusCode = 409;
          throw error;
        }

        const error = new Error("Registration is no longer available.");
        error.statusCode = 409;
        throw error;
      }

      const [registration] = await Registration.create(
        [
          {
            competitionId: competition._id,
            userId: user._id
          }
        ],
        { session }
      );

      result = {
        alreadyRegistered: false,
        registration,
        competition: updatedCompetition
      };
    });

    res.status(result.alreadyRegistered ? 200 : 201).json({
      message: result.alreadyRegistered ? "You are already registered." : "Registration successful.",
      ...result
    });
  } catch (error) {
    const status = error.statusCode || (error.code === 11000 ? 200 : 500);
    if (status === 200) {
      return res.status(200).json({ message: "You are already registered." });
    }
    res.status(status).json({ message: error.message || "Could not complete registration." });
  } finally {
    await session.endSession();
  }
}

async function getRegistration(req, res) {
  const { userId = DEMO_USER.externalId } = req.query;
  const user = await User.findOne({ externalId: userId });

  if (!user) return res.status(404).json({ message: "User not found" });

  const registration = await Registration.findOne({
    competitionId: req.params.id,
    userId: user._id,
    status: "registered"
  }).lean();

  res.json({ isRegistered: Boolean(registration), registration });
}

async function createSubmission(req, res) {
  const { userId = DEMO_USER.externalId, videoUrl } = req.body || {};

  if (!videoUrl || typeof videoUrl !== "string") {
    return res.status(400).json({ message: "A video URL is required." });
  }

  const competition = await Competition.findById(req.params.id);
  if (!competition) return res.status(404).json({ message: "Competition not found" });

  if (competition.getLifecycle() !== "submission_open") {
    return res.status(409).json({ message: "Submissions are not open right now." });
  }

  const user = await User.findOne({ externalId: userId });
  if (!user) return res.status(404).json({ message: "User not found" });

  const registered = await Registration.exists({
    competitionId: competition._id,
    userId: user._id,
    status: "registered"
  });

  if (!registered) {
    return res.status(403).json({ message: "Register before submitting." });
  }

  const submission = await Submission.create({
    competitionId: competition._id,
    userId: user._id,
    videoUrl
  });

  res.status(201).json({ message: "Submission uploaded.", submission });
}

async function createDemoUser() {
  await User.updateOne(
    { externalId: DEMO_USER.externalId },
    { $setOnInsert: DEMO_USER },
    { upsert: true }
  );
}

module.exports = {
  getCompetition,
  registerForCompetition,
  getRegistration,
  createSubmission,
  createDemoUser
};
