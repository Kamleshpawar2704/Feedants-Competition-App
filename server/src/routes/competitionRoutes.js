const express = require("express");
const {
  getCompetition,
  registerForCompetition,
  getRegistration,
  createSubmission
} = require("../controllers/competitionController");

const router = express.Router();

router.get("/slug/:slug", getCompetition);
router.get("/:id/registration", getRegistration);
router.post("/:id/register", registerForCompetition);
router.post("/:id/submissions", createSubmission);

module.exports = router;
