/**
 * CurryKrust Auth State Manager
 */

const Auth = {
  CURRENT_USER_KEY: 'currykrust_user',

  getUser() {
    const raw = localStorage.getItem(this.CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },

  setUser(user) {
    if (!user) {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    } else {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    }
    this.updateUserUI(user);
  },

  isAuthenticated() {
    return !!this.getUser();
  },

  async login(username, password) {
    const res = await API.login(username, password);
    if (res && res.user) {
      this.setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid login response');
  },

  async signup(username, email, password) {
    const res = await API.signup(username, email, password);
    if (res && res.user) {
      this.setUser(res.user);
      return res.user;
    }
    throw new Error('Registration failed');
  },

  quickDemoLogin() {
    const demoUser = {
      id: 1,
      username: 'alex_learner',
      email: 'alex@currykrust.ai',
      bio: 'Tech newbie crushing procrastination with CurryKrust!',
      theme: 'dark'
    };
    this.setUser(demoUser);
    return demoUser;
  },

  logout() {
    this.setUser(null);
    window.location.hash = '#login';
    App.showToast('You have been logged out.', 'info');
  },

  updateUserUI(user) {
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    if (user && nameEl && avatarEl) {
      nameEl.textContent = user.username || 'Learner';
      avatarEl.textContent = (user.username || 'A').charAt(0).toUpperCase();
    }
  }
};

window.Auth = Auth;
