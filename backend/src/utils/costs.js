const { query } = require('../config/db');

// Hardcoded fallback costs (used only when admin has not configured prices)
const MODEL_COSTS = {
  // 图片模型 (image:xxx)
  'image:gemini-3.1-flash-image-preview': 0.10,
  'image:nano-banana-2': 0.20,
  'image:nano-banana': 0.08,
  'image:nano-banana-hd': 0.12,
  // 视频模型 (video:xxx)
  'video:veo3.1-fast': 0.20,
  'video:veo3.1': 0.30,
  'video:veo3.1-pro': 1.0,
  'video:veo3.1-fast-4k': 2.0,
  'video:veo3.1-pro-4k': 2.0,
};

/**
 * Calculate the cost for a model, reading from admin_configs first.
 * @param {string} model - raw model ID (e.g., 'nano-banana')
 * @param {string} category - 'image' or 'video'
 * @returns {number} cost in points
 */
async function calculateCost(model, category) {
  const prefixedKey = category + ':' + model;

  // 1. Try to read admin-configured prices
  let adminCosts = {};
  try {
    const r = await query("SELECT config_value FROM admin_configs WHERE config_key = 'model_costs'");
    if (r.rows.length) {
      adminCosts = JSON.parse(r.rows[0].config_value);
    }
  } catch(e) { console.error('Error reading model_costs:', e); }
  
  // 2. Prefer prefixed key from admin, then legacy unprefixed key from admin
  if (adminCosts[prefixedKey] !== undefined) return parseFloat(adminCosts[prefixedKey]);
  if (adminCosts[model] !== undefined) return parseFloat(adminCosts[model]);

  // 3. Fallback to hardcoded defaults
  if (MODEL_COSTS[prefixedKey] !== undefined) return MODEL_COSTS[prefixedKey];
  return 0.10;
}

module.exports = { MODEL_COSTS, calculateCost };
