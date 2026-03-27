const express = require('express');
const { query } = require('../config/db');
const router = express.Router();

// ── Announcement ──
router.get('/announcement', async (req, res) => {
  try {
    const r = await query('SELECT config_key, config_value FROM admin_configs WHERE config_key LIKE $1', ['announcement_%']);
    const cfg = {}; r.rows.forEach(row => cfg[row.config_key] = row.config_value);
    if (cfg.announcement_enabled !== 'true') return res.json({ enabled: false });
    res.json({ enabled: true, title: cfg.announcement_title || '', content: cfg.announcement_content || '' });
  } catch { res.json({ enabled: false }); }
});

// ── Site Config ──
router.get('/site-config', async (req, res) => {
  try {
    const r = await query('SELECT config_key, config_value FROM admin_configs WHERE config_key LIKE $1', ['site_%']);
    const cfg = {}; r.rows.forEach(row => cfg[row.config_key] = row.config_value);
    res.json(cfg);
  } catch { res.json({}); }
});

// ── Public Config ──
router.get('/public-config', async (req, res) => {
  try {
    const r = await query("SELECT config_key, config_value FROM admin_configs WHERE config_key IN ('api_base_url', 'site_name', 'site_subtitle', 'memberships', 'model_costs')");
    const cfg = {};
    r.rows.forEach(row => cfg[row.config_key] = row.config_value);
    res.json({
      api_base_url: cfg.api_base_url || process.env.BANANA_API_BASE || 'https://ai.comfly.chat',
      site_name: cfg.site_name || 'Candy Studio',
      site_subtitle: cfg.site_subtitle || 'AI Creative Suite',
      memberships: cfg.memberships ? JSON.parse(cfg.memberships) : [],
      model_costs: cfg.model_costs ? JSON.parse(cfg.model_costs) : {}
    });
  } catch {
    res.json({ api_base_url: 'https://ai.comfly.chat', memberships: [], model_costs: {} });
  }
});

module.exports = router;
