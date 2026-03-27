// ── Candy Studio: Generation Logic ──
// Image and video generation: submit, run, poll, resume

(function() {
  window.CS = window.CS || {};

  CS.generate = async function() {
    const btn = document.getElementById('generate-btn');
    if (btn.disabled) return;

    const prompt = document.getElementById('prompt-input').value.trim();
    if (!prompt) { alert('请输入文字描述'); return; }
    if (CS.useBackend && !CS.authToken) { alert('请先登录'); return; }
    if (!CS.useBackend && !CS.S.cfg.apiKey) { alert('请先填写 API Key'); return; }

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="w-4 h-4 spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> 提交中...';

    const count = CS.S.batch || 1;
    const batchId = count > 1 ? CS.uid() : null;

    try {
      for (let i = 0; i < count; i++) {
        if (CS.S.currentMode === 'video') CS.submitVideoTask(prompt, batchId);
        else CS.submitTask(prompt, batchId);
        if (i < count - 1) await new Promise(r => setTimeout(r, 600));
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalContent;
    }
  };

  CS.submitTask = function(prompt, batchId) {
    const mList = CS.S.currentMode === 'image' ? CS.MODELS : CS.VIDEO_MODELS;
    const mc = mList.find(m => m.id === CS.S.model);
    const task = {
      id: CS.uid(), prompt, model: CS.S.model, batchId,
      modelName: mc?.name || CS.S.model, cost: mc?.cost || 0,
      ratio: CS.S.ratio, res: CS.S.res, inputImages: [...CS.S.imgs],
      status: 'queued', progress: '0%', startDate: new Date().toLocaleDateString(), startTime: new Date().toLocaleTimeString(),
      error: null, resultUrls: [], taskId: null,
    };
    CS.S.tasks.unshift(task); CS.saveTasks(); CS.renderTasks();
    CS.runTask(task);
  };

  CS.submitVideoTask = function(prompt, batchId) {
    const mList = CS.VIDEO_MODELS;
    const mc = mList.find(m => m.id === CS.S.model);
    const task = {
      id: CS.uid(), prompt, model: CS.S.model, batchId,
      modelName: mc?.name || CS.S.model, cost: mc?.cost || 0,
      ratio: CS.S.ratio, inputImages: [...CS.S.imgs], type: 'video',
      status: 'queued', progress: '0%', startDate: new Date().toLocaleDateString(), startTime: new Date().toLocaleTimeString(),
      error: null, resultUrls: [], taskId: null,
    };
    CS.S.tasks.unshift(task); CS.saveTasks(); CS.renderTasks();
    CS.runVideoTask(task);
  };

  CS.runVideoTask = async function(task) {
    try {
      task.status = 'processing'; task.startTimestamp = Date.now(); CS.saveTasks(); CS.renderTasks();
      const key = CS.S.cfg.apiKey;
      let resp, data;

      if (CS.useBackend) {
        resp = await fetch('/api/generate/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...CS.authHeaders() },
          body: JSON.stringify({ model: task.model, prompt: task.prompt, aspectRatio: task.ratio, images: task.inputImages, batchId: task.batchId })
        });
        if (!resp.ok) {
          const t = await resp.text(); let m = `API Error: ${resp.status}`;
          try {
            const j = JSON.parse(t);
            m = (j.error && typeof j.error === 'string') ? j.error : (j.error?.message || j.message || m);
          } catch {}
          throw new Error(m);
        }
        data = await resp.json();
        if (data.cost) task.cost = data.cost;
        if (data.error) {
          if (data.call_id) task.callId = data.call_id;
          throw new Error(typeof data.error === 'string' ? data.error : (data.error.message || 'Generation failed'));
        }
      } else {
        throw new Error('Video generation requires backend connection');
      }

      if (data.task_id) {
        task.taskId = data.task_id; CS.saveTasks(); CS.renderTasks();
        let att = 0;
        while (att < 300) {
          await new Promise(r => setTimeout(r, 5000)); att++;
          const pollUrl = `/api/generate/video/task/${data.task_id}`;
          const poll = await fetch(pollUrl, { headers: CS.authHeaders() });
          if (!poll.ok) continue;
          const res = await poll.json();
          task.progress = res.progress || `${Math.min(att, 99)}%`; CS.saveTasks(); CS.renderTasks();
          if (res.status === 'SUCCESS') {
            let urls = [];
            if (res.data?.output) urls = [res.data.output];
            else if (res.data?.outputs) urls = res.data.outputs;
            task.resultUrls = urls;
            break;
          }
          else if (res.status === 'FAILURE') throw new Error(res.fail_reason || 'Generation failed');
        }
        if (!task.resultUrls.length) throw new Error('Task timed out');
      } else {
        if (data.data && Array.isArray(data.data)) task.resultUrls = data.data.map(d => d.url);
        else if (data.url) task.resultUrls = [data.url];
        else throw new Error('Invalid response');
      }
      task.status = 'success'; task.progress = '100%'; task.endTimestamp = Date.now(); CS.addCostLog(task.cost || 0);
      task.resultIds = [];
      for (const u of task.resultUrls) {
        const item = { id: CS.uid(), type: 'video', status: 'success', url: u, prompt: task.prompt, model: task.model, modelName: task.modelName, ratio: task.ratio, cost: task.cost, time: new Date().toLocaleTimeString() };
        task.resultIds.push(item.id);
        CS.S.history.unshift(item);
      }
      CS.saveHistory(); CS.renderResults();
    } catch (err) {
      task.status = 'failed'; task.error = err.message; task.endTimestamp = Date.now();
      if (task.taskId) {
        try { await fetch(`/api/generate/refund/${task.taskId}`, { method: 'POST', headers: CS.authHeaders() }); } catch (e) {}
      } else if (task.callId) {
        try { await fetch(`/api/generate/refund-by-callid/${task.callId}`, { method: 'POST', headers: CS.authHeaders() }); } catch (e) {}
      }
      CS.S.history.unshift({ id: CS.uid(), type: 'video', status: 'failed', error: err.message, prompt: task.prompt, model: task.model, modelName: task.modelName, ratio: task.ratio, cost: task.cost, time: new Date().toLocaleTimeString() });
      CS.saveHistory(); CS.renderResults();
    }
    CS.saveTasks(); CS.renderTasks();
  };

  CS.runTask = async function(task) {
    try {
      task.status = 'processing'; task.startTimestamp = Date.now(); CS.saveTasks(); CS.renderTasks();
      const key = CS.S.cfg.apiKey;
      let resp, data;

      if (CS.useBackend) {
        resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...CS.authHeaders() },
          body: JSON.stringify({ model: task.model, prompt: task.prompt, aspectRatio: task.ratio, resolution: task.res, inputImages: task.inputImages, batchId: task.batchId })
        });
        if (!resp.ok) {
          const t = await resp.text(); let m = `API Error: ${resp.status}`;
          try {
            const j = JSON.parse(t);
            m = (j.error && typeof j.error === 'string') ? j.error : (j.error?.message || j.message || m);
          } catch {}
          throw new Error(m);
        }
        data = await resp.json();
        if (data.cost) task.cost = data.cost;
        if (data.error) {
          if (data.call_id) task.callId = data.call_id;
          throw new Error(typeof data.error === 'string' ? data.error : (data.error.message || 'Generation failed'));
        }
      } else {
        const isNano = task.model.includes('nano-banana') || task.model === 'gemini-3.1-flash-image-preview';
        const hasImg = task.inputImages.length > 0;
        let url = hasImg ? `${CS.API_DIRECT}/v1/images/edits` : `${CS.API_DIRECT}/v1/images/generations`;
        if (isNano) url += '?async=true';
        const headers = { Authorization: `Bearer ${key}` };
        let body;
        if (hasImg) {
          const fd = new FormData();
          for (let i = 0; i < task.inputImages.length; i++) { const bl = await (await fetch(task.inputImages[i])).blob(); fd.append('image', bl, `image_${i}.png`); }
          fd.append('prompt', task.prompt); fd.append('model', task.model); fd.append('n', '1'); fd.append('aspect_ratio', task.ratio); fd.append('response_format', 'url');
          if (task.model === 'nano-banana-2' || task.model === 'gemini-3.1-flash-image-preview') fd.append('image_size', task.res);
          body = fd;
        } else {
          headers['Content-Type'] = 'application/json';
          const p = { prompt: task.prompt, model: task.model, n: 1, aspect_ratio: task.ratio, response_format: 'url' };
          if (task.model === 'nano-banana-2' || task.model === 'gemini-3.1-flash-image-preview') p.image_size = task.res;
          body = JSON.stringify(p);
        }
        resp = await fetch(url, { method: 'POST', headers, body });
        if (!resp.ok) {
          const t = await resp.text(); let m = `API Error: ${resp.status}`;
          try {
            const j = JSON.parse(t);
            m = (j.error && typeof j.error === 'string') ? j.error : (j.error?.message || j.message || m);
          } catch {}
          throw new Error(m);
        }
        data = await resp.json();
      }

      const tid = data.task_id || data.data;

      if (tid) {
        task.taskId = tid; CS.saveTasks(); CS.renderTasks();
        let att = 0;
        while (att < 150) {
          await new Promise(r => setTimeout(r, 2000)); att++;
          const pollUrl = CS.useBackend ? `/api/generate/task/${tid}` : `${CS.API_DIRECT}/v1/images/tasks/${tid}`;
          const pollHeaders = CS.useBackend ? CS.authHeaders() : { Authorization: `Bearer ${key}` };
          const poll = await fetch(pollUrl, { headers: pollHeaders });
          if (!poll.ok) continue;
          const res = await poll.json();
          const info = res.data || {};
          task.progress = info.progress || `${Math.min(att * 2, 95)}%`; CS.saveTasks(); CS.renderTasks();

          if (info.status === 'SUCCESS') {
            const resultData = info.data || {};
            const images = resultData.data || [];
            task.resultUrls = images.map(d => d.url || d.b64_json);
            if (!task.resultUrls.length && resultData.url) task.resultUrls = [resultData.url];
            break;
          }
          else if (info.status === 'FAILURE') throw new Error(info.fail_reason || 'Generation failed');
        }
        if (!task.resultUrls.length) throw new Error('Task timed out');
      } else {
        if (data.data && Array.isArray(data.data)) task.resultUrls = data.data.map(d => d.url || d.b64_json);
        else if (data.url) task.resultUrls = [data.url];
        else throw new Error('Invalid response');
      }
      task.status = 'success'; task.progress = '100%'; task.endTimestamp = Date.now(); CS.addCostLog(task.cost || 0);
      task.resultIds = [];
      for (const u of task.resultUrls) {
        const item = { id: CS.uid(), type: 'image', status: 'success', url: u, prompt: task.prompt, model: task.model, modelName: task.modelName, ratio: task.ratio, cost: task.cost, time: new Date().toLocaleTimeString() };
        task.resultIds.push(item.id);
        CS.S.history.unshift(item);
        await CS.cacheImage(item.id, u);
      }
      CS.saveHistory(); CS.renderResults();
    } catch (err) {
      task.status = 'failed'; task.error = err.message; task.endTimestamp = Date.now();
      if (task.taskId) {
        try { await fetch(`/api/generate/refund/${task.taskId}`, { method: 'POST', headers: CS.authHeaders() }); } catch (e) {}
      } else if (task.callId) {
        try { await fetch(`/api/generate/refund-by-callid/${task.callId}`, { method: 'POST', headers: CS.authHeaders() }); } catch (e) {}
      }
      CS.S.history.unshift({ id: CS.uid(), type: 'image', status: 'failed', error: err.message, prompt: task.prompt, model: task.model, modelName: task.modelName, ratio: task.ratio, cost: task.cost, time: new Date().toLocaleTimeString() });
      CS.saveHistory(); CS.renderResults();
    }
    CS.saveTasks(); CS.renderTasks();
  };

  CS.resumeInterruptedTasks = function() {
    CS.S.tasks.forEach(t => {
      if (t.status === 'processing' || t.status === 'queued') {
        if (t.taskId && CS.S.cfg.apiKey) {
          t.status = 'processing'; t.progress = '恢复轮询...';
          CS.resumePoll(t);
        } else {
          t.status = 'interrupted'; t.error = '页面刷新，任务中断';
        }
      }
    });
    CS.saveTasks(); CS.renderTasks();
  };

  CS.resumePoll = async function(task) {
    const key = CS.S.cfg.apiKey;
    try {
      let att = 0;
      while (att < 150) {
        await new Promise(r => setTimeout(r, 2000)); att++;
        const rpUrl = CS.useBackend ? `/api/generate/task/${task.taskId}` : `${CS.API_DIRECT}/v1/images/tasks/${task.taskId}`;
        const rpH = CS.useBackend ? CS.authHeaders() : { Authorization: `Bearer ${key}` };
        const poll = await fetch(rpUrl, { headers: rpH });
        if (!poll.ok) continue;
        const res = await poll.json(); const info = res.data || {};
        task.progress = info.progress || `${Math.min(att * 2, 95)}%`; CS.saveTasks(); CS.renderTasks();
        if (info.status === 'SUCCESS') {
          task.resultUrls = (info.data?.data || []).map(d => d.url || d.b64_json);
          task.status = 'success'; task.progress = '100%'; task.endTimestamp = Date.now(); CS.addCostLog(task.cost || 0);
          task.resultIds = [];
          for (const u of task.resultUrls) {
            const item = { id: CS.uid(), type: 'image', status: 'success', url: u, prompt: task.prompt, model: task.model, modelName: task.modelName, ratio: task.ratio, cost: task.cost || 0, time: new Date().toLocaleTimeString() };
            task.resultIds.push(item.id);
            CS.S.history.unshift(item);
            await CS.cacheImage(item.id, u);
          }
          CS.saveHistory(); CS.renderResults(); CS.saveTasks(); CS.renderTasks(); return;
        } else if (info.status === 'FAILURE') throw new Error(info.fail_reason || 'Failed');
      }
      throw new Error('Task timed out');
    } catch (err) {
      task.status = 'failed'; task.error = err.message; task.endTimestamp = Date.now();
      CS.saveTasks(); CS.renderTasks();
    }
  };
})();
