/**
 * CurryKrust Progress & Study Time Tracking Manager
 * Connects to /api/progress/{user_id} and /api/progress/log
 */

const Progress = {
  progressData: null,
  timerInterval: null,
  timerSeconds: 0,
  timerRunning: false,

  async init() {
    this.setupListeners();
    await this.loadProgress();
  },

  setupListeners() {
    // Quick log chips
    const chips = document.querySelectorAll('.time-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const mins = parseFloat(chip.getAttribute('data-mins') || 15);
        this.logMinutes(mins);
      });
    });

    // Custom time form submit
    const customForm = document.getElementById('custom-log-form');
    if (customForm) {
      customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('custom-mins-input');
        const mins = parseFloat(input?.value || 0);
        if (mins > 0) {
          this.logMinutes(mins);
          if (input) input.value = '';
        }
      });
    }

    // Live Focus Timer buttons
    const startBtn = document.getElementById('timer-start-btn');
    const pauseBtn = document.getElementById('timer-pause-btn');
    const resetBtn = document.getElementById('timer-reset-btn');
    const logTimerBtn = document.getElementById('timer-log-session-btn');

    if (startBtn) startBtn.addEventListener('click', () => this.startTimer());
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.pauseTimer());
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());
    if (logTimerBtn) logTimerBtn.addEventListener('click', () => this.logTimerSession());
  },

  async loadProgress() {
    const user = Auth.getUser();
    if (!user) return;

    try {
      this.progressData = await API.getProgress(user.id);
      this.render();
    } catch (err) {
      console.warn("Could not load progress data:", err.message);
      // Fallback sample data if starting up
      const today = new Date();
      const formatD = (d) => d.toISOString().split('T')[0];
      this.progressData = {
        total_hours_all_time: 3.5,
        daily_logs: [
          { date: formatD(new Date(Date.now() - 3 * 86400000)), minutes_spent: 45 },
          { date: formatD(new Date(Date.now() - 2 * 86400000)), minutes_spent: 60 },
          { date: formatD(new Date(Date.now() - 1 * 86400000)), minutes_spent: 75 },
          { date: formatD(today), minutes_spent: 30 }
        ]
      };
      this.render();
    }
  },

  render() {
    if (!this.progressData) return;

    const totalHoursEl = document.getElementById('prog-total-hours');
    const todayMinsEl = document.getElementById('prog-today-mins');
    const streakEl = document.getElementById('prog-streak-days');
    const consistencyEl = document.getElementById('prog-consistency-pct');

    const totalHours = this.progressData.total_hours_all_time || 0;
    const logs = this.progressData.daily_logs || [];

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = logs.find(l => l.date === todayStr);
    const todayMinutes = todayEntry ? todayEntry.minutes_spent : 0;

    if (totalHoursEl) totalHoursEl.textContent = `${totalHours} hrs`;
    if (todayMinsEl) todayMinsEl.textContent = `${Math.round(todayMinutes)} mins`;
    if (streakEl) streakEl.textContent = `${Math.min(logs.length, 7)} Days`;
    if (consistencyEl) consistencyEl.textContent = `${Math.min(100, Math.round((todayMinutes / 60) * 100))}%`;

    // Also update Topbar Pill
    const topbarTimer = document.getElementById('topbar-today-timer');
    if (topbarTimer) {
      topbarTimer.textContent = `${Math.round(todayMinutes)}m today`;
    }

    this.renderChart(logs);
  },

  renderChart(logs) {
    const container = document.getElementById('daily-bar-chart');
    if (!container) return;

    if (!logs || logs.length === 0) {
      container.innerHTML = `<p style="margin: auto; color: var(--text-muted);">No study logs yet. Start by logging your first focus session!</p>`;
      return;
    }

    // Find max minutes for scale (minimum 60m for clean aspect ratio)
    const maxMins = Math.max(60, ...logs.map(l => l.minutes_spent || 0));

    container.innerHTML = logs.map(l => {
      const heightPct = Math.min(100, Math.max(8, Math.round((l.minutes_spent / maxMins) * 100)));
      const dateParts = l.date.split('-');
      const shortDate = dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : l.date;

      return `
        <div class="bar-column">
          <span style="font-size: 0.7rem; font-family: var(--font-code); color: var(--text-secondary);">${Math.round(l.minutes_spent)}m</span>
          <div class="bar-fill" style="height: ${heightPct}%;" title="${l.date}: ${l.minutes_spent} minutes logged"></div>
          <span class="bar-label">${shortDate}</span>
        </div>
      `;
    }).join('');
  },

  async logMinutes(mins) {
    const user = Auth.getUser();
    if (!user) return;

    try {
      await API.logTime(user.id, mins);
      App.showToast(`Logged +${mins} minutes of focused study!`, 'success');
      await this.loadProgress();
      // Also update dashboard stats
      Dashboard.loadDashboardData();
    } catch (err) {
      App.showToast(`Failed to log time: ${err.message}`, 'error');
    }
  },

  // Focus Timer Logic
  startTimer() {
    if (this.timerRunning) return;
    this.timerRunning = true;

    const startBtn = document.getElementById('timer-start-btn');
    const pauseBtn = document.getElementById('timer-pause-btn');
    if (startBtn) startBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-flex';

    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.updateTimerDisplay();
    }, 1000);
  },

  pauseTimer() {
    this.timerRunning = false;
    clearInterval(this.timerInterval);

    const startBtn = document.getElementById('timer-start-btn');
    const pauseBtn = document.getElementById('timer-pause-btn');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (pauseBtn) pauseBtn.style.display = 'none';
  },

  resetTimer() {
    this.pauseTimer();
    this.timerSeconds = 0;
    this.updateTimerDisplay();
  },

  updateTimerDisplay() {
    const display = document.getElementById('focus-timer-clock');
    if (!display) return;
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  async logTimerSession() {
    const minutes = Math.round((this.timerSeconds / 60) * 10) / 10;
    if (minutes < 1) {
      App.showToast('Please study for at least 1 minute before logging a session.', 'info');
      return;
    }
    this.pauseTimer();
    await this.logMinutes(minutes);
    this.resetTimer();
  },

  openQuickLogModal(projectId) {
    const customMinutes = prompt("Enter study minutes to log for this project:", "30");
    if (customMinutes && !isNaN(customMinutes) && parseFloat(customMinutes) > 0) {
      this.logMinutes(parseFloat(customMinutes));
    }
  }
};

window.Progress = Progress;
