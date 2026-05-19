const express = require("express");
const router = express.Router();
const { symptomCheck, healthSummary } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/symptom-check", protect, symptomCheck);
router.get("/health-summary", protect, authorize("patient"), healthSummary);

module.exports = router;
