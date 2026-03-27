// ── Candy Studio: Panel Resize ──
// Draggable panel width adjustment

(function() {
  window.CS = window.CS || {};

  const panels = { sidebar: document.getElementById('panel-sidebar'), controls: document.getElementById('panel-controls'), tasks: document.getElementById('panel-tasks') };
  const limits = { sidebar: { min: 50, max: 500 }, controls: { min: 100, max: 800 }, tasks: { min: 50, max: 500 } };
  const saved = JSON.parse(localStorage.getItem('candy_widths') || '{}');
  if (saved.sidebar) panels.sidebar.style.width = saved.sidebar + 'px';
  if (saved.controls) panels.controls.style.width = saved.controls + 'px';
  if (saved.tasks) panels.tasks.style.width = saved.tasks + 'px';

  document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      const which = handle.dataset.resize;
      const rightPanels = ['results', 'tasks'];
      const isRight = rightPanels.includes(which);
      let target;
      if (which === 'sidebar') target = panels.sidebar;
      else if (which === 'controls') target = panels.controls;
      else if (which === 'results') target = panels.tasks;
      if (!target) return;
      const lim = limits[which === 'results' ? 'tasks' : which];
      const startX = e.clientX, startW = target.offsetWidth;
      handle.classList.add('active'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
      const onMove = ev => { const diff = isRight ? (startX - ev.clientX) : (ev.clientX - startX); const nw = Math.max(lim.min, Math.min(lim.max, startW + diff)); target.style.width = nw + 'px'; };
      const onUp = () => { handle.classList.remove('active'); document.body.style.cursor = ''; document.body.style.userSelect = ''; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); saveWidths(); };
      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    });
  });

  function saveWidths() { localStorage.setItem('candy_widths', JSON.stringify({ sidebar: panels.sidebar.offsetWidth, controls: panels.controls.offsetWidth, tasks: panels.tasks.offsetWidth })); }
})();
