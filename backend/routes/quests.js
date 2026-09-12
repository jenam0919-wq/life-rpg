const express = require("express");

const db = require("../database/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const MAX_QUEST_TITLE_LENGTH = 120;
const MAX_QUEST_DESCRIPTION_LENGTH = 2000;
const MAX_QUEST_REWARD = 1000000;

// ==========================================
// LEVEL SYSTEM
// ==========================================

function calculateLevel(xp) {
  let level = 1;
  let requiredXP = 100;

  while (xp >= requiredXP) {
    xp -= requiredXP;
    level++;
    requiredXP = Math.floor(requiredXP * 1.25);
  }

  return level;
}

// ==========================================
// ATTRIBUTE MAPPING
// ==========================================

function getAttributeColumn(category) {
  const categoryMap = {
    Strength: "strength",
    Intellect: "intellect",
    Vitality: "vitality",
    Discipline: "discipline",
  };

  return categoryMap[category] || "discipline";
}

// ==========================================
// RESET DAILY RECURRING QUESTS
// ==========================================

function resetDailyQuests(userId) {
  db.prepare(`
    UPDATE quests
    SET
      completed = 0,
      completed_at = NULL
    WHERE user_id = ?
      AND recurring = 1
      AND completed = 1
      AND DATE(completed_at) < DATE('now')
  `).run(userId);
}

// ==========================================
// GET ALL QUESTS
// ==========================================

router.get("/", authMiddleware, (req, res) => {
  try {
    // Reset completed daily quests from previous days
    resetDailyQuests(req.user.userId);

    const quests = db
      .prepare(`
        SELECT
          id,
          title,
          description,
          category,
          xp_reward,
          gold_reward,
          completed,
          completed_at,
          created_at,
          recurring
        FROM quests
        WHERE user_id = ?
        ORDER BY completed ASC, created_at DESC
      `)
      .all(req.user.userId);

    res.json({
      success: true,
      quests,
    });
  } catch (error) {
    console.error("Get quests error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load quests.",
    });
  }
});

// ==========================================
// CREATE QUEST
// ==========================================

router.post("/", authMiddleware, (req, res) => {
  try {
    const {
      title,
      description,
      category,
      xp_reward,
      gold_reward,
      recurring,
    } = req.body;

    // ------------------------------------------
    // VALIDATE TITLE
    // ------------------------------------------

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Quest title is required.",
      });
    }

    const cleanTitle = title.trim();

    if (cleanTitle.length > MAX_QUEST_TITLE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Quest title must be ${MAX_QUEST_TITLE_LENGTH} characters or fewer.`,
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Quest description must be text.",
      });
    }

    const cleanDescription =
      typeof description === "string"
        ? description.trim()
        : "";

    if (cleanDescription.length > MAX_QUEST_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Quest description must be ${MAX_QUEST_DESCRIPTION_LENGTH} characters or fewer.`,
      });
    }

    // ------------------------------------------
    // VALID CATEGORIES
    // ------------------------------------------

    const validCategories = [
      "Strength",
      "Intellect",
      "Vitality",
      "Discipline",
    ];

    const selectedCategory =
      validCategories.includes(category)
        ? category
        : "Discipline";

    // ------------------------------------------
    // REWARDS
    // ------------------------------------------

    const requestedXP = Number(xp_reward);
    const requestedGold = Number(gold_reward);

    const xpReward =
      Number.isSafeInteger(requestedXP) && requestedXP > 0
        ? requestedXP
        : 50;

    const goldReward =
      Number.isSafeInteger(requestedGold) && requestedGold > 0
        ? requestedGold
        : 10;

    if (
      xpReward > MAX_QUEST_REWARD ||
      goldReward > MAX_QUEST_REWARD
    ) {
      return res.status(400).json({
        success: false,
        message: `Quest rewards must be ${MAX_QUEST_REWARD} or fewer.`,
      });
    }

    // ------------------------------------------
    // RECURRING
    // ------------------------------------------

    const isRecurring =
      recurring === true ||
      recurring === 1 ||
      recurring === "1";

    // ------------------------------------------
    // CREATE QUEST
    // ------------------------------------------

    const result = db
      .prepare(`
        INSERT INTO quests (
          user_id,
          title,
          description,
          category,
          xp_reward,
          gold_reward,
          recurring
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.user.userId,
        cleanTitle,
        cleanDescription,
        selectedCategory,
        xpReward,
        goldReward,
        isRecurring ? 1 : 0
      );

    const quest = db
      .prepare(`
        SELECT *
        FROM quests
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: "Quest created successfully.",
      quest,
    });

  } catch (error) {
    console.error("Create quest error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create quest.",
    });
  }
});

// ==========================================
// COMPLETE QUEST
// ==========================================

