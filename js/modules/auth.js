// Candy Studio: Authentication
// Login, register, logout, profile management

(function() {
  window.CS = window.CS || {};

  CS.doLogin = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value;
    if (!email || !pass) return CS.showAuthError('请填写邮箱和密码');

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const d = await r.json();
      if (!r.ok) return CS.showAuthError(d.error || '登录失败');

      CS.authToken = d.token;
      CS.setStoredAuthToken(CS.authToken);
      CS.S.cfg.apiKey = CS.authToken;
      CS.switchUserContext(d.user);
      CS.renderResults();
      CS.renderTasks();
      CS.showUserInfo();
    } catch (e) {
      CS.showAuthError('网络错误');
    }
  };

  CS.doRegister = async function() {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value;
    if (!email || !pass) return CS.showAuthError('请填写邮箱和密码');
    if (pass.length < 6) return CS.showAuthError('密码至少 6 位');

    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const d = await r.json();
      if (!r.ok) return CS.showAuthError(d.error || '注册失败');

      CS.authToken = d.token;
      CS.setStoredAuthToken(CS.authToken);
      CS.S.cfg.apiKey = CS.authToken;
      CS.switchUserContext(d.user);
      CS.renderResults();
      CS.renderTasks();
      CS.showUserInfo();
    } catch (e) {
      CS.showAuthError('网络错误');
    }
  };

  CS.doLogout = function() {
    CS.authToken = '';
    CS.S.user = null;
    CS.S.cfg.apiKey = '';
    CS.setStoredAuthToken('');
    CS.clearUserData();
    CS.renderResults();
    CS.renderTasks();
    CS.showLoginForm();
    if (CS.renderModels) {
      CS.renderModels();
      CS.updateCostPreview();
    }
  };

  CS.showAuthError = function(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
  };

  CS.showLoginForm = function() {
    document.getElementById('auth-login-form').classList.remove('hidden');
    document.getElementById('auth-user-info').classList.add('hidden');
  };

  CS.showUserInfo = function() {
    document.getElementById('auth-login-form').classList.add('hidden');
    document.getElementById('auth-user-info').classList.remove('hidden');
    if (CS.S.user) {
      document.getElementById('user-nickname').textContent = CS.S.user.nickname || CS.S.user.email;
      document.getElementById('user-email').textContent = CS.S.user.email;
      document.getElementById('user-points').textContent = CS.S.user.points?.toFixed ? CS.S.user.points.toFixed(2) : CS.S.user.points;

      const memEl = document.getElementById('user-membership');
      if (CS.S.user.membership_tier && CS.S.user.membership_tier !== 'none' && CS.S.user.membership_expire_at) {
        const expDate = new Date(CS.S.user.membership_expire_at);
        if (expDate > new Date()) {
          fetch('/api/public-config').then(r => r.json()).then(d => {
            const msList = d.memberships || [];
            const ms = msList.find(m => m.id === CS.S.user.membership_tier);
            if (ms) {
              memEl.textContent = `${ms.name} (至 ${CS.S.user.membership_expire_at.substring(0, 10)})`;
              memEl.className = 'text-[10px] font-bold mt-0.5 text-orange-500';
              memEl.classList.remove('hidden');
            } else {
              memEl.classList.add('hidden');
            }
          }).catch(() => memEl.classList.add('hidden'));
        } else {
          memEl.classList.add('hidden');
        }
      } else {
        memEl.classList.add('hidden');
      }

      if (CS.renderModels) {
        CS.renderModels();
        CS.updateCostPreview();
      }
    }
  };

  CS.refreshProfile = async function() {
    if (!CS.authToken) return;

    try {
      const r = await fetch(`/api/user/profile?_ts=${Date.now()}`, {
        headers: CS.authHeaders(),
        cache: 'no-store'
      });
      if (r.ok) {
        const user = await r.json();
        CS.switchUserContext(user);
        CS.renderResults();
        CS.renderTasks();
        CS.showUserInfo();
      } else if (r.status === 401) {
        CS.doLogout();
        CS.showAuthError('登录状态已失效，请重新登录');
      }
    } catch {}
  };

  CS.queryQuota = async function() {
    if (CS.useBackend) {
      CS.refreshProfile();
      return;
    }
  };
})();
