/**
 * CurryKrust Single Page Application Router
 * Seamless client-side hash routing between all requested views
 */

const Router = {
  routes: {
    'login': { pageId: 'page-login', requiresAuth: false, title: 'Sign In / Register' },
    'dashboard': { pageId: 'page-dashboard', requiresAuth: true, title: 'Dashboard' },
    'add-project': { pageId: 'page-add-project', requiresAuth: true, title: 'Add New Project' },
    'modules': { pageId: 'page-modules', requiresAuth: true, title: 'Curriculum & AI Mastery Gate' },
    'progress': { pageId: 'page-progress', requiresAuth: true, title: 'Daily Progress & Time Log' },
    'profile': { pageId: 'page-profile', requiresAuth: true, title: 'Learner Profile' },
    'settings': { pageId: 'page-settings', requiresAuth: true, title: 'Settings & Theme' }
  },

  defaultRoute: 'dashboard',

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  handleRoute() {
    let hash = window.location.hash.replace('#', '').trim();
    if (!hash || !this.routes[hash]) {
      hash = Auth.isAuthenticated() ? this.defaultRoute : 'login';
      window.location.hash = `#${hash}`;
      return;
    }

    const route = this.routes[hash];

    // Auth Guard
    if (route.requiresAuth && !Auth.isAuthenticated()) {
      window.location.hash = '#login';
      return;
    }

    // Redirect to dashboard if logged in and visiting login page
    if (hash === 'login' && Auth.isAuthenticated()) {
      window.location.hash = '#dashboard';
      return;
    }

    // Toggle Layout Elements (Sidebar and Topbar shouldn't show on Login page)
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    const mainWrapper = document.querySelector('.main-wrapper');

    if (hash === 'login') {
      if (sidebar) sidebar.style.display = 'none';
      if (topbar) topbar.style.display = 'none';
      if (mainWrapper) mainWrapper.style.marginLeft = '0';
    } else {
      if (sidebar) sidebar.style.display = 'flex';
      if (topbar) topbar.style.display = 'flex';
      if (mainWrapper && window.innerWidth > 992) mainWrapper.style.marginLeft = 'var(--sidebar-width)';
    }

    // Hide all pages, show target page
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    const targetEl = document.getElementById(route.pageId);
    if (targetEl) {
      targetEl.classList.add('active');
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkHash = link.getAttribute('href')?.replace('#', '');
      if (linkHash === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile menu if open
    document.querySelector('.sidebar')?.classList.remove('mobile-open');

    // Trigger page lifecycle updates
    this.onPageEnter(hash);
  },

  onPageEnter(route) {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (route === 'dashboard') {
      Dashboard.loadDashboardData();
    } else if (route === 'modules') {
      Modules.loadProjectSelector();
    } else if (route === 'progress') {
      Progress.loadProgress();
    } else if (route === 'profile') {
      Profile.loadProfile();
    } else if (route === 'settings') {
      Settings.loadCurrentSettings();
    } else if (route === 'add-project') {
      AddProject.updateSimulation();
    }

    // Refresh flashcards whenever entering app views
    if (route !== 'login') {
      Flashboard.refresh();
    }
  }
};

window.Router = Router;
