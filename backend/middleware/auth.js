const jwt = require("jsonwebtoken");
const db = require("../database/database");

const JWT_SECRET = process.env.JWT_SECRET || db.jwtSecret;

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required.",
      });
    }

    const headerParts = authHeader.match(/^Bearer\s+(\S+)$/i);

    if (!headerParts) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = headerParts[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!Number.isInteger(decoded.userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    const user = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    req.user = { userId: user.id };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

module.exports = authMiddleware;