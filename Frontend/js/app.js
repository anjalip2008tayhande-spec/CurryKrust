/**
 * CurryKrust Application Bootstrap & Utilities
 */

const App = {
  theme: 'dark',

  init() {
    this.initTheme();
    this.setupGlobalListeners();
    this.setupAuthUI();
    this.initConfetti();

    // Check if user session exists; if not, seed with demo user for seamless test experience
    if (!Auth.getUser()) {
      Auth.quickDemoLogin();
    } else {
      Auth.updateUserUI(Auth.getUser());
    }

    // Initialize sub-modules
    Flashboard.init();
    Dashboard.init();
    AddProject.init();
    Modules.init();
    Progress.init();
    Profile.init();
    Settings.init();

    // Start router
    Router.init();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('currykrust_theme') || 'dark';
    this.setTheme(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const next = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
      });
    }
  },

  setTheme(themeName) {
    this.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('currykrust_theme', themeName);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.innerHTML = themeName === 'dark'
        ? `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`
        : `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
    }

    // Sync settings dropdown if open
    const themeSelect = document.getElementById('theme-select-toggle');
    if (themeSelect) themeSelect.value = themeName;
  },

  setupGlobalListeners() {
    // Mobile navigation drawer toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // User snippet in sidebar links to Profile
    const userSnippet = document.getElementById('sidebar-user-snippet');
    if (userSnippet) {
      userSnippet.addEventListener('click', () => {
        window.location.hash = '#profile';
      });
    }

    // Topbar today timer links to Progress
    const timerPill = document.getElementById('topbar-timer-pill');
    if (timerPill) {
      timerPill.addEventListener('click', () => {
        window.location.hash = '#progress';
      });
    }
  },

  setupAuthUI() {
    // Auth Tab Switch
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-mode');
        if (mode === 'signup') {
          if (loginForm) loginForm.style.display = 'none';
          if (signupForm) signupForm.style.display = 'block';
        } else {
          if (loginForm) loginForm.style.display = 'block';
          if (signupForm) signupForm.style.display = 'none';
        }
      });
    });

    // Login Form Submit
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('login-username').value.trim();
        const p = document.getElementById('login-password').value.trim();
        try {
          await Auth.login(u, p);
          this.showToast(`Welcome back, ${u}!`, 'success');
          window.location.hash = '#dashboard';
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }

    // Signup Form Submit
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('signup-username').value.trim();
        const em = document.getElementById('signup-email').value.trim();
        const p = document.getElementById('signup-password').value.trim();
        try {
          await Auth.signup(u, em, p);
          this.showToast('Account created successfully! Welcome to CurryKrust.', 'success');
          window.location.hash = '#dashboard';
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }

    // Quick Demo Sign In
    const demoBtn = document.getElementById('quick-demo-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        Auth.quickDemoLogin();
        this.showToast('Logged in as demo learner Alex!', 'success');
        window.location.hash = '#dashboard';
      });
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✗';

    toast.innerHTML = `
      <span style="font-weight: 700;">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  },

  // Confetti Particle Engine
  initConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  },

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  triggerConfetti() {
    if (!this.ctx) return;
    const pieces = [];
    const colors = ['#10B981', '#06B6D4', '#6366F1', '#8B5CF6', '#F59E0B', '#F43F5E'];
    const total = 90;

    for (let i = 0; i < total; i++) {
      pieces.push({
        x: window.innerWidth * (0.3 + Math.random() * 0.4),
        y: window.innerHeight * 0.5,
        w: 6 + Math.random() * 6,
        h: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: -10 - Math.random() * 12,
        gravity: 0.4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        opacity: 1
      });
    }

    let frame = 0;
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let alive = false;

      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotationSpeed;
        if (frame > 40) p.opacity -= 0.015;

        if (p.opacity > 0 && p.y < window.innerHeight) {
          alive = true;
          this.ctx.save();
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          this.ctx.restore();
        }
      });

      frame++;
      if (alive) {
        requestAnimationFrame(animate);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };

    requestAnimationFrame(animate);
  }
};

window.App = App;

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
