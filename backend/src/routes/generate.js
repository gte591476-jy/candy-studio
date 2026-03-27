const express = require('express');
const db = require('../config/db');
const points = require('../services/points');
const proxy = require('../services/proxy');
const { calculateCost } = require('../utils/costs');
const fetch = require('node-fetch');
const router = express.Router();

// ── Safe refund helper: prevents double refund via DB flag ──
async function safeRefund(userId, callId, cost, description) {
  try {
    // Check if already refunded
    const check = await db.query('SELECT refunded FROM api_calls WHERE id = $1', [callId]);
    if (!check.rows.length) {
      console.log(`[Refund] Call ${callId} not found in DB, skipping`);
      return false;
    }
    if (check.rows[0].refunded) {
      console.log(`[Refund] Already refunded for call ${callId}, skipping`);
      return false;
    }
    await points.refund(userId, cost, description);
    await db.query('UPDATE api_calls SET refunded = 1 WHERE id = $1', [callId]);
    console.log(`[Refund] Successfully refunded ${cost} for call ${callId}: ${description}`);
    return true;
  } catch (err) {
    console.error(`[Refund] FAILED to refund ${cost} for call ${callId}:`, err.message);
    return false;
  }
}

async function applyMembershipDiscount(userId, baseCost) {
  try {
    const userR = await db.query('SELECT membership_tier, membership_expire_at, points FROM users WHERE id = $1', [userId]);
    if (!userR.rows.length) return baseCost;
    const { membership_tier, membership_expire_at } = userR.rows[0];
    if (membership_tier && membership_tier !== 'none' && membership_expire_at) {
      if (new Date(membership_expire_at) > new Date()) {
        // Active membership — apply discount
        const msStr = await db.query("SELECT config_value FROM admin_configs WHERE config_key = 'memberships'");
        const memberships = msStr.rows.length ? JSON.parse(msStr.rows[0].config_value) : [];
        const ms = memberships.find(m => m.id === membership_tier);
        if (ms && ms.discountRate) {
          return +(baseCost * parseFloat(ms.discountRate)).toFixed(4);
        }
      } else {
        // Membership expired — clear points and reset tier
        const currentPoints = parseFloat(userR.rows[0].points);
        if (currentPoints > 0) {
          await db.query('UPDATE users SET points = 0, membership_tier = NULL, membership_expire_at = NULL, updated_at = NOW() WHERE id = $1', [userId]);
          await db.query(
            'INSERT INTO point_transactions (user_id, type, amount, balance_after, description) VALUES ($1,$2,$3,$4,$5)',
            [userId, 'consume', -currentPoints, 0, '会员到期，算力清零']
          );
        } else {
          await db.query('UPDATE users SET membership_tier = NULL, membership_expire_at = NULL, updated_at = NOW() WHERE id = $1', [userId]);
        }
        console.log(`[MembershipExpiry] User ${userId} membership expired at generate time, points cleared`);
      }
    }
  } catch (err) {
    console.error('Membership discount error:', err);
  }
  return baseCost;
}

router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { model, prompt, aspectRatio, resolution, inputImages, batchId } = req.body;

  if (!model || !prompt) return res.status(400).json({ error: '缺少模型或提示词' });

  let cost = await calculateCost(model, 'image');
  cost = await applyMembershipDiscount(userId, cost);
  cost = +cost.toFixed(2);
  const balance = await points.getBalance(userId);
  if (+(balance - cost).toFixed(2) < 0) return res.status(403).json({ error: '积分不足', required: cost, current: balance });

  let callId;
  try {
    const r = await db.query(
      'INSERT INTO api_calls (user_id, model, prompt, params, cost, status, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [userId, model, prompt, JSON.stringify({ aspectRatio, resolution, hasRef: !!(inputImages?.length) }), cost, 'processing', batchId]
    );
    callId = r.rows[0].id;

    await points.consume(userId, cost, `生成图片 [${model}] ${resolution || '2K'}`);

    const data = await proxy.generateImage({ model, prompt, aspectRatio, resolution, inputImages });
    if (data.status === 'FAILURE') throw new Error(data.fail_reason || 'Generation failed');

    const tid = data.task_id || data.data;
    if (tid && typeof tid === 'string') {
      await db.query('UPDATE api_calls SET task_id = $1 WHERE id = $2', [tid, callId]);
      res.json({ task_id: tid, call_id: callId, cost });
    } else {
      let urls = [];
      if (data.data && Array.isArray(data.data)) urls = data.data.map(d => d.url || d.b64_json);
      else if (data.url) urls = [data.url];

      await db.query('UPDATE api_calls SET status = $1, result_urls = $2 WHERE id = $3', ['success', JSON.stringify(urls), callId]);
      res.json({ data: urls.map(u => ({ url: u })), cost });
    }
  } catch (err) {
    console.error('Generate error:', err.message);
    if (callId) {
      await db.query("UPDATE api_calls SET status = 'failed' WHERE id = $1", [callId]);
      await safeRefund(userId, callId, cost, `生成失败退回 [${model}]`);
    }
    res.status(500).json({ error: err.message, call_id: callId });
  }
});

