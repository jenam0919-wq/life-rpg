const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Support both `npm run start` from backend/ and running the backend from
// the project root. Backend-specific values take precedence.
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const db = require("./database/database");
const authRoutes = require("./routes/auth");
const questRoutes = require("./routes/quests");
const characterRoutes = require("./routes/character");
const rewardRoutes = require("./routes/rewards");

const app = express();

const PORT = process.env.PORT || 5000;
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");
const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5181",
    "http://127.0.0.1:5181",
    ...(process.env.FRONTEND_URL || "").split(","),
    ...(process.env.FRONTEND_ORIGIN || "").split(","),
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

// ==========================================
// CORS
// ==========================================

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header include curl and same-origin calls.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json({ limit: "16kb" }));

// ==========================================
// AUTH ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// QUEST ROUTES
// ==========================================

app.use("/api/quests", questRoutes);

// ==========================================
// CHARACTER ROUTES
// ==========================================

app.use("/api/character", characterRoutes);

// ==========================================
// REWARD ROUTES
// ==========================================

app.use("/api/rewards", rewardRoutes);

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Life RPG Backend is running!",
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  try {
    db.prepare("SELECT 1 AS healthy").get();

    res.json({
      success: true,
      status: "OK",
      message: "Life RPG API is healthy",
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      success: false,
      status: "ERROR",
      message: "Database is unavailable.",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
    });
  }

  console.error("Unhandled server error:", error);
  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(PORT, () => {
  console.log(
    `Life RPG Backend running on http://localhost:${PORT}`
  );
});

// ==========================================
// SERVER ERROR
// ==========================================

server.on("error", (error) => {
  console.error("SERVER ERROR:", error);
  process.exitCode = 1;
});

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close((error) => {
    if (error) {
      console.error("Shutdown error:", error);
      process.exitCode = 1;
    }

    db.close();
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));