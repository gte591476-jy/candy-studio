// ── Candy Studio: Image Cache Helpers ──
// Caching images from URLs to IndexedDB and creating object URLs

(function() {
  window.CS = window.CS || {};

  function getImageDimensions(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function fetchViaCanvas(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          c.toBlob(b => resolve(b), 'image/png');
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  CS.fetchViaCanvas = fetchViaCanvas;
  CS.getImageDimensions = getImageDimensions;

  CS.cacheImage = async function(id, url) {
    try {
      let blob;
      // 1. Direct fetch
      try {
        const resp = await fetch(url);
        if (resp.ok) blob = await resp.blob();
      } catch {}
      // 2. Canvas fallback
      if (!blob) try { blob = await fetchViaCanvas(url); } catch {}
      // 3. Backend proxy fallback (for cross-origin GeminiGen URLs etc.)
      if (!blob && CS.useBackend && url.startsWith('http')) {
        try {
          const proxyResp = await fetch(`/api/generate/proxy-download?url=${encodeURIComponent(url)}`, { headers: CS.authHeaders() });
          if (proxyResp.ok) blob = await proxyResp.blob();
        } catch {}
      }
      if (!blob) return url;
      await CS.dbPut(id, blob);
      const localUrl = URL.createObjectURL(blob);
      CS.blobCache[id] = localUrl;
      const item = CS.S.history.find(h => h.id === id);
      if (item) { item.fileSize = blob.size; item.mimeType = blob.type; }
      try { const dim = await getImageDimensions(localUrl); if (item && dim) { item.width = dim.w; item.height = dim.h; } } catch {}
      CS.saveHistory();
      return localUrl;
    } catch { return url; }
  };

  CS.loadCachedUrl = async function(id, fallbackUrl) {
    if (CS.blobCache[id]) return CS.blobCache[id];
    const blob = await CS.dbGet(id);
    if (blob) {
      const u = URL.createObjectURL(blob); CS.blobCache[id] = u;
      const item = CS.S.history.find(h => h.id === id);
      if (item && !item.fileSize) { item.fileSize = blob.size; item.mimeType = blob.type; }
      if (item && !item.width) { try { const dim = await getImageDimensions(u); if (dim) { item.width = dim.w; item.height = dim.h; } } catch {} }
      return u;
    }
    return fallbackUrl || '';
  };
})();
