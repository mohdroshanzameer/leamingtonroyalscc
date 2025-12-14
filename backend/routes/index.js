const express = require("express");
const authRoutes = require("./auth");
const entityRoutes = require("./entities");
const healthRoutes = require("./health");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/entities", entityRoutes);
router.use("/health", healthRoutes);

module.exports = router;