router.get('/task/:taskId', async (req, res) => {
  try {
    const data = await proxy.pollTask(req.params.taskId);
    if (!data) return res.status(404).json({ error: 'Task not found' });

    const info = data.data || {};
    if (info.status === 'SUCCESS') {
      const urls = (info.data?.data || []).map(d => d.url || d.b64_json);
      const callResult = await db.query('SELECT id, status FROM api_calls WHERE task_id = $1 AND user_id = $2', [req.params.taskId, req.user.id]);
      if (callResult.rows.length && callResult.rows[0].status === 'processing') {
        await db.query('UPDATE api_calls SET status = $1, result_urls = $2 WHERE id = $3', ['success', JSON.stringify(urls), callResult.rows[0].id]);
      }
    } else if (info.status === 'FAILURE') {
      const callResult = await db.query('SELECT id, status, cost, model, refunded FROM api_calls WHERE task_id = $1 AND user_id = $2', [req.params.taskId, req.user.id]);
      if (callResult.rows.length) {
        const call = callResult.rows[0];
        if (call.status === 'processing') {
          await db.query('UPDATE api_calls SET status = $1 WHERE id = $2', ['failed', call.id]);
        }
        if (!call.refunded) {
          await safeRefund(req.user.id, call.id, call.cost, `图片生成失败退回 [${call.model}]`);
        }
      }
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { model, messages } = req.body;
    if (!model || !messages) return res.status(400).json({ error: '缺少参数' });

    const stream = req.body.stream;
    const result = await proxy.chatCompletions({ model, messages, stream });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      result.body.pipe(res);
    } else {
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/video', async (req, res) => {
  const userId = req.user.id;
  const { model, prompt, aspectRatio, images, videos, enhance_prompt, enable_upsample, batchId } = req.body;

  if (!model || !prompt) return res.status(400).json({ error: '缺少模型或提示词' });

  let cost = await calculateCost(model, 'video');
  cost = await applyMembershipDiscount(userId, cost);
  cost = +cost.toFixed(2);
  const balance = await points.getBalance(userId);
  if (+(balance - cost).toFixed(2) < 0) return res.status(403).json({ error: '积分不足', required: cost, current: balance });

  let callId;
  try {
    const r = await db.query(
      'INSERT INTO api_calls (user_id, model, prompt, params, cost, status, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [userId, model, prompt, JSON.stringify({ aspectRatio, hasImages: !!(images?.length), hasVideos: !!(videos?.length) }), cost, 'processing', batchId]
    );
    callId = r.rows[0].id;

    await points.consume(userId, cost, `生成视频 [${model}]`);

    const data = await proxy.generateVideo({ model, prompt, aspectRatio, images, videos, enhance_prompt, enable_upsample });
    if (data.status === 'FAILURE') throw new Error(data.fail_reason || 'Generation failed');

    if (data.task_id) {
      await db.query('UPDATE api_calls SET task_id = $1 WHERE id = $2', [data.task_id, callId]);
      res.json({ task_id: data.task_id, call_id: callId, cost });
    } else {
      let urls = [];
      if (data.data && Array.isArray(data.data)) urls = data.data.map(d => d.url || d.b64_json);
      else if (data.url) urls = [data.url];
      else if (data.data?.output) urls = [data.data.output];

      await db.query('UPDATE api_calls SET status = $1, result_urls = $2 WHERE id = $3', ['success', JSON.stringify(urls), callId]);
      res.json({ data: urls.map(u => ({ url: u })), cost });
    }
  } catch (err) {
    console.error('Video Generate error:', err.message);
    if (callId) {
      await db.query("UPDATE api_calls SET status = 'failed' WHERE id = $1", [callId]);
      await safeRefund(userId, callId, cost, `视频生成失败退回 [${model}]`);
    }
    res.status(500).json({ error: err.message, call_id: callId });
  }
});

router.get('/video/task/:taskId', async (req, res) => {
  try {
    const data = await proxy.pollVideoTask(req.params.taskId);
    if (!data) return res.status(404).json({ error: 'Task not found' });

    if (data.status === 'SUCCESS') {
      let urls = [];
      if (data.data?.output) urls = [data.data.output];
      else if (data.data?.outputs) urls = data.data.outputs;
      
      const callResult = await db.query('SELECT id, status FROM api_calls WHERE task_id = $1 AND user_id = $2', [req.params.taskId, req.user.id]);
      if (callResult.rows.length && callResult.rows[0].status === 'processing') {
        await db.query('UPDATE api_calls SET status = $1, result_urls = $2 WHERE id = $3', ['success', JSON.stringify(urls), callResult.rows[0].id]);
      }
    } else if (data.status === 'FAILURE') {
      const callResult = await db.query('SELECT id, status, cost, model, refunded FROM api_calls WHERE task_id = $1 AND user_id = $2', [req.params.taskId, req.user.id]);
      if (callResult.rows.length) {
        const call = callResult.rows[0];
        if (call.status === 'processing') {
          await db.query('UPDATE api_calls SET status = $1 WHERE id = $2', ['failed', call.id]);
        }
        if (!call.refunded) {
          await safeRefund(req.user.id, call.id, call.cost, `视频生成失败退回 [${call.model}]`);
        }
      }
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refund/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const r = await db.query('SELECT id, status, cost, model, refunded FROM api_calls WHERE task_id = $1 AND user_id = $2', [taskId, userId]);
    
    if (r.rows.length) {
      const call = r.rows[0];
      // Already refunded — skip
      if (call.refunded) {
        return res.json({ success: true, refunded: false, reason: 'already_refunded' });
      }
      // Refund for processing, pending, or failed (if not yet refunded)
      if (call.status === 'processing' || call.status === 'pending' || call.status === 'failed') {
        if (call.status !== 'failed') {
          await db.query('UPDATE api_calls SET status = $1 WHERE id = $2', ['failed', call.id]);
        }
        const ok = await safeRefund(userId, call.id, call.cost, `任务失败/超时退回 [${call.model}]`);
        return res.json({ success: true, refunded: ok });
      }
      return res.json({ success: true, refunded: false, status: call.status });
    }
    res.status(404).json({ error: 'Task not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refund by call ID (for cases where no task_id was assigned)
router.post('/refund-by-callid/:callId', async (req, res) => {
  try {
    const callId = parseInt(req.params.callId);
    const userId = req.user.id;
    const r = await db.query('SELECT id, status, cost, model, refunded FROM api_calls WHERE id = $1 AND user_id = $2', [callId, userId]);
    
    if (r.rows.length) {
      const call = r.rows[0];
      if (call.refunded) {
        return res.json({ success: true, refunded: false, reason: 'already_refunded' });
      }
      if (call.status === 'processing' || call.status === 'pending' || call.status === 'failed') {
        if (call.status !== 'failed') {
          await db.query('UPDATE api_calls SET status = $1 WHERE id = $2', ['failed', call.id]);
        }
        const ok = await safeRefund(userId, call.id, call.cost, `任务失败退回 [${call.model}]`);
        return res.json({ success: true, refunded: ok });
      }
      return res.json({ success: true, refunded: false, status: call.status });
    }
    res.status(404).json({ error: 'Call not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/proxy-download', async (req, res) => {
  try {
    const { url, filename } = req.query;
    if (!url) return res.status(400).send('URL is required');

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    
    // Force download with proper filename
    let safeFilename = filename || (url.split('/').pop().split('?')[0]) || 'download';
    // Ensure filename has an extension
    if (!safeFilename.match(/\.\w{2,5}$/)) {
      if (contentType && contentType.includes('image/jpeg')) safeFilename += '.jpg';
      else if (contentType && contentType.includes('image/webp')) safeFilename += '.webp';
      else if (contentType && contentType.includes('video/mp4')) safeFilename += '.mp4';
      else safeFilename += '.png'; // Default to .png for images
    }
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);

    response.body.pipe(res);
  } catch (err) {
    console.error('Proxy download error:', err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;
