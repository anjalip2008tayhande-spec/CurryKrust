/**
 * CurryKrust Settings & Preferences Manager
 * Connects to PUT /api/users/{user_id}/settings
 */

const Settings = {
  init() {
    this.setupListeners();
    this.loadCurrentSettings();
    this.checkApiHealth();
  },

  setupListeners() {
    const form = document.getElementById('settings-profile-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const themeToggle = document.getElementById('theme-select-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        App.setTheme(newTheme);
      });
    }

    const checkHealthBtn = document.getElementById('check-api-health-btn');
    if (checkHealthBtn) {
      checkHealthBtn.addEventListener('click', () => this.checkApiHealth());
    }
  },

  loadCurrentSettings() {
    const user = Auth.getUser();
    if (!user) return;

    const usernameInput = document.getElementById('settings-username-input');
    const emailInput = document.getElementById('settings-email-input');
    const bioInput = document.getElementById('settings-bio-input');
    const themeSelect = document.getElementById('theme-select-toggle');

    if (usernameInput) usernameInput.value = user.username || '';
    if (emailInput) emailInput.value = user.email || '';
    if (bioInput) bioInput.value = user.bio || '';
    if (themeSelect) themeSelect.value = document.documentElement.getAttribute('data-theme') || 'dark';
  },

  async handleSubmit(e) {
    e.preventDefault();
    const user = Auth.getUser();
    if (!user) return;

    const username = document.getElementById('settings-username-input')?.value.trim();
    const email = document.getElementById('settings-email-input')?.value.trim();
    const bio = document.getElementById('settings-bio-input')?.value.trim();
    const theme = document.getElementById('theme-select-toggle')?.value || 'dark';

    const saveBtn = document.getElementById('settings-save-btn');
    const originalText = saveBtn?.innerHTML;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Saving...</span>';
    }

    try {
      const payload = { username, email, bio, theme };
      const res = await API.updateSettings(user.id, payload);

      // Update local storage
      const updatedUser = { ...user, ...payload };
      Auth.setUser(updatedUser);
      App.setTheme(theme);

      App.showToast('Settings saved successfully!', 'success');
    } catch (err) {
      App.showToast(`Failed to update settings: ${err.message}`, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    }
  },

  async checkApiHealth() {
    const badge = document.getElementById('api-health-badge');
    const desc = document.getElementById('api-health-desc');
    if (!badge) return;

    badge.className = 'badge badge-cyan';
    badge.textContent = 'Pinging...';

    const isHealthy = await API.checkHealth();
    if (isHealthy) {
      badge.className = 'badge badge-emerald';
      badge.textContent = '● Backend Connected';
      if (desc) desc.textContent = `FastAPI server responding at ${API.baseUrl}`;
    } else {
      badge.className = 'badge badge-amber';
      badge.textContent = '● Offline / Mock Mode';
      if (desc) desc.textContent = `Backend not detected at ${API.baseUrl}. (Make sure uvicorn is running!)`;
    }
  }
};

window.Settings = Settings;
