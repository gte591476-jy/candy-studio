// ── Candy Studio: Results Display ──
// Results rendering, preview, download, and management

(function() {
  window.CS = window.CS || {};

  CS.renderResults = function() {
    const grid = document.getElementById('results-grid'), empty = document.getElementById('empty-state');
    const items = CS.S.history.filter(i => i.status === 'success' || i.status === 'failed');
    if (!items.length) { grid.classList.add('hidden'); empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden'); grid.classList.remove('hidden');
    grid.innerHTML = items.map(item => {
      if (item.status === 'failed') {
        return `<div class="fade-in bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
        <div class="h-32 bg-red-50 flex items-center justify-center"><div class="text-center px-4">
        <svg class="w-7 h-7 text-red-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <p class="text-[11px] text-red-400 break-all line-clamp-2">${item.error || '失败'}</p></div></div>
        <div class="p-2.5"><p class="text-[11px] text-gray-500 truncate">${CS.esc(item.prompt)}</p>
        <button onclick="CS.deleteResult('${item.id}')" class="mt-1.5 w-full text-[9px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded px-2 py-1 transition text-center">删除</button></div></div>`;
      }
      const isVideo = item.type === 'video' || (item.url && item.url.toLowerCase().split('?')[0].endsWith('.mp4'));
      const src = CS.blobCache[item.id] || item.url;
      const ratioTag = item.ratio ? `<span class="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">${item.ratio}</span>` : '';
      const ext = isVideo ? 'mp4' : 'png';
      const sizeStr = item.fileSize ? CS.fmtSize(item.fileSize) : '';
      const sizeTag = sizeStr ? `<span class="text-[10px] font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">${sizeStr}</span>` : '';
      const dimTag = item.width ? `<span class="text-[10px] font-semibold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded">${item.width}×${item.height}</span>` : '';
      const costTag = item.cost ? `<span class="text-[10px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">${item.cost}算力</span>` : '';
      const mediaHtml = isVideo ?
        `<div class="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
        <video src="${src}" class="w-full h-full object-cover" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 group-hover:opacity-100 transition">
          <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>` :
        `<img src="${src}" class="w-full aspect-square object-cover" loading="lazy" onerror="this.classList.add('img-placeholder');this.alt='图片加载失败'"/>`;

      return `<div class="fade-in result-img group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm cursor-pointer transition-all" data-rid="${item.id}" onclick="CS.openPreview('${item.id}')">
      <div class="relative">${mediaHtml}
      <div class="absolute bottom-2 left-2 right-2 flex justify-end gap-1.5">
        <button onclick="event.stopPropagation();CS.addAsRef('${item.id}')" class="bg-black/60 hover:bg-black/80 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1" title="添加为参考图片">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          参考图</button>
        <button onclick="event.stopPropagation();CS.copyResultPrompt(this,'${item.id}')" class="bg-black/60 hover:bg-black/80 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1" title="复制提示词">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          复制提示词</button>
        <button onclick="event.stopPropagation();CS.dlFile('${item.id}','candy-${item.id}.${ext}')" class="bg-black/60 hover:bg-black/80 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          下载</button>
        <button onclick="event.stopPropagation();CS.deleteResult('${item.id}')" class="bg-red-500/70 hover:bg-red-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1" title="删除">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          删除</button></div></div>
      <div class="p-2.5"><p class="text-[11px] text-gray-500 truncate" title="${CS.esc(item.prompt)}">${CS.esc(item.prompt)}</p>
      <div class="flex items-center gap-1.5 mt-1 flex-wrap"><span class="text-[10px] text-gray-300">${item.modelName || item.model}</span>${ratioTag}${dimTag}${sizeTag}${costTag}<span class="text-[10px] text-gray-300 ml-auto">${item.time}</span></div></div></div>`;
    }).join('');
  };

  CS.copyResultPrompt = function(btn, id) {
    const h = CS.S.history.find(x => x.id === id); if (!h) return;
    const ta = document.createElement('textarea'); ta.value = h.prompt; ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    btn.textContent = '已复制!'; setTimeout(() => { btn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> 复制提示词'; }, 1000);
  };

  CS.deleteResult = async function(id) {
    CS.S.history = CS.S.history.filter(h => h.id !== id);
    if (CS.blobCache[id]) { URL.revokeObjectURL(CS.blobCache[id]); delete CS.blobCache[id]; }
    try { await CS.dbDel(id); } catch {}
    CS.saveHistory(); CS.renderResults();
  };

  CS.clearHistory = async function() {
    if (!confirm('确定清空所有创作记录和缓存图片？')) return;
    CS.S.history = []; CS.saveHistory(); await CS.dbClear(); CS.blobCache = {}; CS.renderResults();
  };

  // ── Download ──
  CS.getBlob = async function(id) {
    let blob = await CS.dbGet(id);
    if (blob) return blob;
    const item = CS.S.history.find(h => h.id === id);
    if (!item?.url) return null;
    try { blob = await (await fetch(item.url)).blob(); } catch {}
    if (!blob) try { blob = await CS.fetchViaCanvas(item.url); } catch {}
    if (!blob) try { blob = await CS.fetchViaImgCanvas(item.url); } catch {}
    if (blob) await CS.dbPut(id, blob);
    return blob;
  };

  CS.fetchViaImgCanvas = function(url) {
    return new Promise((resolve) => {
      const img = new Image();
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
  };

  CS.dlFile = async function(id, filename) {
    // Ensure filename always has an extension
    if (filename && !filename.includes('.')) {
      const item = CS.S.history.find(h => h.id === id);
      const isVideo = item?.type === 'video' || (item?.url && item.url.toLowerCase().split('?')[0].endsWith('.mp4'));
      filename += isVideo ? '.mp4' : '.png';
    }

    // Get the blob
    let blob = await CS.getBlob(id);

    if (!blob) {
      const item = CS.S.history.find(h => h.id === id);
      if (item?.url) {
        if (CS.useBackend && item.url.startsWith('http')) {
          try {
            const proxyResp = await fetch(`/api/generate/proxy-download?url=${encodeURIComponent(item.url)}`, { headers: CS.authHeaders() });
            if (proxyResp.ok) blob = await proxyResp.blob();
          } catch {}
        }
        if (!blob) { try { blob = await (await fetch(item.url)).blob(); } catch {} }
        if (!blob && !filename.endsWith('.mp4')) {
          try { blob = await CS.fetchViaCanvas(item.url); } catch {}
          if (!blob) try { blob = await CS.fetchViaImgCanvas(item.url); } catch {}
        }
      }
    }

    if (blob) {
      const isVideo = filename && filename.endsWith('.mp4');
      const correctType = isVideo ? 'video/mp4' : 'image/png';
      if (blob.type !== correctType) blob = new Blob([blob], { type: correctType });

      // Method 1: Use native "Save As" dialog (most reliable)
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: isVideo ? [
              { description: 'MP4 视频', accept: { 'video/mp4': ['.mp4'] } }
            ] : [
              { description: 'PNG 图片', accept: { 'image/png': ['.png'] } }
            ]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (e) {
          if (e.name === 'AbortError') return; // User cancelled
          // Fall through to method 2
        }
      }

      // Method 2: Blob URL download (fallback)
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `candy-download.${isVideo ? 'mp4' : 'png'}`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      const item = CS.S.history.find(h => h.id === id);
      if (item?.url && CS.useBackend) {
        // Use proxy-download to ensure proper filename with extension
        const dlName = filename || `candy-${id}.png`;
        window.open(`/api/generate/proxy-download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(dlName)}`, '_blank');
      } else if (item?.url) {
        window.open(item.url, '_blank');
      }
    }
  };

  // ── Preview ──
  let currentPreviewId = null;

  CS.openPreview = function(id) {
    currentPreviewId = id;
    const item = CS.S.history.find(h => h.id === id);
    const src = CS.blobCache[id] || item?.url || '';
    const isVideo = item?.type === 'video' || (item?.url && item.url.toLowerCase().split('?')[0].endsWith('.mp4'));

    const modal = document.getElementById('preview-modal');
    const imgEL = document.getElementById('preview-img');

    if (isVideo) {
      imgEL.classList.add('hidden');
      let videoEL = document.getElementById('preview-video');
      if (!videoEL) {
        videoEL = document.createElement('video');
        videoEL.id = 'preview-video';
        videoEL.className = 'max-w-full max-h-full rounded-lg shadow-2xl';
        videoEL.controls = true;
        videoEL.autoplay = true;
        imgEL.parentElement.appendChild(videoEL);
      }
      videoEL.classList.remove('hidden');
      videoEL.src = src;
    } else {
      imgEL.classList.remove('hidden');
      const videoEL = document.getElementById('preview-video');
      if (videoEL) videoEL.classList.add('hidden');
      imgEL.src = src;
    }
    modal.classList.remove('hidden');
  };

  CS.closePreview = function() {
    document.getElementById('preview-modal').classList.add('hidden');
    const videoEL = document.getElementById('preview-video');
    if (videoEL) { videoEL.pause(); videoEL.src = ''; }
  };

  CS.downloadPreview = function() {
    if (!currentPreviewId) return;
    const item = CS.S.history.find(h => h.id === currentPreviewId);
    const isVideo = item?.type === 'video' || (item?.url && item.url.toLowerCase().split('?')[0].endsWith('.mp4'));
    CS.dlFile(currentPreviewId, `candy-${currentPreviewId}.${isVideo ? 'mp4' : 'png'}`);
  };
})();