router.patch("/:id/complete", authMiddleware, (req, res) => {
  try {
    const questId =
      Number(req.params.id);

    // ------------------------------------------
    // VALIDATE ID
    // ------------------------------------------

    if (!Number.isInteger(questId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quest ID.",
      });
    }

    // ------------------------------------------
    // RESET OLD DAILY QUEST
    // ------------------------------------------

    resetDailyQuests(req.user.userId);

    // ------------------------------------------
    // FIND QUEST
    // ------------------------------------------

    const quest = db
      .prepare(`
        SELECT *
        FROM quests
        WHERE id = ?
          AND user_id = ?
      `)
      .get(
        questId,
        req.user.userId
      );

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: "Quest not found.",
      });
    }

    // ------------------------------------------
    // ALREADY COMPLETED
    // ------------------------------------------

    if (quest.completed === 1) {
      return res.status(400).json({
        success: false,
        message:
          "This quest has already been completed today.",
      });
    }

    // ------------------------------------------
    // FIND USER
    // ------------------------------------------

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

    // ------------------------------------------
    // XP
    // ------------------------------------------

    const newXP =
      user.xp + quest.xp_reward;

    // ------------------------------------------
    // GOLD
    // ------------------------------------------

    const newGold =
      user.gold + quest.gold_reward;

    // ------------------------------------------
    // LEVEL
    // ------------------------------------------

    const oldLevel =
      user.level;

    const newLevel =
      calculateLevel(newXP);

    // ------------------------------------------
    // ATTRIBUTE
    // ------------------------------------------

    const attributeColumn =
      getAttributeColumn(
        quest.category
      );

    // ------------------------------------------
    // STREAK
    // ------------------------------------------

    const recentLogs = db
      .prepare(`
        SELECT DISTINCT
          DATE(completed_at) AS completion_date
        FROM quest_logs
        WHERE user_id = ?
        ORDER BY completion_date DESC
      `)
      .all(req.user.userId);

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const yesterday =
      new Date(
        Date.now() -
        24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];

    const completedToday =
      recentLogs.some(
        (log) =>
          log.completion_date === today
      );

    const completedYesterday =
      recentLogs.some(
        (log) =>
          log.completion_date === yesterday
      );

    let newStreak =
      user.streak || 0;

    // Only increase streak once per day
    if (!completedToday) {

      if (completedYesterday) {
        newStreak =
          newStreak + 1;
      } else {
        newStreak = 1;
      }

    }

    // ------------------------------------------
    // DATABASE TRANSACTION
    // ------------------------------------------

    const transaction =
      db.transaction(() => {

        // Mark quest completed
        const completion = db.prepare(`
          UPDATE quests
          SET
            completed = 1,
            completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND user_id = ?
            AND completed = 0
        `).run(
          questId,
          req.user.userId
        );

        if (completion.changes !== 1) {
          return false;
        }

        // Update user progression
        db.prepare(`
          UPDATE users
          SET
            xp = ?,
            level = ?,
            gold = ?,
            streak = ?
          WHERE id = ?
        `).run(
          newXP,
          newLevel,
          newGold,
          newStreak,
          req.user.userId
        );

        // Increase character attribute
        db.prepare(`
          UPDATE attributes
          SET
            ${attributeColumn} =
            ${attributeColumn} + 1
          WHERE user_id = ?
        `).run(
          req.user.userId
        );

        // Save historical completion
        db.prepare(`
          INSERT INTO quest_logs (
            user_id,
            quest_id,
            quest_title,
            quest_category,
            xp_reward,
            gold_reward
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          req.user.userId,
          questId,
          quest.title,
          quest.category,
          quest.xp_reward,
          quest.gold_reward
        );

        return true;
      });

    if (!transaction()) {
      return res.status(400).json({
        success: false,
        message:
          "This quest has already been completed today.",
      });
    }

    // ------------------------------------------
    // GET UPDATED ATTRIBUTES
    // ------------------------------------------

    const attributes =
      db
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

    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    res.json({
      success: true,

      message:
        quest.recurring === 1
          ? "Daily quest completed!"
          : "Quest completed!",

      rewards: {
        xp: quest.xp_reward,
        gold: quest.gold_reward,
      },

      progression: {
        oldLevel,
        newLevel,
        levelUp:
          newLevel > oldLevel,
        totalXP: newXP,
        totalGold: newGold,
        streak: newStreak,
      },

      quest: {
        id: quest.id,
        title: quest.title,
        recurring:
          quest.recurring === 1,
      },

      attributes,
    });

  } catch (error) {

    console.error(
      "Complete quest error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to complete quest.",
    });
  }
});

// =========================================================
// QUEST HISTORY
// =========================================================

router.get("/history", authMiddleware, (req, res) => {
  try {
    const history = db
      .prepare(`
        SELECT
          quest_logs.id,
          quest_logs.quest_id,
          quest_logs.completed_at,
          quest_logs.quest_title AS title,
          quest_logs.quest_category AS category,
          quest_logs.xp_reward,
          quest_logs.gold_reward
        FROM quest_logs
        WHERE quest_logs.user_id = ?
        ORDER BY quest_logs.completed_at DESC
      `)
      .all(req.user.userId);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error(
      "Quest history error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load quest history.",
    });
  }
});

// ==========================================
// DELETE QUEST
// ==========================================

router.delete("/:id", authMiddleware, (req, res) => {
  try {
    const questId =
      Number(req.params.id);

    if (!Number.isInteger(questId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quest ID.",
      });
    }

    const quest = db
      .prepare(`
        SELECT id
        FROM quests
        WHERE id = ?
          AND user_id = ?
      `)
      .get(
        questId,
        req.user.userId
      );

    if (!quest) {
      return res.status(404).json({
        success: false,
        message: "Quest not found.",
      });
    }

    db.prepare(`
      DELETE FROM quests
      WHERE id = ?
        AND user_id = ?
    `).run(
      questId,
      req.user.userId
    );

    res.json({
      success: true,
      message:
        "Quest deleted successfully.",
    });

  } catch (error) {

    console.error(
      "Delete quest error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete quest.",
    });
  }
});

module.exports = router;