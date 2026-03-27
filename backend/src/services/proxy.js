const fetch = require('node-fetch');
const db = require('../config/db');
const FormData = require('form-data');

let keyIndex = 0;

// ── API Configuration Helpers (Rotation Support) ──
async function getApiConnection() {
  try {
    const r = await db.query("SELECT config_key, config_value FROM admin_configs WHERE config_key IN ('api_keys', 'api_base_url')");
    const cfg = {};
    r.rows.forEach(row => cfg[row.config_key] = row.config_value);
    
    const keys = cfg.api_keys ? JSON.parse(cfg.api_keys) : [];
    const globalBase = cfg.api_base_url || process.env.BANANA_API_BASE || 'https://ai.comfly.chat';
    
    if (!keys.length) return { key: '', base: globalBase };
    
    // Random rotation
    const chosen = keys[Math.floor(Math.random() * keys.length)];
    return {
      key: chosen.key,
      base: chosen.url || globalBase
    };
  } catch (err) {
    console.error('Error fetching API config:', err);
    return { key: '', base: 'https://ai.comfly.chat' };
  }
}

// ── Image Generation ──
// Always uses async=true as requested.
//   POST /v1/images/generations?async=true  (JSON, no reference images)
//   POST /v1/images/edits?async=true        (multipart/form-data, with reference images)
async function generateImage({ model, prompt, aspectRatio, resolution, inputImages }) {
  const { key, base } = await getApiConnection();
  const hasImages = inputImages && inputImages.length > 0;

  // Always use async=true for all image generation models
  const url = hasImages
    ? `${base}/v1/images/edits?async=true`
    : `${base}/v1/images/generations?async=true`;

  const headers = { Authorization: `Bearer ${key}` };

  let body;
  if (hasImages) {
    // ── Edits endpoint: multipart/form-data ──
    const fd = new FormData();
    fd.append('model', model);
    fd.append('prompt', prompt);
    fd.append('response_format', 'url');
    if (aspectRatio && aspectRatio !== 'auto') fd.append('aspect_ratio', aspectRatio);
    if ((model === 'nano-banana-2' || model === 'gemini-3.1-flash-image-preview') && resolution) {
      fd.append('image_size', resolution);
    }
    
    // Attach up to 10 reference images as binary bits
    const imagesToProcess = inputImages.slice(0, 10);
    for (let i = 0; i < imagesToProcess.length; i++) {
      try {
        const imgData = imagesToProcess[i];
        let buffer;
        let filename = `image_${i}.png`;
        let contentType = 'image/png';

        if (imgData.startsWith('data:')) {
          const parts = imgData.split(',');
          const info = parts[0].match(/:(.*?);/);
          if (info) contentType = info[1];
          buffer = Buffer.from(parts[1], 'base64');
          if (contentType.includes('jpeg')) filename = `image_${i}.jpg`;
        } else {
          const imgResp = await fetch(imgData);
          buffer = await imgResp.buffer();
          const type = imgResp.headers.get('content-type');
          if (type) contentType = type;
        }

        fd.append('image', buffer, { filename, contentType });
      } catch (e) {
        console.error(`Failed to process reference image ${i}:`, e.message);
      }
    }
    body = fd;
    Object.assign(headers, fd.getHeaders());
  } else {
    // ── Generations endpoint: application/json ──
    headers['Content-Type'] = 'application/json';
    const payload = {
      model,
      prompt,
      response_format: 'url',
    };
    if (aspectRatio && aspectRatio !== 'auto') payload.aspect_ratio = aspectRatio;
    if ((model === 'nano-banana-2' || model === 'gemini-3.1-flash-image-preview') && resolution) {
      payload.image_size = resolution;
    }
    body = JSON.stringify(payload);
  }

  const resp = await fetch(url, { method: 'POST', headers, body });
  if (!resp.ok) {
    const text = await resp.text();
    let msg = `API Error: ${resp.status}`;
    try { const j = JSON.parse(text); msg = j.error?.message || j.message || msg; } catch {}
    throw new Error(msg);
  }
  return resp.json();
}

// ── Image Task Polling ──
async function pollTask(taskId) {
  const { key, base } = await getApiConnection();
  const resp = await fetch(`${base}/v1/images/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  });
  if (!resp.ok) return null;
  return resp.json();
}

// ── Chat Completions ──
async function chatCompletions({ model, messages, stream }) {
  const { key, base } = await getApiConnection();
  const resp = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, stream: !!stream }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Chat API Error ${resp.status}: ${text.substring(0, 200)}`);
  }
  return stream ? resp : resp.json();
}

// ── Video Generation (V2 API) ──
async function generateVideo({ model, prompt, aspectRatio, images, videos, enhance_prompt, enable_upsample }) {
  const { key, base } = await getApiConnection();
  const url = `${base}/v2/videos/generations`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  };

  let realModel = model;
  let resolution = '1080P'; // Default

  // Map frontend -4k IDs to base IDs + resolution param
  if (model.endsWith('-4k')) {
    realModel = model.replace('-4k', '');
    resolution = '4K';
  }

  const payload = {
    model: realModel,
    prompt,
    aspect_ratio: aspectRatio || '16:9',
    resolution: resolution,
    enhance_prompt: !!enhance_prompt,
    enable_upsample: !!enable_upsample,
  };

  // Video models can use up to 2 images as start/end frames
  if (images && images.length > 0) {
    payload.images = images.slice(0, 2);
  }
  if (videos && videos.length > 0) payload.videos = videos;

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!resp.ok) {
    const text = await resp.text();
    let msg = `Video API Error: ${resp.status}`;
    try { const j = JSON.parse(text); msg = j.error?.message || j.message || msg; } catch {}
    throw new Error(msg);
  }
  return resp.json();
}

// ── Video Task Polling (V2 API) ──
async function pollVideoTask(taskId) {
  const { key, base } = await getApiConnection();
  const resp = await fetch(`${base}/v2/videos/generations/${taskId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!resp.ok) return null;
  return resp.json();
}

module.exports = { generateImage, pollTask, chatCompletions, generateVideo, pollVideoTask };
