const express = require("express");

const db = require("../database/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET character data
router.get("/", authMiddleware, (req, res) => {
  try {
    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          xp,
          level,
          gold,
          streak
        FROM users
        WHERE id = ?
      `)
      .get(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Character not found.",
      });
    }

    const attributes = db
      .prepare(`
        SELECT
          strength,
          intellect,
          vitality,
          discipline
        FROM attributes
        WHERE user_id = ?
      `)
      .get(req.user.userId);

    res.json({
      success: true,
      character: {
        user,
        attributes: attributes || {
          strength: 1,
          intellect: 1,
          vitality: 1,
          discipline: 1,
        },
      },
    });
  } catch (error) {
    console.error("Get character error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load character.",
    });
  }
});

// GET only attributes
router.get("/attributes", authMiddleware, (req, res) => {
  try {
    let attributes = db
      .prepare(`
        SELECT
          strength,
          intellect,
          vitality,
          discipline
        FROM attributes
        WHERE user_id = ?
      `)
      .get(req.user.userId);

    if (!attributes) {
      db.prepare(`
        INSERT INTO attributes (
          user_id,
          strength,
          intellect,
          vitality,
          discipline
        )
        VALUES (?, 1, 1, 1, 1)
      `).run(req.user.userId);

      attributes = {
        strength: 1,
        intellect: 1,
        vitality: 1,
        discipline: 1,
      };
    }

    res.json({
      success: true,
      attributes,
    });
  } catch (error) {
    console.error("Get attributes error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load attributes.",
    });
  }
});

module.exports = router;