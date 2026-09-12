const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../database/database");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || db.jwtSecret;

// ==========================================
// SIGNUP
// ==========================================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters.",
      });
    }

    if (cleanName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be 80 characters or fewer.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // bcrypt only uses the first 72 UTF-8 bytes. Reject longer passwords so
    // users never believe characters beyond bcrypt's limit are protected.
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be 72 UTF-8 bytes or fewer.",
      });
    }

    // Check if user already exists
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const createAccount = db.transaction(() => {
      const result = db
        .prepare(`
          INSERT INTO users (
            name,
            email,
            password,
            xp,
            level,
            gold,
            streak
          )
          VALUES (?, ?, ?, 0, 1, 100, 0)
        `)
        .run(cleanName, cleanEmail, hashedPassword);

      const userId = Number(result.lastInsertRowid);

      db.prepare(`
        INSERT INTO attributes (
          user_id,
          strength,
          intellect,
          vitality,
          discipline
        )
        VALUES (?, 1, 1, 1, 1)
      `).run(userId);

      return userId;
    });

    let userId;

    try {
      userId = createAccount();
    } catch (error) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      throw error;
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: userId,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Send response
    return res.status(201).json({
      success: true,
      message: "Character created successfully.",
      token,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        xp: 0,
        level: 1,
        gold: 100,
        streak: 0,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during signup.",
    });
  }
});

// ==========================================
// LOGIN
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be 72 UTF-8 bytes or fewer.",
      });
    }

    // Find user
    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          password,
          xp,
          level,
          gold,
          streak
        FROM users
        WHERE email = ?
      `)
      .get(cleanEmail);

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Send response
    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        gold: user.gold,
        streak: user.streak,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

module.exports = router;