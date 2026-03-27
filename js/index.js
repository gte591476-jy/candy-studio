tailwind.config = {
      theme: { extend: { fontFamily: { sans: ['Inter','system-ui','sans-serif'] } } }
    }
  </script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',system-ui,sans-serif;background:#f8f9fa;color:#1a1a2e;height:100vh;overflow:hidden}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d4d4d8;border-radius:3px}
    .model-card{transition:all .2s}.model-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
    .model-card.active{border-color:#22c55e!important;background:linear-gradient(135deg,#f0fdf4,#dcfce7)}
    .badge-new{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:700}
    .badge-hot{background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:700}
    .gen-btn{background:linear-gradient(135deg,#22c55e,#16a34a);transition:all .2s}
    .gen-btn:hover{background:linear-gradient(135deg,#16a34a,#15803d);transform:translateY(-1px);box-shadow:0 4px 15px rgba(34,197,94,.4)}
    .gen-btn:active{transform:scale(.97)}
    .ratio-btn{transition:all .15s}.ratio-btn.active{background:#22c55e!important;color:#fff!important;border-color:#22c55e!important}
    .res-btn.active{background:#22c55e!important;color:#fff!important}
    .sidebar-item.active{background:rgba(34,197,94,.12);color:#16a34a;font-weight:600;border-right:3px solid #22c55e}
    .result-img{transition:all .2s}.result-img:hover{transform:scale(1.02);box-shadow:0 8px 25px rgba(0,0,0,.12)}
    .fade-in{animation:fadeIn .3s ease}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}.spinner{animation:spin .8s linear infinite}
    .upload-zone{border:2px dashed #d4d4d8;transition:all .2s}.upload-zone:hover{border-color:#22c55e;background:#f0fdf4}
    .img-placeholder{background:repeating-linear-gradient(45deg,#f1f1f1,#f1f1f1 10px,#fafafa 10px,#fafafa 20px)}
    .resize-handle{width:5px;cursor:col-resize;background:transparent;position:relative;flex-shrink:0;z-index:10;transition:background .15s}
    .resize-handle:hover,.resize-handle.active{background:#22c55e}
    .resize-handle::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:3px;height:32px;border-radius:2px;background:#d4d4d8;transition:background .15s}
    .resize-handle:hover::after,.resize-handle.active::after{background:#22c55e}
  </style>
</head>
<body>
<div id="app" class="flex h-screen">
  <!-- Left Sidebar -->
  <aside id="panel-sidebar" class="bg-white border-r border-gray-200 flex flex-col shrink-0" style="width:224px">
    <div class="p-4 border-b border-gray-100">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/></svg>
        </div>
        <div><div class="font-bold text-sm text-gray-900 site-name-text">Candy Studio</div><div class="text-[10px] text-gray-400 font-medium site-subtitle-text">AI Creative Suite</div></div>
      </div>
    </div>
    <!-- Auth / User Section -->
    <div id="auth-section" class="px-3 pt-4 pb-2">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">账户</div>
      <!-- Not logged in -->
      <div id="auth-login-form" class="px-2 space-y-2">
        <input id="auth-email" type="email" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition" placeholder="邮箱"/>
        <input id="auth-pass" type="password" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition" placeholder="密码"/>
        <div class="flex gap-1.5">
          <button onclick="doLogin()" class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold bg-green-500 text-white hover:bg-green-600 transition">登录</button>
          <button onclick="doRegister()" class="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition">注册</button>
        </div>
        <p id="auth-error" class="text-[10px] text-red-500 hidden"></p>
      </div>
      <!-- Logged in -->
      <div id="auth-user-info" class="px-2 space-y-2 hidden">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="min-w-0 flex-1">
            <div id="user-nickname" class="text-xs font-bold text-gray-800 truncate"></div>
            <div id="user-email" class="text-[10px] text-gray-400 truncate"></div>
          </div>
        </div>
        <div class="px-2 py-2 rounded-lg bg-green-50 border border-green-200 text-center">
          <div class="text-[10px] text-gray-400">余额</div>
          <div id="user-points" class="text-lg font-bold text-green-600">0</div>
        </div>
        <button onclick="refreshProfile()" class="w-full py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 018.9 5.5"/><path d="M22 12c0 5.5-4.5 10-10 10a10 10 0 01-8.9-5.5"/></svg>
          刷新余额</button>
        <button onclick="openUsage()" class="w-full py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition flex items-center justify-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          使用历史</button>
        <button onclick="openRecharge()" class="w-full py-1.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 transition flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          充值算力</button>
        <button onclick="doLogout()" class="w-full py-1.5 rounded-lg text-[11px] font-semibold text-red-400 hover:bg-red-50 border border-gray-200 transition">退出登录</button>
      </div>
    </div>
    <div class="px-3 pt-2 pb-2">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">AI 创作</div>
      <div id="side-image" onclick="setMode('image')" class="sidebar-item active flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        <span class="text-sm">图片生成</span><span class="badge-new ml-auto">Pro</span>
      </div>
      <div id="side-video" onclick="setMode('video')" class="sidebar-item flex items-center gap-2.5 px-3 py-2.5 rounded-lg mt-1 cursor-pointer transition">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2" r="2"/></svg>
        <span class="text-sm">视频生成</span><span class="badge-new ml-auto">New</span>
      </div>
    </div>
    <div class="flex-1"></div>
    <!-- API Status Footer -->
    <div class="px-4 py-4 border-t border-gray-100 mt-auto">
      <div class="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
        <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span class="text-[11px] font-bold text-green-700">系统运行正常</span>
      </div>
      <div id="api-base-info" class="hidden"></div>
    </div>
  </aside>
  <div class="resize-handle" data-resize="sidebar"></div>

  <!-- Center Controls -->
  <div id="panel-controls" class="shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto" style="width:400px">
    <div class="p-5 pb-3 border-b border-gray-100">
      <h2 class="text-base font-bold text-gray-900 mb-1">选择模型</h2>
      <p class="text-xs text-gray-400">选择适合你需求的AI模型</p>
    </div>
    <div class="p-4">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">图片模型</div>
      <div class="relative" id="model-selector">
        <div id="model-selected" class="border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-green-400 transition flex items-center gap-3" onclick="toggleModelDropdown()">
          <div class="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2"><span id="sel-model-name" class="text-sm font-bold text-gray-800"></span><span id="sel-model-badge"></span></div>
            <div id="sel-model-desc" class="text-[10px] text-gray-400"></div>
          </div>
          <span id="sel-model-cost" class="text-sm font-bold text-green-600 shrink-0"></span>
          <svg id="model-arrow" class="w-4 h-4 text-gray-400 shrink-0 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div id="model-dropdown" class="hidden absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"></div>
      </div>
    </div>
    <div class="border-t border-gray-100 mx-4"></div>
    <div class="p-4">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">画面比例</div>
      <div class="flex flex-wrap gap-1.5" id="ratio-grid"></div>
    </div>
    <div id="resolution-section" class="px-4 pb-4">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">分辨率</div>
      <div class="flex gap-2">
        <button class="res-btn flex-1 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-600 cursor-pointer" data-res="1K" onclick="setRes('1K')">1K</button>
        <button class="res-btn active flex-1 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-600 cursor-pointer" data-res="2K" onclick="setRes('2K')">2K</button>
        <button class="res-btn flex-1 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-600 cursor-pointer" data-res="4K" onclick="setRes('4K')">4K</button>
      </div>
    </div>
    <div class="border-t border-gray-100 mx-4"></div>
    <div class="p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">参考图片 <span class="text-gray-300 font-normal">(可选)</span></div>
        <button onclick="clearAllUploads()" class="text-[10px] text-red-400 hover:text-red-600 font-medium transition">一键清空</button>
      </div>
      <div id="drop-zone" class="upload-zone rounded-xl p-4 text-center cursor-pointer" onclick="document.getElementById('file-upload').click()" ondragover="event.preventDefault();this.classList.add('border-green-500','bg-green-50')" ondragleave="this.classList.remove('border-green-500','bg-green-50')" ondrop="event.preventDefault();this.classList.remove('border-green-500','bg-green-50');handleDrop(event)">
        <input type="file" id="file-upload" accept="image/*" multiple class="hidden" onchange="handleFileUpload(event)"/>
        <svg class="w-7 h-7 text-gray-300 mx-auto mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p class="text-xs text-gray-400">点击、拖拽或粘贴上传</p>
      </div>
      <div id="upload-previews" class="flex flex-wrap gap-2 mt-3"></div>
    </div>
    <div class="border-t border-gray-100 mx-4"></div>
    <div class="p-4 flex-1 flex flex-col">
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">文字描述</div>
      <textarea id="prompt-input" class="flex-1 min-h-[80px] w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition" placeholder="请输入文字描述..."></textarea>
    </div>
    <div class="p-4 pt-0">
      <div class="flex items-center gap-2 mb-3">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">并发数量</div>
        <div id="cost-preview" class="text-[11px] font-bold text-orange-500 ml-1"></div>
        <div class="flex items-center ml-auto border border-gray-200 rounded-lg overflow-hidden">
          <button onclick="setBatch(-1)" class="px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 text-sm font-bold leading-none">−</button>
          <span id="batch-count" class="px-3 py-1.5 text-sm font-bold text-green-600 bg-green-50 min-w-[36px] text-center leading-none">1</span>
          <button onclick="setBatch(1)" class="px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 text-sm font-bold leading-none">+</button>
        </div>
      </div>
      <button id="generate-btn" class="gen-btn w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2" onclick="generate()">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        开始生成
      </button>
    </div>
  </div>

  <div class="resize-handle" data-resize="controls"></div>

  <!-- Results Panel -->
  <div id="panel-results" class="flex-1 bg-gray-50/80 flex flex-col overflow-hidden" style="min-width:300px">
    <div class="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
      <div><h2 class="text-base font-bold text-gray-900">我的创作</h2><p class="text-xs text-gray-400">图片已保存到本地，只保存7天。有重要图片请下载</p></div>
      <button onclick="clearHistory()" class="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition font-medium">清空</button>
    </div>
    <div id="results-container" class="flex-1 overflow-y-auto p-6">
      <div id="empty-state" class="flex flex-col items-center justify-center h-full text-center">
        <div class="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        </div>
        <p class="text-sm font-medium text-gray-400 mb-1">暂无创作</p>
        <p class="text-xs text-gray-300">选择模型并输入描述开始创作</p>
      </div>
      <div id="results-grid" class="grid grid-cols-4 gap-3 hidden"></div>
    </div>
  </div>

  <div class="resize-handle" data-resize="results"></div>

  <!-- Task Queue -->
  <div id="panel-tasks" class="shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden" style="width:260px">
    <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
      <div><h3 class="text-sm font-bold text-gray-900">任务队列</h3><p class="text-[10px] text-gray-400" id="task-summary">暂无任务</p><p class="text-[10px] font-bold text-orange-500" id="today-cost"></p><p class="text-[10px] text-gray-400" id="yesterday-cost"></p></div>
      <button onclick="clearDoneTasks()" class="text-[10px] text-gray-400 hover:text-red-500 transition font-medium shrink-0">清已完成</button>
    </div>
    <div id="task-list" class="flex-1 overflow-y-auto p-3 space-y-2"></div>
  </div>

</div>

<!-- Announcement Popup -->
<div id="announcement-modal" class="fixed inset-0 z-50 hidden" style="background:rgba(0,0,0,.3);backdrop-filter:blur(4px)">
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[95vw] bg-white rounded-2xl shadow-2xl overflow-hidden">
    <div class="p-5 border-b border-gray-100">
      <h3 id="ann-popup-title" class="font-bold text-gray-900"></h3>
    </div>
    <div id="ann-popup-content" class="p-5 text-sm text-gray-600 leading-relaxed max-h-[50vh] overflow-y-auto" style="white-space:pre-wrap"></div>
    <div class="p-5 border-t border-gray-100">
      <button onclick="document.getElementById('announcement-modal').classList.add('hidden')" class="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style="background:linear-gradient(135deg,#22c55e,#16a34a)">我知道了</button>
    </div>
  </div>
</div>



<!-- Recharge Modal -->
<div id="recharge-modal" class="fixed inset-0 z-50 hidden">
  <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" onclick="closeRecharge()"></div>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden fade-in">
    <div class="p-5 border-b border-gray-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        <h3 class="font-bold text-gray-900">充值算力</h3>
      </div>
      <button onclick="closeRecharge()" class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="p-5">
      <p class="text-xs text-gray-400 mb-4">选择充值额度（充值比例 1算力 = ¥1.10）</p>
      <div class="grid grid-cols-4 gap-2.5 mb-4" id="recharge-grid"></div>
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
        <div class="flex-1">
          <div class="text-[10px] text-gray-400 mb-1">自定义算力</div>
          <input id="recharge-custom" type="number" min="1" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition" placeholder="输入算力数量..." oninput="updateRechargePrice()"/>
        </div>
        <div class="text-center shrink-0">
          <div class="text-[10px] text-gray-400 mb-1">应付金额</div>
          <div id="recharge-price" class="text-lg font-bold text-orange-500">¥0.00</div>
        </div>
      </div>
      <div id="recharge-selected" class="text-center text-xs text-gray-400 mb-3"></div>
      <!-- QR Code Area (hidden until payment created) -->
      <div id="recharge-qr-area" class="hidden text-center py-4">
        <div class="inline-block p-4 bg-white border-2 border-green-200 rounded-2xl">
          <canvas id="recharge-qr-canvas" width="200" height="200"></canvas>
        </div>
        <p class="text-sm font-semibold text-gray-700 mt-3">请使用支付宝扫码支付</p>
        <p id="recharge-qr-info" class="text-xs text-gray-400 mt-1"></p>
        <p id="recharge-qr-status" class="text-xs font-bold text-orange-500 mt-2">等待支付...</p>
      </div>
    </div>
    <div class="p-5 border-t border-gray-100 flex justify-end gap-2">
      <button onclick="closeRecharge()" class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl transition font-medium">取消</button>
      <button id="recharge-submit-btn" onclick="confirmRecharge()" class="px-5 py-2.5 text-sm text-white font-semibold rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 transition">确认充值</button>
    </div>
  </div>
</div>

<!-- Usage History Modal -->
<div id="usage-modal" class="fixed inset-0 z-50 hidden">
  <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" onclick="closeUsage()"></div>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl overflow-hidden fade-in" style="width:80vw;max-width:900px;max-height:85vh;display:flex;flex-direction:column">
    <div class="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <h3 class="text-lg font-bold text-gray-900">算力使用历史</h3>
      </div>
      <button onclick="closeUsage()" class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="p-6 overflow-y-auto flex-1">
      <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">详细记录</div>
      <div id="usage-list" class="space-y-2 mb-4 custom-scrollbar"></div>
      <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button id="usage-prev" onclick="changeUsagePage(-1)" class="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">上一页</button>
        <span id="usage-page-info" class="text-xs text-gray-400">第 1 页</span>
        <button id="usage-next" onclick="changeUsagePage(1)" class="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">下一页</button>
      </div>
    </div>
  </div>
</div>


<!-- Preview Modal -->
<div id="preview-modal" class="fixed inset-0 z-50 hidden cursor-zoom-out" onclick="closePreview()">
  <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
  <div class="absolute inset-0 flex items-center justify-center p-8">
    <img id="preview-img" src="" class="max-w-full max-h-full rounded-lg shadow-2xl"/>
  </div>
  <div class="absolute top-4 right-4 flex gap-2">
    <button onclick="event.stopPropagation();downloadPreview()" class="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-xs font-medium gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      下载</button>
    <button class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
</div>

<script>
let API_DIRECT = 'https://ai.comfly.chat';
const API_BACKEND = '/api';
let useBackend = false;
let authToken = localStorage.getItem('candy_token') || '';
function API_URL() { return useBackend ? '' : API_DIRECT; }
function authHeaders() { return useBackend && authToken ? { Authorization: 'Bearer ' + authToken } : {}; }
const DB_NAME = 'candy_cache';
const DB_VER = 1;
const STORE = 'images';

const MODELS = [
  { id:'gemini-3.1-flash-image-preview', name:'Nano Banana 2', desc:'新一代创作引擎', badge:'new', cost:0.1,
    ratios:['auto','1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9','1:4','4:1','1:8','8:1'] },
  { id:'nano-banana-2', name:'Nano Banana Pro', desc:'次世代图像生成', badge:'hot', cost:0.2,
    ratios:['auto','1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'] },
  { id:'nano-banana', name:'Nano Banana', desc:'标准生成速度', badge:null, cost:0.08,
    ratios:['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'] },
  { id:'nano-banana-hd', name:'Nano Banana HD', desc:'高清画质输出', badge:null, cost:0.12,
    ratios:['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'] },
];

const VIDEO_MODELS = [
  { id:'veo3.1-fast', name:'Veo 3.1 Fast', desc:'快速视频生成，极致速度', badge:'new', cost:0.2, ratios:['16:9','9:16'] },
  { id:'veo3.1', name:'Veo 3.1', desc:'标准视频生成，性价比之选', badge:'hot', cost:0.3, ratios:['16:9','9:16'] },
  { id:'veo3.1-pro', name:'Veo 3.1 Pro', desc:'高质量视频生成，细节丰富', badge:'hot', cost:1.0, ratios:['16:9','9:16'] },
  { id:'veo3.1-fast-4k', name:'Veo 3.1 Fast 4K', desc:'快速 4K 高清视频生成', badge:'new', cost:2.0, ratios:['16:9','9:16'] },
  { id:'veo3.1-pro-4k', name:'Veo 3.1 Pro 4K', desc:'专业级 4K 超清视频生成', badge:'pro', cost:2.0, ratios:['16:9','9:16'] },
];

let S = { currentMode:'image', model:'gemini-3.1-flash-image-preview', ratio:'auto', res:'2K', batch:1, imgs:[], history:[], tasks:[], cfg:{apiKey:''}, user:null };
// ── User-specific storage prefix ──
let _storagePrefix = '';
function setStoragePrefix(uid) { _storagePrefix = uid ? '_' + uid : ''; }
function skey(base) { return base + _storagePrefix; }
let costLog = {};
function addCostLog(cost) {
  const d = new Date().toLocaleDateString();
  costLog[d] = (costLog[d] || 0) + cost;
  try { localStorage.setItem(skey('candy_cost_log'), JSON.stringify(costLog)); } catch {}
}
function getDayCost(date) { return costLog[date] || 0; }
function loadCostLog() { try { costLog = JSON.parse(localStorage.getItem(skey('candy_cost_log')) || '{}'); } catch { costLog = {}; } }
let blobCache = {};

// ── IndexedDB for persistent image cache ──
function openDB() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}
async function dbPut(id, blob) {
  try { const db = await openDB(); const tx = db.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(blob, id); await new Promise(r => { tx.oncomplete = r; }); db.close(); } catch {}
}
async function dbGet(id) {
  try { const db = await openDB(); const tx = db.transaction(STORE,'readonly'); const req = tx.objectStore(STORE).get(id); return new Promise(r => { req.onsuccess = () => { db.close(); r(req.result); }; req.onerror = () => { db.close(); r(null); }; }); } catch { return null; }
}
async function dbDel(id) {
  try { const db = await openDB(); const tx = db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(id); await new Promise(r => { tx.oncomplete = r; }); db.close(); } catch {}
}
async function dbClear() {
  try { const db = await openDB(); const tx = db.transaction(STORE,'readwrite'); tx.objectStore(STORE).clear(); await new Promise(r => { tx.oncomplete = r; }); db.close(); } catch {}
}

async function cacheImage(id, url) {
  try {
    let blob;
    try {
      const resp = await fetch(url);
      blob = await resp.blob();
    } catch {
      blob = await fetchViaCanvas(url);
    }
    if (!blob) return url;
    await dbPut(id, blob);
    const localUrl = URL.createObjectURL(blob);
    blobCache[id] = localUrl;
    const item = S.history.find(h => h.id === id);
    if (item) { item.fileSize = blob.size; item.mimeType = blob.type; }
    try { const dim = await getImageDimensions(localUrl); if (item && dim) { item.width = dim.w; item.height = dim.h; } } catch {}
    return localUrl;
  } catch { return url; }
}
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

async function loadCachedUrl(id, fallbackUrl) {
  if (blobCache[id]) return blobCache[id];
  const blob = await dbGet(id);
  if (blob) {
    const u = URL.createObjectURL(blob); blobCache[id] = u;
    const item = S.history.find(h => h.id === id);
    if (item && !item.fileSize) { item.fileSize = blob.size; item.mimeType = blob.type; }
    if (item && !item.width) { try { const dim = await getImageDimensions(u); if(dim){item.width=dim.w;item.height=dim.h;} } catch{} }
    return u;
  }
  return fallbackUrl || '';
}

// ── Persistence ──
function saveHistory() { try { localStorage.setItem(skey('cf_hist'), JSON.stringify(S.history.slice(0, 200))); } catch {} }
function saveTasks() { try { const safe = S.tasks.map(t => ({...t, inputImages: []})); localStorage.setItem(skey('cf_tasks'), JSON.stringify(safe)); } catch {} }
function loadHistory() { try { S.history = JSON.parse(localStorage.getItem(skey('cf_hist')) || '[]'); } catch { S.history = []; } }
function loadTasks() { try { S.tasks = JSON.parse(localStorage.getItem(skey('cf_tasks')) || '[]'); } catch { S.tasks = []; } }
function clearUserData() { S.history = []; S.tasks = []; costLog = {}; _storagePrefix = ''; }


function setMode(mode) {
  S.currentMode = mode;
  document.getElementById('side-image').classList.toggle('active', mode === 'image');
  document.getElementById('side-video').classList.toggle('active', mode === 'video');
  
  const mList = mode === 'image' ? MODELS : VIDEO_MODELS;
  S.model = mList[0].id;
  S.ratio = mList[0].ratios[0];
  
  document.getElementById('resolution-section').classList.toggle('hidden', mode === 'video');
  
  renderModels(); renderRatios(); updateCostPreview();
}

async function loadAnnouncement(){
  try{
    const r=await fetch('/api/announcement');if(!r.ok)return;const d=await r.json();
    if(!d.enabled||!d.content)return;
    const hash=btoa(encodeURIComponent(d.title+d.content)).substring(0,20);
    if(localStorage.getItem('candy_ann_read')===hash)return;
    document.getElementById('ann-popup-title').textContent=d.title||'公告';
    document.getElementById('ann-popup-content').textContent=d.content;
    document.getElementById('announcement-modal').classList.remove('hidden');
    document.getElementById('announcement-modal').querySelector('button').onclick=()=>{
      document.getElementById('announcement-modal').classList.add('hidden');
      localStorage.setItem('candy_ann_read',hash);
    };
  }catch{}
}

async function loadSiteConfig(){
  try{
    const r=await fetch('/api/site-config');if(!r.ok)return;const c=await r.json();
    if(c.site_name){document.querySelectorAll('.site-name-text').forEach(el=>el.textContent=c.site_name)}
    if(c.site_subtitle){document.querySelectorAll('.site-subtitle-text').forEach(el=>el.textContent=c.site_subtitle)}
    if(c.site_seo_title)document.title=c.site_seo_title;
    if(c.site_seo_desc){let m=document.querySelector('meta[name="description"]');if(!m){m=document.createElement('meta');m.name='description';document.head.appendChild(m)}m.content=c.site_seo_desc}
    if(c.site_seo_keywords){let m=document.querySelector('meta[name="keywords"]');if(!m){m=document.createElement('meta');m.name='keywords';document.head.appendChild(m)}m.content=c.site_seo_keywords}
  }catch{}
}

function resumeInterruptedTasks() {
  S.tasks.forEach(t => {
    if (t.status === 'processing' || t.status === 'queued') {
      if (t.taskId && S.cfg.apiKey) {
        t.status = 'processing'; t.progress = '恢复轮询...';
        resumePoll(t);
      } else {
        t.status = 'interrupted'; t.error = '页面刷新，任务中断';
      }
    }
  });
  saveTasks(); renderTasks();
}

async function resumePoll(task) {
  const key = S.cfg.apiKey;
  try {
    let att = 0;
    while (att < 150) {
      await new Promise(r => setTimeout(r, 2000)); att++;
      const rpUrl = useBackend ? `/api/generate/task/${task.taskId}` : `${API_DIRECT}/v1/images/tasks/${task.taskId}`;
      const rpH = useBackend ? authHeaders() : { Authorization: `Bearer ${key}` };
      const poll = await fetch(rpUrl, { headers: rpH });
      if (!poll.ok) continue;
      const res = await poll.json(); const info = res.data || {};
      task.progress = info.progress || `${Math.min(att*2,95)}%`; saveTasks(); renderTasks();
      if (info.status === 'SUCCESS') {
        task.resultUrls = (info.data?.data || []).map(d => d.url || d.b64_json);
        task.status = 'success'; task.progress = '100%'; task.endTimestamp=Date.now(); addCostLog(task.cost||0);
        task.resultIds = [];
        for (const u of task.resultUrls) {
          const item = { id: uid(), type:'image', status:'success', url:u, prompt:task.prompt, model:task.model, modelName:task.modelName, ratio:task.ratio, cost:task.cost||0, time:new Date().toLocaleTimeString() };
          task.resultIds.push(item.id);
          S.history.unshift(item);
          await cacheImage(item.id, u);
        }
        saveHistory(); renderResults(); saveTasks(); renderTasks(); return;
      } else if (info.status === 'FAILURE') throw new Error(info.fail_reason || 'Failed');
    }
    throw new Error('Task timed out');
  } catch (err) {
    task.status = 'failed'; task.error = err.message; task.endTimestamp=Date.now();
    saveTasks(); renderTasks();
  }
}

function renderModels() {
  const mList = S.currentMode === 'image' ? MODELS : VIDEO_MODELS;
  const m = mList.find(m=>m.id===S.model) || mList[0];
  document.getElementById('sel-model-name').textContent = m.name;
  document.getElementById('sel-model-desc').textContent = m.desc;
  document.getElementById('sel-model-cost').textContent = m.cost + '算力';
  document.getElementById('sel-model-badge').innerHTML = m.badge==='new'?'<span class="badge-new">NEW</span>':m.badge==='hot'?'<span class="badge-hot">HOT</span>':m.badge==='pro'?'<span class="badge-hot" style="background:linear-gradient(135deg,#8B5CF6,#6366F1)">PRO</span>':'';
  document.getElementById('model-dropdown').innerHTML = mList.map(o => {
    const on = S.model===o.id;
    const b = o.badge==='new'?'<span class="badge-new">NEW</span>':o.badge==='hot'?'<span class="badge-hot">HOT</span>':o.badge==='pro'?'<span class="badge-hot" style="background:linear-gradient(135deg,#8B5CF6,#6366F1)">PRO</span>':'';
    const icon = S.currentMode === 'image' ? 
      '<svg class="w-3.5 h-3.5 '+(on?'text-white':'text-gray-400')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' :
      '<svg class="w-3.5 h-3.5 '+(on?'text-white':'text-gray-400')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>';
    return `<div class="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition ${on?'bg-green-50':'hover:bg-gray-50'}" onclick="selModel('${o.id}')">
      <div class="w-7 h-7 rounded-lg ${on?'bg-green-500':'bg-gray-100'} flex items-center justify-center shrink-0">${icon}</div>
      <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><span class="text-xs font-bold ${on?'text-green-700':'text-gray-800'}">${o.name}</span>${b}</div>
        <div class="text-[10px] text-gray-400">${o.desc}</div></div>
      <span class="text-xs font-bold ${on?'text-green-600':'text-orange-500'} shrink-0">${o.cost}算力</span>
      ${on?'<svg class="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>':''}
    </div>`;
  }).join('');
}
function toggleModelDropdown() {
  const dd = document.getElementById('model-dropdown');
  const arrow = document.getElementById('model-arrow');
  dd.classList.toggle('hidden');
  arrow.classList.toggle('rotate-180');
}
function selModel(id) {
  S.model=id;
  document.getElementById('model-dropdown').classList.add('hidden');
  document.getElementById('model-arrow').classList.remove('rotate-180');
  renderModels();
  const mList = S.currentMode === 'image' ? MODELS : VIDEO_MODELS;
  const mc = mList.find(x=>x.id===id);
  const showRes = S.currentMode === 'image' && (id==='nano-banana-2'||id==='gemini-3.1-flash-image-preview');
  document.getElementById('resolution-section').classList.toggle('hidden', !showRes);
  if (mc && !mc.ratios.includes(S.ratio)) { S.ratio = mc.ratios[0]; }
  renderRatios(); updateCostPreview();
}
document.addEventListener('click',e=>{if(!document.getElementById('model-selector').contains(e.target)){document.getElementById('model-dropdown').classList.add('hidden');document.getElementById('model-arrow').classList.remove('rotate-180')}})
function renderRatios() {
  const mList = S.currentMode === 'image' ? MODELS : VIDEO_MODELS;
  const m = mList.find(m=>m.id===S.model);
  const allowed = m ? m.ratios : [];
  document.getElementById('ratio-grid').innerHTML = allowed.map(v => {
    const label = v === 'auto' ? 'Auto' : v;
    return `<button class="ratio-btn ${S.ratio===v?'active':''} px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-200 text-gray-500 cursor-pointer" onclick="setRatio('${v}')">${label}</button>`;
  }).join('');
}
function setRatio(v){S.ratio=v;renderRatios()}
function setRes(v){S.res=v;document.querySelectorAll('.res-btn[data-res]').forEach(b=>b.classList.toggle('active',b.dataset.res===v))}
function setBatch(d){S.batch=Math.max(1,Math.min(8,S.batch+d));document.getElementById('batch-count').textContent=S.batch;updateCostPreview()}
function updateCostPreview(){
  const mList = S.currentMode === 'image' ? MODELS : VIDEO_MODELS;
  const m=mList.find(m=>m.id===S.model);
  const c=m?m.cost:0;
  const total=(c*S.batch);
  document.getElementById('cost-preview').textContent=`消耗 ${total % 1 === 0 ? total : total.toFixed(2)} 算力`;
}
function handleFileUpload(e){addImageFiles(e.target.files);e.target.value=''}
function handleDrop(e){const files=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));addImageFiles(files)}
function addImageFiles(files){Array.from(files).slice(0,8-S.imgs.length).forEach(f=>{const r=new FileReader();r.onload=ev=>{S.imgs.push(ev.target.result);renderUploads()};r.readAsDataURL(f)})}
function rmUpload(i){S.imgs.splice(i,1);renderUploads()}
function clearAllUploads(){S.imgs=[];renderUploads()}
async function addAsRef(id){
  const limit = S.currentMode === 'video' ? 2 : 10;
  if(S.imgs.length >= limit){alert(`参考图片最多${limit}张`);return}
  const blob = await getBlob(id);
  if(!blob){alert('无法加载该图片，请先下载后手动上传');return}
  const reader=new FileReader();
  reader.onload=ev=>{S.imgs.push(ev.target.result);renderUploads()};
  reader.readAsDataURL(blob);
}
function renderUploads(){document.getElementById('upload-previews').innerHTML=S.imgs.map((img,i)=>`<div class="relative group"><img src="${img}" class="w-14 h-14 object-cover rounded-lg border border-gray-200 cursor-pointer" onclick="previewUpload(${i})"/><button onclick="event.stopPropagation();rmUpload(${i})" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">&times;</button><button onclick="event.stopPropagation();previewUpload(${i})" class="absolute bottom-0.5 right-0.5 w-4 h-4 bg-black/50 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 3 21 3 21 9"/><line x1="14" y1="10" x2="21" y2="3"/></svg></button></div>`).join('')}
function previewUpload(i){document.getElementById('preview-img').src=S.imgs[i];document.getElementById('preview-modal').classList.remove('hidden')}

// ── Generate (non-blocking, concurrent but staggered) ──
async function generate() {
  const btn = document.getElementById('generate-btn');
  if (btn.disabled) return;

  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) { alert('请输入文字描述'); return; }
  if (useBackend && !authToken) { alert('请先登录'); return; }
  if (!useBackend && !S.cfg.apiKey) { alert('请先填写 API Key'); return; }

  const originalContent = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<svg class="w-4 h-4 spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> 提交中...';

  const count = S.batch || 1;
  const batchId = count > 1 ? uid() : null;
  
  try {
    for (let i = 0; i < count; i++) {
      if (S.currentMode === 'video') submitVideoTask(prompt, batchId);
      else submitTask(prompt, batchId);
      
      // Small stagger to avoid hitting upstream rate limits (API 429)
      if (i < count - 1) await new Promise(r => setTimeout(r, 600));
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalContent;
  }
}

function uid() { return Date.now()+'_'+Math.random().toString(36).substr(2,6); }

function submitTask(prompt, batchId) {
  const mList = S.currentMode === 'image' ? MODELS : VIDEO_MODELS;
  const mc = mList.find(m=>m.id===S.model);
  const task = {
    id: uid(), prompt, model: S.model, batchId,
    modelName: mc?.name || S.model, cost: mc?.cost || 0,
    ratio: S.ratio, res: S.res, inputImages: [...S.imgs],
    status: 'queued', progress: '0%', startDate: new Date().toLocaleDateString(), startTime: new Date().toLocaleTimeString(),
    error: null, resultUrls: [], taskId: null,
  };
  S.tasks.unshift(task); saveTasks(); renderTasks();
  runTask(task);
}

function submitVideoTask(prompt, batchId) {
  const mList = VIDEO_MODELS;
  const mc = mList.find(m=>m.id===S.model);
  const task = {
    id: uid(), prompt, model: S.model, batchId,
    modelName: mc?.name || S.model, cost: mc?.cost || 0,
    ratio: S.ratio, inputImages: [...S.imgs], type: 'video',
    status: 'queued', progress: '0%', startDate: new Date().toLocaleDateString(), startTime: new Date().toLocaleTimeString(),
    error: null, resultUrls: [], taskId: null,
  };
  S.tasks.unshift(task); saveTasks(); renderTasks();
  runVideoTask(task);
}

async function runVideoTask(task) {
  try {
    task.status = 'processing'; task.startTimestamp = Date.now(); saveTasks(); renderTasks();
    const key = S.cfg.apiKey;
    let resp, data;

    if (useBackend) {
      resp = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...authHeaders() },
        body: JSON.stringify({ model:task.model, prompt:task.prompt, aspectRatio:task.ratio, images:task.inputImages, batchId:task.batchId })
      });
      if(!resp.ok){
        const t=await resp.text(); let m=`API Error: ${resp.status}`;
        try {
          const j=JSON.parse(t);
          m = (j.error && typeof j.error === 'string') ? j.error : (j.error?.message || j.message || m);
        } catch {}
        throw new Error(m);
      }
      data = await resp.json();
      if (data.cost) task.cost = data.cost;
    } else {
      // Direct call not implemented for video v2 in this simple frontend, 
      // but we could add it if needed. For now assume backend is used or throw error.
      throw new Error('Video generation requires backend connection');
    }

    if (data.task_id) {
      task.taskId = data.task_id; saveTasks(); renderTasks();
      let att=0;
      while(att<300){ // Video takes longer
        await new Promise(r=>setTimeout(r,5000)); att++;
        const pollUrl = `/api/generate/video/task/${data.task_id}`;
        const poll=await fetch(pollUrl,{headers:authHeaders()});
        if(!poll.ok)continue;
        const res=await poll.json();
        task.progress=res.progress||`${Math.min(att,99)}%`; saveTasks(); renderTasks();
        if(res.status==='SUCCESS'){
          let urls = [];
          if (res.data?.output) urls = [res.data.output];
          else if (res.data?.outputs) urls = res.data.outputs;
          task.resultUrls = urls;
          break;
        }
        else if(res.status==='FAILURE')throw new Error(res.fail_reason||'Generation failed');
      }
      if(!task.resultUrls.length)throw new Error('Task timed out');
    } else {
      if(data.data&&Array.isArray(data.data))task.resultUrls=data.data.map(d=>d.url);
      else if(data.url)task.resultUrls=[data.url];
      else throw new Error('Invalid response');
    }
    task.status='success'; task.progress='100%'; task.endTimestamp=Date.now(); addCostLog(task.cost||0);
    task.resultIds = [];
    for(const u of task.resultUrls){
      const item={id:uid(),type:'video',status:'success',url:u,prompt:task.prompt,model:task.model,modelName:task.modelName,ratio:task.ratio,cost:task.cost,time:new Date().toLocaleTimeString()};
      task.resultIds.push(item.id);
      S.history.unshift(item);
    }
    saveHistory(); renderResults();
  } catch(err) {
    task.status='failed'; task.error=err.message; task.endTimestamp=Date.now();
    if (task.taskId) {
      try { await fetch(`/api/generate/refund/${task.taskId}`, { method:'POST', headers:authHeaders() }); } catch(e) {}
    }
    S.history.unshift({id:uid(),type:'video',status:'failed',error:err.message,prompt:task.prompt,model:task.model,modelName:task.modelName,ratio:task.ratio,cost:task.cost,time:new Date().toLocaleTimeString()});
    saveHistory(); renderResults();
  }
  saveTasks(); renderTasks();
}

async function runTask(task) {
  try {
    task.status = 'processing'; task.startTimestamp = Date.now(); saveTasks(); renderTasks();
    const key = S.cfg.apiKey;
    let resp, data;

    if (useBackend) {
      resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...authHeaders() },
        body: JSON.stringify({ model:task.model, prompt:task.prompt, aspectRatio:task.ratio, resolution:task.res, inputImages:task.inputImages, batchId:task.batchId })
      });
      if(!resp.ok){
        const t=await resp.text(); let m=`API Error: ${resp.status}`;
        try {
          const j=JSON.parse(t);
          m = (j.error && typeof j.error === 'string') ? j.error : (j.error?.message || j.message || m);
        } catch {}
        throw new Error(m);
      }
      data = await resp.json();
      if (data.cost) task.cost = data.cost;
    } else {
      const isNano = task.model.includes('nano-banana') || task.model === 'gemini-3.1-flash-image-preview';
      const hasImg = task.inputImages.length > 0;
      let url = hasImg ? `${API_DIRECT}/v1/images/edits` : `${API_DIRECT}/v1/images/generations`;
      if (isNano) url += '?async=true';
      const headers = { Authorization: `Bearer ${key}` };
      let body;
      if (hasImg) {
        const fd = new FormData();
        for (let i=0;i<task.inputImages.length;i++){const bl=await(await fetch(task.inputImages[i])).blob();fd.append('image',bl,`image_${i}.png`)}
        fd.append('prompt',task.prompt);fd.append('model',task.model);fd.append('n','1');fd.append('aspect_ratio',task.ratio);fd.append('response_format','url');
        if(task.model==='nano-banana-2'||task.model==='gemini-3.1-flash-image-preview')fd.append('image_size',task.res);
        body=fd;
      } else {
        headers['Content-Type']='application/json';
        const p={prompt:task.prompt,model:task.model,n:1,aspect_ratio:task.ratio,response_format:'url'};
        if(task.model==='nano-banana-2'||task.model==='gemini-3.1-flash-image-preview')p.image_size=task.res;
        body=JSON.stringify(p);
      }
      resp = await fetch(url,{method:'POST',headers,body});
      if(!resp.ok){
        const t=await resp.text(); let m=`API Error: ${resp.status}`;
        try {
          const j=JSON.parse(t);
          m = (j.error && typeof j.error === 'string') ? j.error : (j.error?.message || j.message || m);
        } catch {}
        throw new Error(m);
      }
      data = await resp.json();
    }

    // Support both {task_id: "..."} and {data: "..."} for task ID
    const tid = data.task_id || data.data;

    if (tid) {
      task.taskId = tid; saveTasks(); renderTasks();
      let att=0;
      while(att<150){
        await new Promise(r=>setTimeout(r,2000));att++;
        const pollUrl = useBackend ? `/api/generate/task/${tid}` : `${API_DIRECT}/v1/images/tasks/${tid}`;
        const pollHeaders = useBackend ? authHeaders() : { Authorization:`Bearer ${key}` };
        const poll=await fetch(pollUrl,{headers:pollHeaders});
        if(!poll.ok)continue;
        const res=await poll.json();
        const info=res.data||{}; // res.data is the task info object
        task.progress=info.progress||`${Math.min(att*2,95)}%`;saveTasks();renderTasks();
        
        if(info.status==='SUCCESS'){
          // Based on user doc, success data is in info.data.data
          const resultData = info.data || {};
          const images = resultData.data || [];
          task.resultUrls = images.map(d=>d.url || d.b64_json);
          if(!task.resultUrls.length && resultData.url) task.resultUrls = [resultData.url];
          break;
        }
        else if(info.status==='FAILURE')throw new Error(info.fail_reason||'Generation failed');
      }
      if(!task.resultUrls.length)throw new Error('Task timed out');
    } else {
      if(data.data&&Array.isArray(data.data))task.resultUrls=data.data.map(d=>d.url||d.b64_json);
      else if(data.url)task.resultUrls=[data.url];
      else throw new Error('Invalid response');
    }
    task.status='success';task.progress='100%';task.endTimestamp=Date.now();addCostLog(task.cost||0);
    task.resultIds = [];
    for(const u of task.resultUrls){
      const item={id:uid(),type:'image',status:'success',url:u,prompt:task.prompt,model:task.model,modelName:task.modelName,ratio:task.ratio,cost:task.cost,time:new Date().toLocaleTimeString()};
      task.resultIds.push(item.id);
      S.history.unshift(item);
      await cacheImage(item.id, u);
    }
    saveHistory(); renderResults();
  } catch(err) {
    task.status='failed';task.error=err.message;task.endTimestamp=Date.now();
    if (task.taskId) {
      try { await fetch(`/api/generate/refund/${task.taskId}`, { method:'POST', headers:authHeaders() }); } catch(e) {}
    }
    S.history.unshift({id:uid(),type:'image',status:'failed',error:err.message,prompt:task.prompt,model:task.model,modelName:task.modelName,ratio:task.ratio,cost:task.cost,time:new Date().toLocaleTimeString()});
    saveHistory(); renderResults();
  }
  saveTasks(); renderTasks();
}


// ── Elapsed time helper ──
function formatElapsed(ms){if(!ms||ms<0)return '0:00';const s=Math.floor(ms/1000);const m=Math.floor(s/60);const sec=s%60;return m+':'+(sec<10?'0':'')+sec}

// Live timer interval for legacy renderTasks
if(window._taskTimerInterval2)clearInterval(window._taskTimerInterval2);
window._taskTimerInterval2=setInterval(function(){document.querySelectorAll('[data-timer-start]').forEach(function(el){const st=parseInt(el.dataset.timerStart,10);if(st)el.textContent='\u23f1 '+formatElapsed(Date.now()-st)})},1000);

// ── Task Queue Render ──
function renderTasks() {
  const run=S.tasks.filter(t=>t.status==='processing'||t.status==='queued').length;
  const done=S.tasks.filter(t=>t.status==='success').length;
  const fail=S.tasks.filter(t=>t.status==='failed'||t.status==='interrupted').length;
  const today=new Date().toLocaleDateString();
  const todayCost=getDayCost(today);
  const yesterday=new Date(Date.now()-864e5).toLocaleDateString();
  const yesterdayCost=getDayCost(yesterday);
  document.getElementById('task-summary').textContent=S.tasks.length===0?'暂无任务':`运行 ${run} · 完成 ${done} · 失败 ${fail}`;
  document.getElementById('today-cost').textContent=`今日算力: ${todayCost%1===0?todayCost:todayCost.toFixed(2)}`;
  document.getElementById('yesterday-cost').textContent=yesterdayCost?`昨日算力: ${yesterdayCost%1===0?yesterdayCost:yesterdayCost.toFixed(2)}`:'';
  const icons={
    queued:'<svg class="w-3.5 h-3.5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    processing:'<svg class="w-3.5 h-3.5 text-blue-500 spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>',
    success:'<svg class="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    failed:'<svg class="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    interrupted:'<svg class="w-3.5 h-3.5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  };
  const colors={queued:'bg-yellow-50 border-yellow-200',processing:'bg-blue-50 border-blue-200',success:'bg-green-50 border-green-200',failed:'bg-red-50 border-red-200',interrupted:'bg-orange-50 border-orange-200'};
  const labels={queued:'排队中',processing:'生成中',success:'已完成',failed:'失败',interrupted:'已中断'};
  const txtc={queued:'text-yellow-600',processing:'text-blue-600',success:'text-green-600',failed:'text-red-500',interrupted:'text-orange-500'};
  const groups={};
  S.tasks.forEach(t=>{const d=t.startDate||today;if(!groups[d])groups[d]=[];groups[d].push(t)});
  const dateLabel=d=>d===today?'今天':d===new Date(Date.now()-864e5).toLocaleDateString()?'昨天':d;
  if(!window._collapsed) window._collapsed={};
  let html='';
  for(const date of Object.keys(groups)){
    const items=groups[date];
    const dayCost=getDayCost(date)||items.reduce((s,t)=>s+(t.cost||0),0);
    const open=!window._collapsed[date];
    const cnt=items.length;
    html+=`<div class="mt-2 mb-1 border border-gray-200 rounded-xl overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition" onclick="toggleGroup('${date}')">
        <div class="flex items-center gap-2">
          <svg class="w-3 h-3 text-gray-400 transition-transform ${open?'rotate-90':''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
          <span class="text-[11px] font-bold text-gray-600">${dateLabel(date)}</span>
          <span class="text-[10px] text-gray-400">${cnt}个任务</span>
        </div>
        <span class="text-[10px] font-bold text-orange-500">${dayCost%1===0?dayCost:dayCost.toFixed(2)} 算力</span>
      </div>
      <div class="${open?'':'hidden'} p-2 space-y-1.5" id="group-${date}">`;
    items.forEach(t=>{
      html+=`<div class="${colors[t.status]||''} border rounded-lg p-2.5 hover:shadow-sm transition">
        <div class="flex items-center gap-1.5 mb-1">${icons[t.status]||''}<span class="text-[10px] font-bold ${txtc[t.status]||''}">${labels[t.status]||t.status}</span>
        ${t.startTimestamp?((t.status==='processing'||t.status==='queued')?`<span class="text-[10px] font-bold text-blue-400 ml-1" data-timer-start="${t.startTimestamp}">\u23f1 ${formatElapsed(Date.now()-t.startTimestamp)}</span>`:(t.endTimestamp?`<span class="text-[10px] font-semibold text-gray-400 ml-1">\u23f1 ${formatElapsed(t.endTimestamp-t.startTimestamp)}</span>`:'')):''}
        <span class="text-[10px] text-gray-300 ml-auto">${t.startTime}</span></div>
        <p class="text-[11px] text-gray-600 truncate mb-1" title="${esc(t.prompt)}">${esc(t.prompt)}</p>
        <div class="flex items-center gap-1.5 flex-wrap"><span class="text-[10px] text-gray-400">${t.modelName}</span>${t.ratio?`<span class="text-[9px] font-semibold text-green-600 bg-green-50 px-1 py-0.5 rounded">${t.ratio}</span>`:''}${t.cost?`<span class="text-[9px] font-semibold text-orange-500 bg-orange-50 px-1 py-0.5 rounded">${t.cost}算力</span>`:''}
        ${t.status==='processing'||t.status==='queued'?`<span class="text-[10px] font-bold text-blue-500 ml-auto">${t.progress}</span>`:''}</div>
        ${t.error?`<p class="text-[9px] text-red-400 mt-1 truncate" title="${esc(t.error)}">${esc(t.error)}</p>`:''}
        ${t.status==='success'?`<div class="flex gap-1.5 mt-2"><button onclick="scrollToResult('${t.id}')" class="flex-1 text-[9px] font-semibold text-green-600 bg-green-100 hover:bg-green-200 rounded px-2 py-1 transition text-center">定位图片</button><button data-copy="${t.id}" onclick="copyPrompt('${t.id}')" class="flex-1 text-[9px] font-semibold text-purple-600 bg-purple-100 hover:bg-purple-200 rounded px-2 py-1 transition text-center">复制提示词</button><button onclick="deleteTask('${t.id}')" class="flex-1 text-[9px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded px-2 py-1 transition text-center">删除</button></div>`:''}
        ${t.status==='failed'||t.status==='interrupted'?`<div class="flex gap-1.5 mt-2"><button data-copy="${t.id}" onclick="copyPrompt('${t.id}')" class="flex-1 text-[9px] font-semibold text-purple-600 bg-purple-100 hover:bg-purple-200 rounded px-2 py-1 transition text-center">复制提示词</button><button onclick="deleteTask('${t.id}')" class="flex-1 text-[9px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded px-2 py-1 transition text-center">删除</button></div>`:''}
      </div>`;
    });
    html+=`</div></div>`;
  }
  document.getElementById('task-list').innerHTML=html;
}
function copyResultPrompt(btn,id){
  const h=S.history.find(x=>x.id===id);if(!h)return;
  const ta=document.createElement('textarea');ta.value=h.prompt;ta.style.cssText='position:fixed;left:-9999px';
  document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
  btn.textContent='已复制!';setTimeout(()=>{btn.innerHTML='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> 复制提示词'},1000);
}
async function deleteResult(id){
  S.history=S.history.filter(h=>h.id!==id);
  if(blobCache[id]){URL.revokeObjectURL(blobCache[id]);delete blobCache[id]}
  try{await dbDel(id)}catch{}
  saveHistory();renderResults();
}
function deleteTask(taskId){
  const t=S.tasks.find(x=>x.id===taskId);if(!t)return;
  S.tasks=S.tasks.filter(x=>x.id!==taskId);
  if(t.status==='success'){
    const related=S.history.filter(h=>h.prompt===t.prompt&&h.model===t.model);
    related.forEach(async h=>{S.history=S.history.filter(x=>x.id!==h.id);if(blobCache[h.id]){URL.revokeObjectURL(blobCache[h.id]);delete blobCache[h.id]}try{await dbDel(h.id)}catch{}});
    saveHistory();renderResults();
  }
  saveTasks();renderTasks();
}
function toggleGroup(date){window._collapsed[date]=!window._collapsed[date];renderTasks()}
function copyPrompt(taskId){
  const t=S.tasks.find(x=>x.id===taskId);if(!t)return;
  const ta=document.createElement('textarea');
  ta.value=t.prompt;ta.style.cssText='position:fixed;left:-9999px';
  document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
  const btn=document.querySelector(`[data-copy="${taskId}"]`);
  if(btn){btn.textContent='已复制!';setTimeout(()=>{btn.textContent='复制提示词'},1000)}
}
function scrollToResult(taskId){
  const task=S.tasks.find(t=>t.id===taskId);
  if(!task||!task.resultUrls?.length)return;
  const ids=task.resultIds||[];
  if(ids.length>0){
    const el=document.querySelector(`[data-rid="${ids[0]}"]`);
    if(el){el.scrollIntoView({behavior:'smooth',block:'center'});ids.forEach(rid=>{const e=document.querySelector(`[data-rid="${rid}"]`);if(e){e.classList.add('ring-2','ring-green-500');setTimeout(()=>e.classList.remove('ring-2','ring-green-500'),2000)}});return}
  }
  const resultItem=S.history.find(h=>h.status==='success'&&h.prompt===task.prompt&&h.model===task.model&&h.time);
  if(!resultItem)return;
  const el=document.querySelector(`[data-rid="${resultItem.id}"]`);
  if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('ring-2','ring-green-500');setTimeout(()=>el.classList.remove('ring-2','ring-green-500'),2000)}
}
function clearDoneTasks(){S.tasks=S.tasks.filter(t=>t.status==='processing'||t.status==='queued');saveTasks();renderTasks()}

// ── Results Render ──
function renderResults() {
  const grid=document.getElementById('results-grid'),empty=document.getElementById('empty-state');
  const items=S.history.filter(i=>i.status==='success'||i.status==='failed');
  if(!items.length){grid.classList.add('hidden');empty.classList.remove('hidden');return}
  empty.classList.add('hidden');grid.classList.remove('hidden');
  grid.innerHTML=items.map(item=>{
    if(item.status==='failed'){
      return `<div class="fade-in bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
        <div class="h-32 bg-red-50 flex items-center justify-center"><div class="text-center px-4">
        <svg class="w-7 h-7 text-red-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <p class="text-[11px] text-red-400 break-all line-clamp-2">${item.error||'失败'}</p></div></div>
        <div class="p-2.5"><p class="text-[11px] text-gray-500 truncate">${esc(item.prompt)}</p>
        <button onclick="deleteResult('${item.id}')" class="mt-1.5 w-full text-[9px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded px-2 py-1 transition text-center">删除</button></div></div>`}
    const isVideo = item.type === 'video' || (item.url && item.url.toLowerCase().split('?')[0].endsWith('.mp4'));
    const src=blobCache[item.id]||item.url;
    const ratioTag=item.ratio?`<span class="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">${item.ratio}</span>`:'';
    const ext = isVideo ? 'mp4' : 'png';
    const sizeStr = item.fileSize ? fmtSize(item.fileSize) : '';
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

    return `<div class="fade-in result-img group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm cursor-pointer transition-all" data-rid="${item.id}" onclick="openPreview('${item.id}')">
      <div class="relative">${mediaHtml}
      <div class="absolute bottom-2 left-2 right-2 flex justify-end gap-1.5">
        <button onclick="event.stopPropagation();addAsRef('${item.id}')" class="bg-black/60 hover:bg-black/80 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1" title="添加为参考图片">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          参考图</button>
        <button onclick="event.stopPropagation();copyResultPrompt(this,'${item.id}')" class="bg-black/60 hover:bg-black/80 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1" title="复制提示词">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          复制提示词</button>
        <button onclick="event.stopPropagation();dlFile('${item.id}','candy-${item.id}.${ext}')" class="bg-black/60 hover:bg-black/80 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          下载</button>
        <button onclick="event.stopPropagation();deleteResult('${item.id}')" class="bg-red-500/70 hover:bg-red-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1" title="删除">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          删除</button></div></div>
      <div class="p-2.5"><p class="text-[11px] text-gray-500 truncate" title="${esc(item.prompt)}">${esc(item.prompt)}</p>
      <div class="flex items-center gap-1.5 mt-1 flex-wrap"><span class="text-[10px] text-gray-300">${item.modelName||item.model}</span>${ratioTag}${dimTag}${sizeTag}${costTag}<span class="text-[10px] text-gray-300 ml-auto">${item.time}</span></div></div></div>`
  }).join('');
}

// ── Download ──
async function getBlob(id) {
  let blob = await dbGet(id);
  if (blob) return blob;
  const item = S.history.find(h => h.id === id);
  if (!item?.url) return null;
  try { blob = await (await fetch(item.url)).blob(); } catch {}
  if (!blob) try { blob = await fetchViaCanvas(item.url); } catch {}
  if (!blob) try { blob = await fetchViaImgCanvas(item.url); } catch {}
  if (blob) await dbPut(id, blob);
  return blob;
}
function fetchViaImgCanvas(url) {
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
}
async function dlFile(id, filename) {
  const blob = await getBlob(id);
  if (blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } else {
    const item = S.history.find(h => h.id === id);
    if (item?.url) {
      if (useBackend && item.url.startsWith('http')) {
        // Use backend proxy to force download headers
        window.location.href = `/api/generate/proxy-download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(filename)}`;
      } else {
        const a = document.createElement('a'); a.href = item.url; a.target = '_blank'; a.download = filename; a.click();
      }
    }
  }
}

let currentPreviewId = null;
function openPreview(id) {
  currentPreviewId = id;
  const item = S.history.find(h=>h.id===id);
  const src = blobCache[id] || item?.url || '';
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
}
function closePreview(){
  document.getElementById('preview-modal').classList.add('hidden');
  const videoEL = document.getElementById('preview-video');
  if (videoEL) { videoEL.pause(); videoEL.src = ''; }
}
function downloadPreview(){ 
  if(!currentPreviewId) return;
  const item = S.history.find(h=>h.id===currentPreviewId);
  const isVideo = item?.type === 'video' || (item?.url && item.url.toLowerCase().split('?')[0].endsWith('.mp4'));
  dlFile(currentPreviewId, `candy-${currentPreviewId}.${isVideo?'mp4':'png'}`); 
}

function fmtSize(bytes){if(bytes>=1048576)return (bytes/1048576).toFixed(1)+'MB';if(bytes>=1024)return (bytes/1024).toFixed(0)+'KB';return bytes+'B'}
function esc(s){return s?s.replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/'/g,'&#39;'):''}
function formatTime(t){
  if(!t)return '';
  if(t instanceof Date)return t.toLocaleString();
  const iso=t.includes('T')?(t.endsWith('Z')?t:t+'Z'):(t.replace(' ','T')+'Z');
  const d=new Date(iso);
  return isNaN(d.getTime())?t:d.toLocaleString();
}

async function clearHistory(){
  if(!confirm('确定清空所有创作记录和缓存图片？'))return;
  S.history=[]; saveHistory(); await dbClear(); blobCache={}; renderResults();
}

function saveSidebarKey(v){S.cfg.apiKey=v.trim();localStorage.setItem('candy_api_key',S.cfg.apiKey)}

// ── Auth System ──
async function checkBackend(){try{const r=await fetch('/api/health');if(r.ok){useBackend=true;return true}}catch{}return false}
async function doLogin(){
  const email=document.getElementById('auth-email').value.trim();
  const pass=document.getElementById('auth-pass').value;
  if(!email||!pass)return showAuthError('请填写邮箱和密码');
  try{
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
    const d=await r.json();if(!r.ok)return showAuthError(d.error||'登录失败');
    authToken=d.token;localStorage.setItem('candy_token',authToken);S.user=d.user;S.cfg.apiKey=authToken;
    setStoragePrefix(d.user.id);loadHistory();loadTasks();loadCostLog();
    renderResults();renderTasks();
    showUserInfo();
  }catch(e){showAuthError('网络错误')}
}
async function doRegister(){
  const email=document.getElementById('auth-email').value.trim();
  const pass=document.getElementById('auth-pass').value;
  if(!email||!pass)return showAuthError('请填写邮箱和密码');
  if(pass.length<6)return showAuthError('密码至少6位');
  try{
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
    const d=await r.json();if(!r.ok)return showAuthError(d.error||'注册失败');
    authToken=d.token;localStorage.setItem('candy_token',authToken);S.user=d.user;S.cfg.apiKey=authToken;
    setStoragePrefix(d.user.id);loadHistory();loadTasks();loadCostLog();
    renderResults();renderTasks();
    showUserInfo();
  }catch(e){showAuthError('网络错误')}
}
function doLogout(){authToken='';S.user=null;S.cfg.apiKey='';localStorage.removeItem('candy_token');clearUserData();renderResults();renderTasks();showLoginForm()}
function showAuthError(msg){const el=document.getElementById('auth-error');el.textContent=msg;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),3000)}
function showLoginForm(){document.getElementById('auth-login-form').classList.remove('hidden');document.getElementById('auth-user-info').classList.add('hidden')}
function showUserInfo(){
  document.getElementById('auth-login-form').classList.add('hidden');document.getElementById('auth-user-info').classList.remove('hidden');
  if(S.user){document.getElementById('user-nickname').textContent=S.user.nickname||S.user.email;document.getElementById('user-email').textContent=S.user.email;document.getElementById('user-points').textContent=S.user.points?.toFixed?S.user.points.toFixed(2):S.user.points}
}
async function refreshProfile(){
  if(!authToken)return;
  try{
    const r=await fetch('/api/user/profile',{headers:authHeaders()});
    if(r.ok){
      S.user=await r.json();
      if(!_storagePrefix&&S.user.id){setStoragePrefix(S.user.id);loadHistory();loadTasks();loadCostLog();renderResults();renderTasks()}
      showUserInfo();
    }
  }catch{}
}

const RECHARGE_PRESETS=[5,10,20,50,100,200,500,1000];
let rechargeAmount=0;
function openRecharge(){
  document.getElementById('recharge-modal').classList.remove('hidden');
  document.getElementById('recharge-custom').value='';
  rechargeAmount=0; updateRechargeUI();
  document.getElementById('recharge-grid').innerHTML=RECHARGE_PRESETS.map(v=>`<button onclick="selectRecharge(${v})" class="recharge-opt border border-gray-200 rounded-xl p-2.5 text-center hover:border-orange-400 hover:bg-orange-50 transition cursor-pointer" data-val="${v}">
    <div class="text-sm font-bold text-gray-800">${v}算力</div>
    <div class="text-xs font-semibold text-orange-500">¥${(v*1.1).toFixed(2)}</div>
  </button>`).join('');
}
function selectRecharge(v){
  rechargeAmount=v;
  document.getElementById('recharge-custom').value=v;
  updateRechargeUI();
  document.querySelectorAll('.recharge-opt').forEach(el=>{el.classList.toggle('border-orange-400',+el.dataset.val===v);el.classList.toggle('bg-orange-50',+el.dataset.val===v)});
}
function updateRechargePrice(){
  const v=parseFloat(document.getElementById('recharge-custom').value)||0;
  rechargeAmount=v;
  updateRechargeUI();
  document.querySelectorAll('.recharge-opt').forEach(el=>{el.classList.toggle('border-orange-400',+el.dataset.val===v);el.classList.toggle('bg-orange-50',+el.dataset.val===v)});
}
function updateRechargeUI(){
  const price=(rechargeAmount*1.1).toFixed(2);
  document.getElementById('recharge-price').textContent=rechargeAmount>0?`¥${price}`:'¥0.00';
  document.getElementById('recharge-selected').textContent=rechargeAmount>0?`充值 ${rechargeAmount} 算力，支付 ¥${price}`:'';
}
let rechargePolling=null;
async function confirmRecharge(){
  if(rechargeAmount<=0){alert('请选择充值额度');return}
  if(!useBackend||!authToken){alert('请先登录');return}
  const btn=document.getElementById('recharge-submit-btn');
  btn.disabled=true;btn.textContent='生成中...';
  try{
    const r=await fetch('/api/pay/create',{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify({amount:rechargeAmount})});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||'创建订单失败');
    showRechargeQR(d.qrCode, d.orderNo, d.amount, d.payAmount);
  }catch(e){alert(e.message);btn.disabled=false;btn.textContent='确认充值'}
}
function showRechargeQR(qrUrl, orderNo, amount, payAmount){
  document.getElementById('recharge-qr-area').classList.remove('hidden');
  document.getElementById('recharge-qr-info').textContent=`订单 ${orderNo} · ${amount}算力 · ¥${payAmount}`;
  document.getElementById('recharge-qr-status').textContent='等待支付...';
  document.getElementById('recharge-qr-status').className='text-xs font-bold text-orange-500 mt-2';
  drawQR(document.getElementById('recharge-qr-canvas'), qrUrl);
  document.getElementById('recharge-submit-btn').textContent='已生成二维码';
  if(rechargePolling)clearInterval(rechargePolling);
  rechargePolling=setInterval(async()=>{
    try{
      const r=await fetch(`/api/pay/status/${orderNo}`,{headers:authHeaders()});
      if(!r.ok)return;
      const d=await r.json();
      if(d.status==='paid'){
        clearInterval(rechargePolling);rechargePolling=null;
        document.getElementById('recharge-qr-status').textContent='支付成功！';
        document.getElementById('recharge-qr-status').className='text-sm font-bold text-green-600 mt-2';
        if(S.user)S.user.points=d.balance;
        showUserInfo();refreshProfile();
        setTimeout(closeRecharge,2000);
      }
    }catch{}
  },3000);
}
function drawQR(canvas, text){
  const size=200,modules=21+4*Math.floor((text.length+20)/15);
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#000';ctx.font='11px sans-serif';ctx.textAlign='center';
  ctx.fillText('请使用支付宝扫码',size/2,size/2-10);
  ctx.fillText('(需引入QR库)',size/2,size/2+10);
  if(typeof QRCode!=='undefined'){try{QRCode.toCanvas(canvas,text,{width:size,margin:2})}catch{}}
  else{
    const img=new Image();
    img.onload=()=>{ctx.clearRect(0,0,size,size);ctx.drawImage(img,0,0,size,size)};
    img.src=`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  }
}
function closeRecharge(){
  document.getElementById('recharge-modal').classList.add('hidden');
  document.getElementById('recharge-qr-area').classList.add('hidden');
  document.getElementById('recharge-submit-btn').disabled=false;
  document.getElementById('recharge-submit-btn').textContent='确认充值';
  if(rechargePolling){clearInterval(rechargePolling);rechargePolling=null}
}
async function queryQuota(){ if(useBackend){refreshProfile();return} }

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closePreview()}
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter')generate();
});

// ── Resizable Panels ──
(function(){
  const panels={sidebar:document.getElementById('panel-sidebar'),controls:document.getElementById('panel-controls'),tasks:document.getElementById('panel-tasks')};
  const limits={sidebar:{min:50,max:500},controls:{min:100,max:800},tasks:{min:50,max:500}};
  const saved=JSON.parse(localStorage.getItem('candy_widths')||'{}');
  if(saved.sidebar)panels.sidebar.style.width=saved.sidebar+'px';
  if(saved.controls)panels.controls.style.width=saved.controls+'px';
  if(saved.tasks)panels.tasks.style.width=saved.tasks+'px';
  document.querySelectorAll('.resize-handle').forEach(handle=>{
    handle.addEventListener('mousedown',e=>{
      e.preventDefault();
      const which=handle.dataset.resize;
      const rightPanels=['results','tasks'];
      const isRight=rightPanels.includes(which);
      let target;
      if(which==='sidebar')target=panels.sidebar;
      else if(which==='controls')target=panels.controls;
      else if(which==='results')target=panels.tasks;
      if(!target)return;
      const lim=limits[which==='results'?'tasks':which];
      const startX=e.clientX,startW=target.offsetWidth;
      handle.classList.add('active');document.body.style.cursor='col-resize';document.body.style.userSelect='none';
      const onMove=ev=>{const diff=isRight?(startX-ev.clientX):(ev.clientX-startX);const nw=Math.max(lim.min,Math.min(lim.max,startW+diff));target.style.width=nw+'px'};
      const onUp=()=>{handle.classList.remove('active');document.body.style.cursor='';document.body.style.userSelect='';document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);saveWidths()};
      document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
    });
  });
  function saveWidths(){localStorage.setItem('candy_widths',JSON.stringify({sidebar:panels.sidebar.offsetWidth,controls:panels.controls.offsetWidth,tasks:panels.tasks.offsetWidth}))}
})();

let usagePage = 0;
async function openUsage() {
  if (!useBackend) { alert('请先登录以查看历史记录'); return; }
  document.getElementById('usage-modal').classList.remove('hidden');
  usagePage = 0;
  await fetchUsageLogs();
}
function closeUsage() { document.getElementById('usage-modal').classList.add('hidden'); }
async function fetchUsageLogs() {
  const limit = 10;
  const offset = usagePage * limit;
  try {
    const r = await fetch(`/api/user/records?limit=${limit}&offset=${offset}`, { headers: authHeaders() });
    const logs = await r.json();
    const list = document.getElementById('usage-list');
    list.innerHTML = logs.map(l => {
      const isConsume = l.type === 'consume';
      const isRefund = l.type === 'refund';
      const isRecharge = l.type === 'recharge';
      let color = 'text-gray-500';
      let sign = '';
      if (isConsume) { color = 'text-red-500'; sign = '-'; }
      else if (isRefund || isRecharge) { color = 'text-green-500'; sign = '+'; }
      
      return `<div class="bg-gray-50/50 rounded-xl p-3 flex items-center justify-between border border-gray-100 hover:bg-gray-50 transition">
        <div class="min-w-0 flex-1">
          <div class="text-[11px] font-bold text-gray-800 truncate">${l.description || '无描述'}</div>
          <div class="text-[9px] text-gray-400 mt-0.5">${formatTime(l.created_at)}</div>
        </div>
        <div class="text-right ml-4">
          <div class="text-[12px] font-bold ${color}">${sign}${Math.abs(l.amount).toFixed(2)}</div>
          <div class="text-[9px] text-gray-400">余额: ${parseFloat(l.balance_after).toFixed(2)}</div>
        </div>
      </div>`;
    }).join('') || '<div class="text-center py-8 text-xs text-gray-400">暂无使用记录</div>';
    document.getElementById('usage-page-info').textContent = `第 ${usagePage + 1} 页`;
    document.getElementById('usage-prev').disabled = usagePage === 0;
    document.getElementById('usage-next').disabled = logs.length < limit;
  } catch {}
}
async function changeUsagePage(delta) {
  usagePage += delta;
  if (usagePage < 0) usagePage = 0;
  await fetchUsageLogs();
}

// ── Init ──
async function init() {
  await checkBackend();
  renderModels(); renderRatios(); updateCostPreview();

  if (authToken) { 
    S.cfg.apiKey = authToken; 
    await refreshProfile();
    // refreshProfile sets prefix + loads user data + renders
    if (S.user) showUserInfo(); else showLoginForm();
  } else {
    loadHistory(); loadTasks(); loadCostLog();
    renderTasks();
    showLoginForm();
  }

  for (const item of S.history) {
    if (item.status === 'success' && item.url) await loadCachedUrl(item.id, item.url);
  }
  saveHistory(); renderResults();
  resumeInterruptedTasks();

  // Fetch Public Config (API Base URL, Site Branding)
  try {
    const r = await fetch('/api/public-config');
    if (r.ok) {
      const cfg = await r.json();
      if (cfg.api_base_url) {
        API_DIRECT = cfg.api_base_url;
        const apiInfo = document.getElementById('api-base-info');
        if (apiInfo) apiInfo.textContent = API_DIRECT.replace('https://','').replace('http://','');
      }
      if (cfg.site_name) {
        document.querySelectorAll('.site-name-text').forEach(el => el.textContent = cfg.site_name);
        document.title = `${cfg.site_name} | AI Creative Suite`;
      }
      if (cfg.site_subtitle) {
        document.querySelectorAll('.site-subtitle-text').forEach(el => el.textContent = cfg.site_subtitle);
      }
    }
  } catch(e) {}

  // Announcements
  try {
    const r = await fetch('/api/announcement');
    if (r.ok) {
      const d = await r.json();
      if (d.enabled && d.content) {
        const hash = btoa(encodeURIComponent(d.title + d.content)).substring(0, 20);
        if (localStorage.getItem('candy_ann_read') !== hash) {
          document.getElementById('ann-popup-title').textContent = d.title || '公告';
          document.getElementById('ann-popup-content').textContent = d.content;
          document.getElementById('announcement-modal').classList.remove('hidden');
          document.getElementById('announcement-modal').querySelector('button').onclick = () => {
            document.getElementById('announcement-modal').classList.add('hidden');
            localStorage.setItem('candy_ann_read', hash);
          };
        }
      }
    }
  } catch {}
}

init();
