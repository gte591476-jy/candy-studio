// ── Candy Studio Admin: Stats & Charts ──

(function() {
  window.CA = window.CA || {};

  // Chart instances
  let dailyChart, modelChart, taskTypeChart, dailyModelsChart, chart30day, hourlyChart, userModelsChart;

  // Rich color palette
  const COLORS = [
    '#3b82f6','#22c55e','#f97316','#8b5cf6','#ef4444','#06b6d4',
    '#f59e0b','#ec4899','#14b8a6','#6366f1','#84cc16','#e11d48',
    '#0ea5e9','#a855f7','#10b981'
  ];

  const TASK_TYPE_LABELS = { image:'图片生成', video:'视频生成' };
  const TASK_TYPE_COLORS = { image:'#3b82f6', video:'#8b5cf6' };

  function destroyAll() {
    [dailyChart, modelChart, taskTypeChart, dailyModelsChart, chart30day, hourlyChart, userModelsChart].forEach(c => { if (c) c.destroy(); });
  }

  CA.loadStats = async function() {
    try {
      const r = await CA.api('/api/admin/stats'); if (!r.ok) return;
      const d = await r.json();
      destroyAll();

      // ── Stat Cards (8 cards, 2 rows) ──
      document.getElementById('stats-grid').innerHTML = [
        { l:'用户总数', v:d.userCount, c:'blue', icon:'👥' },
        { l:'总调用(成功)', v:d.totalCalls, c:'green', icon:'✅' },
        { l:'今日调用', v:d.todayCalls, c:'purple', icon:'📊' },
        { l:'今日消耗', v:d.todayCost?.toFixed(2), c:'orange', icon:'🔥' },
        { l:'今日新增用户', v:d.todayNewUsers, c:'cyan', icon:'🆕' },
        { l:'活跃会员', v:d.activeMembers, c:'amber', icon:'👑' },
        { l:'总充值收入', v:'¥'+d.totalRevenue?.toFixed(2), c:'emerald', icon:'💰' },
        { l:'失败调用', v:d.failedCalls, c:'red', icon:'❌' },
      ].map(s => `<div class="stat-card card p-4">
        <div class="flex items-center gap-2 mb-1"><span class="text-sm">${s.icon}</span><span class="text-[10px] text-gray-400">${s.l}</span></div>
        <div class="text-xl font-bold text-${s.c}-600">${s.v}</div>
      </div>`).join('');

      // ── Chart 1: 7-Day Trend (line, dual axis) ──
      const days = (d.dailyStats || []).map(r => r.day?.substring(5) || '');
      const counts = (d.dailyStats || []).map(r => parseInt(r.count));
      const costs = (d.dailyStats || []).map(r => parseFloat(r.cost));
      dailyChart = new Chart(document.getElementById('chart-daily'), {
        type:'line',
        data:{ labels:days, datasets:[
          { label:'调用次数', data:counts, borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,0.1)', tension:.3, fill:true },
          { label:'算力消耗', data:costs, borderColor:'#f97316', backgroundColor:'rgba(249,115,22,0.1)', tension:.3, fill:true, yAxisID:'y1' }
        ]},
        options:{ responsive:true, plugins:{ legend:{position:'bottom',labels:{font:{size:10}}} }, scales:{ y:{beginAtZero:true,grid:{color:'#f1f5f9'}}, y1:{position:'right',beginAtZero:true,grid:{display:false}} } }
      });

      // ── Chart 2: Model Doughnut ──
      const mLabels = (d.modelStats || []).map(r => r.model || '');
      const mCounts = (d.modelStats || []).map(r => parseInt(r.count));
      modelChart = new Chart(document.getElementById('chart-model'), {
        type:'doughnut',
        data:{ labels:mLabels, datasets:[{ data:mCounts, backgroundColor:COLORS.slice(0, mLabels.length), borderWidth:2, borderColor:'#fff' }] },
        options:{ responsive:true, plugins:{ legend:{position:'bottom',labels:{font:{size:9},boxWidth:10}} } }
      });

      // ── Chart 3: Task Type Pie ──
      const ttLabels = (d.taskTypeStats || []).map(r => TASK_TYPE_LABELS[r.task_type] || r.task_type);
      const ttCounts = (d.taskTypeStats || []).map(r => parseInt(r.count));
      const ttColors = (d.taskTypeStats || []).map(r => TASK_TYPE_COLORS[r.task_type] || '#999');
      taskTypeChart = new Chart(document.getElementById('chart-tasktype'), {
        type:'pie',
        data:{ labels:ttLabels, datasets:[{ data:ttCounts, backgroundColor:ttColors, borderWidth:2, borderColor:'#fff' }] },
        options:{ responsive:true, plugins:{ legend:{position:'bottom',labels:{font:{size:10}}} } }
      });

      // ── Chart 4: Daily Model Stacked Bar ──
      const dmData = d.dailyModelStats || [];
      const dmDays = [...new Set(dmData.map(r => r.day))].sort();
      const dmModels = [...new Set(dmData.map(r => r.model))];
      const dmDatasets = dmModels.map((model, i) => ({
        label: model,
        data: dmDays.map(day => {
          const row = dmData.find(r => r.day === day && r.model === model);
          return row ? parseInt(row.count) : 0;
        }),
        backgroundColor: COLORS[i % COLORS.length],
      }));
      dailyModelsChart = new Chart(document.getElementById('chart-daily-models'), {
        type:'bar',
        data:{ labels:dmDays.map(d => d.substring(5)), datasets:dmDatasets },
        options:{ responsive:true, scales:{ x:{stacked:true,grid:{display:false}}, y:{stacked:true,beginAtZero:true,grid:{color:'#f1f5f9'}} }, plugins:{ legend:{position:'bottom',labels:{font:{size:9},boxWidth:10}} } }
      });

      // ── Chart 5: 30-Day API Trend (area) ──
      const d30Days = (d.daily30Stats || []).map(r => r.day?.substring(5) || '');
      const d30Counts = (d.daily30Stats || []).map(r => parseInt(r.count));
      chart30day = new Chart(document.getElementById('chart-30day'), {
        type:'line',
        data:{ labels:d30Days, datasets:[{
          label:'调用次数', data:d30Counts,
          borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.15)',
          tension:.4, fill:true, pointRadius:2, pointBackgroundColor:'#3b82f6'
        }]},
        options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ x:{grid:{display:false}}, y:{beginAtZero:true,grid:{color:'#f1f5f9'}} } }
      });

      // ── Chart 6: Hourly Distribution ──
      const hourLabels = Array.from({length:24}, (_,i) => i+':00');
      const hourData = hourLabels.map((_,i) => {
        const row = (d.hourlyStats || []).find(r => parseInt(r.hour) === i);
        return row ? parseInt(row.count) : 0;
      });
      hourlyChart = new Chart(document.getElementById('chart-hourly'), {
        type:'line',
        data:{ labels:hourLabels, datasets:[{
          label:'调用次数', data:hourData,
          borderColor:'#22c55e', backgroundColor:'rgba(34,197,94,0.1)',
          tension:.3, fill:true, pointRadius:3, pointBackgroundColor:'#22c55e',
          pointBorderColor:'#fff', pointBorderWidth:1
        }]},
        options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ x:{grid:{display:false}}, y:{beginAtZero:true,grid:{color:'#f1f5f9'}} } }
      });

      // ── Chart 7: User-Model Stacked Bar ──
      const umData = d.userModelStats || [];
      const topUserIds = d.topUsers ? d.topUsers.map(u => u.user_id) : [];
      const umUsers = topUserIds.slice(0, 10);
      const umUserLabels = umUsers.map(uid => {
        const u = d.topUsers.find(t => t.user_id === uid);
        return u ? (u.nickname || u.email?.split('@')[0] || `#${uid}`) : `#${uid}`;
      });
      const umModels = [...new Set(umData.filter(r => umUsers.includes(r.user_id)).map(r => r.model))];
      const umDatasets = umModels.map((model, i) => ({
        label: model,
        data: umUsers.map(uid => {
          const row = umData.find(r => r.user_id === uid && r.model === model);
          return row ? parseInt(row.count) : 0;
        }),
        backgroundColor: COLORS[i % COLORS.length],
      }));
      userModelsChart = new Chart(document.getElementById('chart-user-models'), {
        type:'bar',
        data:{ labels:umUserLabels, datasets:umDatasets },
        options:{ responsive:true, scales:{ x:{stacked:true,grid:{display:false}}, y:{stacked:true,beginAtZero:true,grid:{color:'#f1f5f9'}} }, plugins:{ legend:{position:'bottom',labels:{font:{size:9},boxWidth:10}} } }
      });

    } catch(e) { console.error('loadStats error:', e); }
  };
})();
