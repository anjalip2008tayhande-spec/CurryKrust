/**
 * CurryKrust API Client
 * Seamlessly connects to FastAPI backend endpoints with intelligent fallbacks
 */

const API_BASE = (function () {
  const origin = window.location.origin;
  // If running on backend server (e.g. http://127.0.0.1:8000), use relative origin
  if (origin && !origin.startsWith('file:') && !origin.includes('null')) {
    return origin;
  }
  return 'http://127.0.0.1:8000';
})();

const API = {
  baseUrl: API_BASE,

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorDetail = 'API request failed';
        try {
          const errData = await response.json();
          errorDetail = errData.detail || errData.message || errorDetail;
        } catch (_) {}
        throw new Error(errorDetail);
      }
      return await response.json();
    } catch (err) {
      console.warn(`[CurryKrust API] Request failed at ${endpoint}:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  async signup(username, email, password) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },

  async login(username, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  // Projects Endpoints
  async getProjects(userId, search = '') {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/api/users/${userId}/projects${q}`);
  },

  async getProject(projectId) {
    return this.request(`/api/projects/${projectId}`);
  },

  async createProject(data) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async completeModule(projectId, moduleNumber) {
    return this.request(`/api/projects/${projectId}/complete-module`, {
      method: 'POST',
      body: JSON.stringify({ module_number: moduleNumber })
    });
  },

  async evaluateModule(projectId, moduleNumber, codeSubmission, notes = '') {
    return this.request(`/api/projects/${projectId}/evaluate-module`, {
      method: 'POST',
      body: JSON.stringify({
        module_number: moduleNumber,
        code_submission: codeSubmission,
        notes: notes
      })
    });
  },

  // Flashcards Hover Endpoints
  async getFlashcards(userId) {
    return this.request(`/api/users/${userId}/flashcards`);
  },

  // Progress Endpoints
  async logTime(userId, minutesSpent) {
    return this.request('/api/progress/log', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, minutes_spent: minutesSpent })
    });
  },

  async getProgress(userId) {
    return this.request(`/api/progress/${userId}`);
  },

  // Profile & Settings Endpoints
  async getProfile(userId) {
    return this.request(`/api/users/${userId}/profile`);
  },

  async updateSettings(userId, settingsData) {
    return this.request(`/api/users/${userId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settingsData)
    });
  },

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/`, { method: 'GET', headers: { 'Accept': 'application/json' } });
      return res.ok;
    } catch (_) {
      return false;
    }
  }
};

window.API = API;
