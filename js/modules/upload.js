// ── Candy Studio: Upload Management ──
// Reference image upload, preview, and management

(function() {
  window.CS = window.CS || {};

  CS.handleFileUpload = function(e) { CS.addImageFiles(e.target.files); e.target.value = ''; };

  CS.handleDrop = function(e) {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    CS.addImageFiles(files);
  };

  CS.addImageFiles = function(files) {
    const filesToAdd = Array.from(files).slice(0, 8 - CS.S.imgs.length);
    let pending = filesToAdd.length;
    if (!pending) return;
    filesToAdd.forEach(f => {
      const r = new FileReader();
      r.onload = ev => {
        CS.S.imgs.push(ev.target.result);
        CS.renderUploads();
      };
      r.readAsDataURL(f);
    });
  };

  CS.rmUpload = function(i) { CS.S.imgs.splice(i, 1); CS.renderUploads(); };

  CS.clearAllUploads = function() { CS.S.imgs = []; CS.renderUploads(); };

  CS.addAsRef = async function(id) {
    const limit = CS.S.currentMode === 'video' ? 2 : 10;
    if (CS.S.imgs.length >= limit) { alert(`参考图片最多${limit}张`); return; }
    const blob = await CS.getBlob(id);
    if (!blob) { alert('无法加载该图片，请先下载后手动上传'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      CS.S.imgs.push(ev.target.result);
      CS.renderUploads();
    };
    reader.readAsDataURL(blob);
  };

  CS.renderUploads = function() {
    document.getElementById('upload-previews').innerHTML = CS.S.imgs.map((img, i) => `<div class="relative group"><img src="${img}" class="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-pointer" onclick="CS.previewUpload(${i})"/><button onclick="event.stopPropagation();CS.rmUpload(${i})" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">&times;</button><button onclick="event.stopPropagation();CS.previewUpload(${i})" class="absolute bottom-0.5 right-0.5 w-4 h-4 bg-black/50 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 3 21 3 21 9"/><line x1="14" y1="10" x2="21" y2="3"/></svg></button></div>`).join('');
  };

  CS.previewUpload = function(i) {
    document.getElementById('preview-img').src = CS.S.imgs[i];
    document.getElementById('preview-modal').classList.remove('hidden');
  };

  // ── Paste image from clipboard ──
  CS.handlePaste = function(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    const imageFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length) {
      e.preventDefault();
      CS.addImageFiles(imageFiles);
    }
  };

  document.addEventListener('paste', function(e) { CS.handlePaste(e); });
})();
