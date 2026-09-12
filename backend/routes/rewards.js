const express = require("express");

const db = require("../database/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// ==========================================
// GET ALL REWARDS
// ==========================================

router.get("/", authMiddleware, (req, res) => {
  try {
    const rewards = db
      .prepare(`
        SELECT
          id,
          name,
          description,
          cost,
          icon
        FROM rewards
        ORDER BY cost ASC
      `)
      .all();

    const user = db
      .prepare(`
        SELECT gold
        FROM users
        WHERE id = ?
      `)
      .get(req.user.userId);

    res.json({
      success: true,
      gold: user ? user.gold : 0,
      rewards,
    });
  } catch (error) {
    console.error("Get rewards error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load rewards.",
    });
  }
});

// ==========================================
// BUY REWARD
// ==========================================

router.post("/:id/buy", authMiddleware, (req, res) => {
  try {
    const rewardId = Number(req.params.id);

    if (!Number.isInteger(rewardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reward ID.",
      });
    }

    const reward = db
      .prepare(`
        SELECT *
        FROM rewards
        WHERE id = ?
      `)
      .get(rewardId);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: "Reward not found.",
      });
    }

    const user = db
      .prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `)
      .get(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.gold < reward.cost) {
      return res.status(400).json({
        success: false,
        message: "Not enough Gold.",
        gold: user.gold,
        required: reward.cost,
      });
    }

    const transaction = db.transaction(() => {
      const updateResult = db.prepare(`
        UPDATE users
        SET gold = gold - ?
        WHERE id = ?
          AND gold >= ?
      `).run(reward.cost, req.user.userId, reward.cost);

      if (updateResult.changes !== 1) {
        return null;
      }

      db.prepare(`
        INSERT INTO user_rewards (
          user_id,
          reward_id
        )
        VALUES (?, ?)
      `).run(req.user.userId, rewardId);

      return db
        .prepare("SELECT gold FROM users WHERE id = ?")
        .get(req.user.userId)
        .gold;
    });

    const newGold = transaction();

    if (newGold === null) {
      return res.status(400).json({
        success: false,
        message: "Not enough Gold.",
      });
    }

    res.json({
      success: true,
      message: `${reward.name} purchased successfully!`,
      reward,
      gold: newGold,
    });
  } catch (error) {
    console.error("Buy reward error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to purchase reward.",
    });
  }
});

// ==========================================
// GET USER INVENTORY
// ==========================================

router.get("/inventory", authMiddleware, (req, res) => {
  try {
    const inventory = db
      .prepare(`
        SELECT
          user_rewards.id,
          rewards.name,
          rewards.description,
          rewards.cost,
          rewards.icon,
          user_rewards.purchased_at
        FROM user_rewards
        INNER JOIN rewards
          ON user_rewards.reward_id = rewards.id
        WHERE user_rewards.user_id = ?
        ORDER BY user_rewards.purchased_at DESC
      `)
      .all(req.user.userId);

    res.json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error("Inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load inventory.",
    });
  }
});

module.exports = router;