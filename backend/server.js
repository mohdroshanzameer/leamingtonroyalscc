const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();

const routes = require("./routes");
const { initDb } = require("./db/pool");

const app = express();
const server = http.createServer(app);

// Initialize DB
initDb().catch(err => console.error("DB init failed:", err));

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("join_room", (room) => socket.join(room));
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// Use modular routes
app.use("/api", routes);

// Serve frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});