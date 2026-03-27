// ── Candy Studio: Global Configuration ──
// All constants and model definitions in one place

(function() {
  window.CS = window.CS || {};

  CS.MODELS = [
    { id:'gemini-3.1-flash-image-preview', name:'Nano Banana 2', desc:'新一代创作引擎', badge:'new', cost:0.1,
      ratios:['auto','1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9','1:4','4:1','1:8','8:1'] },
    { id:'nano-banana-2', name:'Nano Banana Pro', desc:'次世代图像生成', badge:'hot', cost:0.2,
      ratios:['auto','1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'] },
    { id:'nano-banana', name:'Nano Banana', desc:'标准生成速度', badge:null, cost:0.08,
      ratios:['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'] },
    { id:'nano-banana-hd', name:'Nano Banana HD', desc:'高清画质输出', badge:null, cost:0.12,
      ratios:['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9'] },
  ];

  CS.VIDEO_MODELS = [
    { id:'veo3.1-fast', name:'Veo 3.1 Fast', desc:'快速视频生成，极致速度', badge:'new', cost:0.2, ratios:['16:9','9:16'] },
    { id:'veo3.1', name:'Veo 3.1', desc:'标准视频生成，性价比之选', badge:'hot', cost:0.3, ratios:['16:9','9:16'] },
    { id:'veo3.1-pro', name:'Veo 3.1 Pro', desc:'高质量视频生成，细节丰富', badge:'hot', cost:1.0, ratios:['16:9','9:16'] },
    { id:'veo3.1-fast-4k', name:'Veo 3.1 Fast 4K', desc:'快速 4K 高清视频生成', badge:'new', cost:2.0, ratios:['16:9','9:16'] },
    { id:'veo3.1-pro-4k', name:'Veo 3.1 Pro 4K', desc:'专业级 4K 超清视频生成', badge:'pro', cost:2.0, ratios:['16:9','9:16'] },
  ];

  CS.RECHARGE_PRESETS = [5, 10, 20, 50, 100, 200, 500, 1000];

  CS.DB_NAME = 'candy_cache';
  CS.DB_VER = 1;
  CS.STORE = 'images';
  CS.API_BACKEND = '/api';
})();
