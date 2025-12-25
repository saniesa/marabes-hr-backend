const pool = require("../config/db");
const { logActivity } = require("./activityController");

// Get all settings and convert them into a single object
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM system_settings");
    // This turns [{key: 'currency', value: 'MAD'}] into {currency: 'MAD'}
    const settingsObj = rows.reduce((acc, row) => ({
      ...acc,
      [row.setting_key]: row.setting_value
    }), {});
    
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update or Insert multiple settings at once
exports.updateSettings = async (req, res) => {
  const settings = req.body; // Expects { company_name: 'Marabes', currency: 'MAD' ... }
  try {
    const entries = Object.entries(settings);
    
    for (const [key, value] of entries) {
      await pool.query(
        "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
        [key, value, value]
      );
    }

    await logActivity(req, "SETTINGS_UPDATE", "Updated system-wide configurations");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};