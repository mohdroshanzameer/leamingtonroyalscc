const express = require("express");
const authRoutes = require("./auth");
const entityRoutes = require("./entities");
const healthRoutes = require("./health");
const filesRoutes = require("./files"); //

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/entities", entityRoutes);
router.use("/health", healthRoutes);
router.use("/files", filesRoutes); 


module.exports = router;