require("dotenv").config();
const mongoose = require("mongoose");
const Competition = require("../models/Competition");
const { createDemoUser } = require("../controllers/competitionController");

const DAY = 24 * 60 * 60 * 1000;

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const now = Date.now();

  const competition = {
    slug: "feedants-classical-dance",
    title: "Feedants Classical Dance",
    category: "Dance",
    tags: ["Multi-Win"],
    prizePool: 1500,
    entryFee: 99,
    maxParticipants: 20,
    registeredCount: 1,
    registrationClosesAt: new Date(now + 2 * DAY + 6 * 60 * 60 * 1000),
    submissionStartsAt: new Date(now + 1 * DAY),
    submissionEndsAt: new Date(now + 5 * DAY),
    resultAt: new Date(now + 7 * DAY),
    judge: {
      name: "Manju Dubey",
      title: "Professional Kathak Dancer",
      experience: "12+ Years of Experience",
      avatarUrl: "https://i.pravatar.cc/300?img=47",
      introVideoUrl: "https://example.com/intro-video"
    },
    description:
      "This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.",
    judgingParameters: [
      "Technique and control",
      "Expression and storytelling",
      "Rhythm and musicality",
      "Stage presence"
    ],
    rules: [
      "One submission per registered participant.",
      "Video should clearly show the complete performance.",
      "Original performances are required.",
      "Respectful and appropriate content only."
    ],
    rewards: [
      { position: "1st Winner", amount: 550, medal: "trophy" },
      { position: "2nd Winner", amount: 300, medal: "silver" },
      { position: "3rd Winner", amount: 240, medal: "bronze" },
      { position: "4th Winner", amount: 200, medal: "star" },
      { position: "5th Winner", amount: 130, medal: "star" },
      { position: "6th Winner", amount: 80, medal: "star" }
    ],
    previousWinners: [
      { name: "Riya Shah", position: "1st Winner", avatarUrl: "https://i.pravatar.cc/200?img=32" },
      { name: "Aarav Mehta", position: "1st Winner", avatarUrl: "https://i.pravatar.cc/200?img=12" },
      { name: "Neha Verma", position: "2nd Winner", avatarUrl: "https://i.pravatar.cc/200?img=44" },
      { name: "Ishita Chopra", position: "3rd Winner", avatarUrl: "https://i.pravatar.cc/200?img=49" }
    ],
    referralReward: 10
  };

  await Competition.findOneAndUpdate(
    { slug: competition.slug },
    competition,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await createDemoUser();

  console.log("Feedants competition seeded.");
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
