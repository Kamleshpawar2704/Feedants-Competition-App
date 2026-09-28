require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const competitionRoutes = require("./routes/competitionRoutes");
const { createDemoUser } = require("./controllers/competitionController");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN === "*" ? true : process.env.CLIENT_ORIGIN
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "feedants-competition-api" });
});

app.use("/api/competitions", competitionRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  await createDemoUser();

  app.listen(port, () => {
    console.log(`Feedants API running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Unable to start API:", error);
  process.exit(1);
});
