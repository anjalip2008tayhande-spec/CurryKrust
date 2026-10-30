/**
 * CurryKrust Add Project & Live ML Reality Check Simulator
 * Connects to /api/projects
 */

const AddProject = {
  selectedLevel: 'Beginner',

  init() {
    this.setupForm();
    this.setupLiveSimulation();
    this.setDefaultDeadline();
  },

  setDefaultDeadline() {
    const deadlineInput = document.getElementById('project-deadline');
    if (deadlineInput) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 14); // default 2 weeks out
      deadlineInput.value = targetDate.toISOString().split('T')[0];
      deadlineInput.min = new Date().toISOString().split('T')[0];
    }
  },

  setupForm() {
    // Level Selection Cards
    const levelCards = document.querySelectorAll('.level-card');
    levelCards.forEach(card => {
      card.addEventListener('click', () => {
        levelCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedLevel = card.getAttribute('data-level') || 'Beginner';
        this.updateSimulation();
      });
    });

    // Time Commitment Slider
    const slider = document.getElementById('project-time-slider');
    const badge = document.getElementById('slider-val-display');
    if (slider && badge) {
      slider.addEventListener('input', (e) => {
        badge.textContent = `${e.target.value}h`;
        this.updateSimulation();
      });
    }

    // Form Submit
    const form = document.getElementById('add-project-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  },

  setupLiveSimulation() {
    const inputs = ['project-title', 'project-desc', 'project-goal', 'project-deadline'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.updateSimulation());
      }
    });
    this.updateSimulation();
  },

  updateSimulation() {
    const title = document.getElementById('project-title')?.value || '';
    const desc = document.getElementById('project-desc')?.value || '';
    const goal = document.getElementById('project-goal')?.value || '';
    const hours = parseFloat(document.getElementById('project-time-slider')?.value || 2.5);
    const deadlineStr = document.getElementById('project-deadline')?.value;

    let daysRemaining = 14;
    if (deadlineStr) {
      const deadline = new Date(deadlineStr);
      const today = new Date();
      const diffTime = deadline - today;
      daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const totalHours = Math.round(daysRemaining * hours * 10) / 10;

    // Estimate complexity
    const combined = `${title} ${desc} ${goal}`.toLowerCase();
    let complexity = 3;
    const hardWords = ["machine learning", "ai", "neural", "fullstack", "blockchain", "cloud", "microservices", "deploy", "compiler", "3d"];
    const medWords = ["api", "database", "sql", "sqlite", "backend", "frontend", "javascript", "python", "react", "dashboard", "auth"];
    hardWords.forEach(w => { if (combined.includes(w)) complexity += 2; });
    medWords.forEach(w => { if (combined.includes(w)) complexity += 1; });
    complexity = Math.min(Math.max(complexity, 2), 10);

    // Predict Feasibility
    let status = "Realistic & Achievable with Discipline";
    let depth = "Standard Balanced Course (4 Modules)";
    let advice = `You have ${totalHours} total study hours planned across ${daysRemaining} days. That is a solid budget for a ${complexity}/10 complexity project! Follow the daily quizzes to stay ahead.`;

    if (totalHours < complexity * 2.5) {
      status = "Tight Crunch! High Procrastination Risk";
      depth = "Fast-Track Essentials (3 Modules)";
      const neededDaily = Math.round((complexity * 3 / daysRemaining) * 10) / 10;
      advice = `With ${totalHours} total hours for a complexity ${complexity}/10 project, there is high crunch risk. We recommend either bumping daily time to ~${neededDaily}h/day, or taking our action-trimmed fast-track!`;
    } else if (totalHours > 40) {
      status = "Plenty of Time for Deep Mastery";
      depth = "Comprehensive Deep-Dive (5 Modules)";
      advice = `Awesome! With ${totalHours} total hours before your deadline, you have plenty of room to master architecture, testing, and bonus challenges.`;
    }

    // Update DOM
    const simDays = document.getElementById('sim-days-remaining');
    const simHours = document.getElementById('sim-total-hours');
    const simComplexity = document.getElementById('sim-complexity');
    const simDepth = document.getElementById('sim-course-depth');
    const simAdvice = document.getElementById('sim-advice-text');
    const simStatusBadge = document.getElementById('sim-status-badge');

    if (simDays) simDays.textContent = `${daysRemaining} Days`;
    if (simHours) simHours.textContent = `${totalHours} hrs`;
    if (simComplexity) simComplexity.textContent = `${complexity}/10`;
    if (simDepth) simDepth.textContent = depth;
    if (simAdvice) simAdvice.textContent = advice;
    if (simStatusBadge) {
      simStatusBadge.textContent = status;
      simStatusBadge.className = totalHours < complexity * 2.5 ? 'badge badge-amber' : 'badge badge-emerald';
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    const user = Auth.getUser();
    if (!user) {
      App.showToast('Please sign in first.', 'error');
      window.location.hash = '#login';
      return;
    }

    const title = document.getElementById('project-title').value.trim();
    const desc = document.getElementById('project-desc').value.trim();
    const hours = parseFloat(document.getElementById('project-time-slider').value);
    const deadline = document.getElementById('project-deadline').value;
    const goal = document.getElementById('project-goal').value.trim();

    if (!title || !desc || !goal || !deadline) {
      App.showToast('Please fill out all project fields.', 'error');
      return;
    }

    const submitBtn = document.getElementById('submit-project-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
      <span>Analyzing with ML & Generating Course...</span>
    `;

    try {
      const payload = {
        user_id: user.id,
        project_name: title,
        description: desc,
        daily_time_hours: hours,
        deadline: deadline,
        end_goal: goal,
        prior_level: this.selectedLevel
      };

      const res = await API.createProject(payload);
      App.showToast(`🎉 "${title}" created with personalized curriculum!`, 'success');
      App.triggerConfetti();

      // Refresh flashboard
      Flashboard.refresh();

      // Open new project in modules view
      if (res && res.project_id) {
        window.location.hash = '#modules';
        setTimeout(() => {
          Modules.openProject(res.project_id);
        }, 150);
      } else {
        window.location.hash = '#dashboard';
      }
    } catch (err) {
      App.showToast(`Failed to create project: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
};

window.AddProject = AddProject;
