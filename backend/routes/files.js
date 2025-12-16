// backend/routes/files.js
const express = require("express");
const { pool } = require("../db/pool");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/**
 * Case-insensitive key mapping:
 * frontend calls: /api/files/Heros, /api/files/sponsors, /api/files/ClubFinance, etc.
 * DB uses: image_settings.section enum values.
 */
const KEY_TO_SECTION = {
  heros: "hero_background",
  calltoaction: "call_to_action_background",
  clubfinance: "club_finance_background",
  clubnews: "club_news_background",
  contactus: "contact_background",
  events: "events_background",
  fixturesandresults: "fixtures_background",
  clubgallery: "gallery_background",
  meettheteam: "team_background",
  logo: "club_logo",
  sponsors: "club_logo", // if you later create sponsor_logo section, update this
};

router.get("/:key", authenticateToken, async (req, res) => {
  try {
    const rawKey = String(req.params.key || "").trim();
    const keyLower = rawKey.toLowerCase();

    const section = KEY_TO_SECTION[keyLower];

    if (!section) {
      return res.status(400).json({
        error: `Unknown image key: ${rawKey}`,
        allowed: Object.keys(KEY_TO_SECTION),
      });
    }

    const sql = `
      SELECT id, section, image_path, alt_text, is_active, created_date, updated_date
      FROM image_settings
      WHERE section = $1 AND is_active = true
      ORDER BY updated_date DESC
      LIMIT 20
    `;

    const result = await pool.query(sql, [section]);

    const files = result.rows.map((r) => ({
      id: r.id,
      section: r.section,
      image_path: r.image_path,
      url: r.image_path, // should be like /images/Heros/xyz.jpg (served by frontend public)
      alt_text: r.alt_text,
      is_active: r.is_active,
      created_date: r.created_date,
      updated_date: r.updated_date,
    }));

    res.json(files);
  } catch (err) {
    console.error("FILES route error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
