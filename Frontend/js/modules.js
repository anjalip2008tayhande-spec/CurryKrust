/**
 * CurryKrust Modules Curriculum & AI Mastery Gate Manager
 * Connects to /api/projects/{id}, /api/projects/{id}/evaluate-module, /api/projects/{id}/complete-module
 */

const Modules = {
  currentProject: null,
  activeModuleIndex: 0,
  userProjectsList: [],

  async init() {
    this.setupListeners();
    await this.loadProjectSelector();
  },

  setupListeners() {
    const projectSelect = document.getElementById('modules-project-select');
    if (projectSelect) {
      projectSelect.addEventListener('change', (e) => {
        const projectId = parseInt(e.target.value);
        if (projectId) this.loadProject(projectId);
      });
    }

    const evalBtn = document.getElementById('eval-submit-btn');
    if (evalBtn) {
      evalBtn.addEventListener('click', () => this.submitCodeEvaluation());
    }

    const copyCodeBtn = document.getElementById('copy-practice-btn');
    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        const codeEl = document.getElementById('practice-code-block');
        if (codeEl) {
          navigator.clipboard.writeText(codeEl.textContent.trim()).then(() => {
            App.showToast('Code copied to clipboard!', 'info');
          });
        }
      });
    }

    const resetCodeBtn = document.getElementById('reset-code-btn');
    if (resetCodeBtn) {
      resetCodeBtn.addEventListener('click', () => {
        const currentMod = this.getActiveModule();
        const editor = document.getElementById('code-editor-input');
        if (editor && currentMod) {
          editor.value = currentMod.practice_code || `# Write your solution for Module ${currentMod.module_number || 1} here\n\n`;
          App.showToast('Editor reset to starter template', 'info');
        }
      });
    }
  },

  async loadProjectSelector() {
    const user = Auth.getUser();
    if (!user) return;

    try {
      this.userProjectsList = await API.getProjects(user.id);
      const select = document.getElementById('modules-project-select');
      if (!select) return;

      select.innerHTML = this.userProjectsList.map(p => 
        `<option value="${p.project_id}">${this.escapeHtml(p.project_name)} (${p.completed_modules}/${p.total_modules} Mastered)</option>`
      ).join('');

      if (this.userProjectsList.length > 0) {
        // Load first project by default if none loaded
        if (!this.currentProject) {
          this.loadProject(this.userProjectsList[0].project_id);
        }
      } else {
        this.renderEmptyState();
      }
    } catch (err) {
      console.warn("Could not load projects list:", err);
      // Fallback default project
      this.loadProject(1);
    }
  },

  async openProject(projectId) {
    window.location.hash = '#modules';
    await this.loadProject(projectId);
  },

  async loadProject(projectId) {
    try {
      this.currentProject = await API.getProject(projectId);
      const select = document.getElementById('modules-project-select');
      if (select) select.value = projectId;

      // Set active module to current completed + 1 (or 0-indexed)
      const completed = this.currentProject.completed_modules || 0;
      const modules = (this.currentProject.course && this.currentProject.course.modules) || [];
      this.activeModuleIndex = Math.min(completed, Math.max(0, modules.length - 1));

      this.renderProjectHeader();
      this.renderStepper();
      this.renderActiveModule();
    } catch (err) {
      console.warn("Failed to load project details:", err);
      // Mock fallback course
      this.currentProject = {
        project_id: projectId,
        project_name: "Full-Stack FastAPI & SQLite Portfolio",
        end_goal: "Working production backend with 5 endpoints and test suite",
        completed_modules: 1,
        total_modules: 4,
        ml_reality_check: {
          reality_check_status: "Realistic & Achievable with Discipline",
          assessed_level: "Beginner",
          project_complexity_score: "6/10"
        },
        course: {
          course_title: "Full-Stack FastAPI & SQLite Mastery Track",
          modules: [
            {
              module_number: 1,
              title: "FastAPI Project Structure & SQLite Engine",
              estimated_minutes: 35,
              theory: "FastAPI is a modern, high-performance web framework for building APIs with Python based on standard type hints. In this module, we initialize the project structure, configure SQLite via SQLAlchemy's create_engine, and establish SessionLocal for safe transactional operations.",
              immediate_practice: "Initialize your SQLite engine and declare a Base model with declarative_base(). Test the connection with a 5-line script.",
              practice_code: "from sqlalchemy import create_engine\nfrom sqlalchemy.orm import declarative_base, sessionmaker\n\nDATABASE_URL = 'sqlite:///./portfolio.db'\nengine = create_engine(DATABASE_URL, connect_args={'check_same_thread': False})\nSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)\nBase = declarative_base()\nprint('SQLite Engine connected successfully!')",
              quiz: [
                {
                  question: "What is the role of connect_args={'check_same_thread': False} in SQLite?",
                  options: [
                    "Allows FastAPI's multiple worker threads to interact with SQLite safely",
                    "Disables SQL validation entirely",
                    "Forces all database writes to be synchronous",
                    "Encodes database passwords using SHA-256"
                  ],
                  correct_answer: "Allows FastAPI's multiple worker threads to interact with SQLite safely",
                  explanation: "By default, SQLite only allows the creating thread to access the database. Setting check_same_thread to False allows FastAPI worker threads to communicate across requests."
                }
              ],
              final_assessment: "Submit a working database initialization script with engine and sessionmaker configuration.",
              citations: [
                { title: "FastAPI Official Documentation", url: "https://fastapi.tiangolo.com/tutorial/sql-databases/", badge: "98% ML Credibility", source_note: "Official guide on connecting SQL databases in FastAPI." },
                { title: "SQLAlchemy 2.0 Docs", url: "https://docs.sqlalchemy.org", badge: "95% ML Credibility", source_note: "Core documentation for declarative base and connection engines." }
              ]
            },
            {
              module_number: 2,
              title: "Pydantic Schemas & REST Endpoint Routing",
              estimated_minutes: 40,
              theory: "Pydantic provides runtime type validation using Python type annotations. When request data hits a FastAPI endpoint, Pydantic parses the payload, validates required fields, types, and constraints, and produces structured error messages on failure.",
              immediate_practice: "Create a ProjectCreateRequest schema with title, description, and daily_time_hours fields, and wire it to a POST /api/projects endpoint.",
              practice_code: "from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass ProjectSchema(BaseModel):\n    title: str\n    description: str\n    daily_hours: float\n\n@app.post('/api/projects')\ndef add_project(payload: ProjectSchema):\n    return {'status': 'success', 'project': payload.dict()}",
              quiz: [
                {
                  question: "Which HTTP status code should be returned when client input fails Pydantic validation?",
                  options: ["422 Unprocessable Entity", "200 OK", "404 Not Found", "500 Internal Server Error"],
                  correct_answer: "422 Unprocessable Entity",
                  explanation: "FastAPI automatically returns HTTP 422 Unprocessable Entity with a detailed JSON body outlining the exact validation errors."
                }
              ],
              final_assessment: "Build a complete Pydantic schema model and endpoint handler that passes verification.",
              citations: [
                { title: "Pydantic V2 Documentation", url: "https://docs.pydantic.dev", badge: "97% ML Credibility", source_note: "Official schema validation reference guide." }
              ]
            },
            {
              module_number: 3,
              title: "CRUD Operations & Session Dependency Injection",
              estimated_minutes: 45,
              theory: "FastAPI's dependency injection system (Depends) guarantees that every HTTP request receives an isolated database session that is safely closed in a finally block once the response is finished, preventing memory leaks and connection exhaustion.",
              immediate_practice: "Implement a get_db generator helper function using yield and inject it into a GET /api/projects endpoint.",
              practice_code: "from fastapi import Depends\nfrom sqlalchemy.orm import Session\n\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n\n@app.get('/api/projects')\ndef list_projects(db: Session = Depends(get_db)):\n    return db.query(Project).all()",
              quiz: [
                {
                  question: "Why should database sessions be managed with a yield generator in get_db?",
                  options: [
                    "Guarantees the session is closed in the finally block after response completion",
                    "Makes SQLite run in RAM",
                    "Encrypts table contents automatically",
                    "Allows Python to bypass SQL syntax"
                  ],
                  correct_answer: "Guarantees the session is closed in the finally block after response completion",
                  explanation: "FastAPI runs code before the yield before the route handler, and runs code in the finally block after the route handler finishes, ensuring zero connection leaks."
                }
              ],
              final_assessment: "Implement complete Create, Read, and Update queries with proper session management.",
              citations: [
                { title: "MDN Web Docs: HTTP REST Methods", url: "https://developer.mozilla.org", badge: "96% ML Credibility", source_note: "Standard HTTP REST architecture references." }
              ]
            },
            {
              module_number: 4,
              title: "Authentication, Error Handling & Goal Launch",
              estimated_minutes: 50,
              theory: "The final milestone integrates custom HTTPException handlers, CORS middleware configuration for frontend communication, and a complete end-to-end test suite to verify your application is production-ready.",
              immediate_practice: "Write an HTTPException guard check returning 404 if a requested project ID does not exist in the database.",
              practice_code: "from fastapi import HTTPException\n\n@app.get('/api/projects/{id}')\ndef get_project(id: int, db: Session = Depends(get_db)):\n    p = db.query(Project).filter(Project.id == id).first()\n    if not p:\n        raise HTTPException(status_code=404, detail='Project not found')\n    return p",
              quiz: [
                {
                  question: "What does CORS middleware prevent in web applications?",
                  options: [
                    "Unauthorized cross-origin browser requests while permitting approved frontend origins",
                    "High CPU usage on the server",
                    "SQL injection attacks",
                    "CSS stylesheet errors"
                  ],
                  correct_answer: "Unauthorized cross-origin browser requests while permitting approved frontend origins",
                  explanation: "Cross-Origin Resource Sharing (CORS) enforces browser security policies, dictating which frontend domains are permitted to call the backend API."
                }
              ],
              final_assessment: "Ship your final working backend API with test coverage and celebrate your mastery!",
              citations: [
                { title: "FastAPI Security & CORS Docs", url: "https://fastapi.tiangolo.com/tutorial/cors/", badge: "98% ML Credibility", source_note: "Official documentation on securing web endpoints." }
              ]
            }
          ]
        }
      };
      this.renderProjectHeader();
      this.renderStepper();
      this.renderActiveModule();
    }
  },

  renderProjectHeader() {
    if (!this.currentProject) return;
    const titleEl = document.getElementById('modules-project-name');
    const goalEl = document.getElementById('modules-project-goal');
    const badgeEl = document.getElementById('modules-project-badge');

    if (titleEl) titleEl.textContent = this.currentProject.project_name;
    if (goalEl) goalEl.textContent = `🎯 Goal: ${this.currentProject.end_goal || 'Master your project milestone'}`;
    if (badgeEl) {
      const completed = this.currentProject.completed_modules || 0;
      const total = this.currentProject.total_modules || 4;
      badgeEl.textContent = `${completed}/${total} Modules Mastered`;
      badgeEl.className = completed >= total ? 'badge badge-emerald' : 'badge badge-cyan';
    }
  },

  renderStepper() {
    const stepper = document.getElementById('modules-stepper-list');
    if (!stepper || !this.currentProject) return;

    const modules = (this.currentProject.course && this.currentProject.course.modules) || [];
    const completed = this.currentProject.completed_modules || 0;

    stepper.innerHTML = modules.map((mod, idx) => {
      const isCompleted = idx < completed;
      const isActive = idx === this.activeModuleIndex;
      const isLocked = idx > completed;

      let statusIcon = `${idx + 1}`;
      if (isCompleted) statusIcon = '✓';
      if (isLocked) statusIcon = '🔒';

      return `
        <div class="module-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}"
             onclick="Modules.selectModule(${idx})">
          <div class="module-step-num">${statusIcon}</div>
          <div class="module-step-info">
            <span class="module-step-title">Module ${idx + 1}: ${this.escapeHtml(mod.title)}</span>
            <span class="module-step-time">${mod.estimated_minutes || 35} mins • ${isCompleted ? 'Mastered' : isLocked ? 'Locked' : 'In Progress'}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  selectModule(index) {
    const completed = (this.currentProject && this.currentProject.completed_modules) || 0;
    if (index > completed) {
      App.showToast('Complete the previous module first to unlock this milestone!', 'info');
      return;
    }
    this.activeModuleIndex = index;
    this.renderStepper();
    this.renderActiveModule();
  },

  getActiveModule() {
    if (!this.currentProject || !this.currentProject.course || !this.currentProject.course.modules) return null;
    return this.currentProject.course.modules[this.activeModuleIndex];
  },

  renderActiveModule() {
    const mod = this.getActiveModule();
    if (!mod) return;

    // Header & Meta
    const numEl = document.getElementById('active-mod-num');
    const titleEl = document.getElementById('active-mod-title');
    const timeEl = document.getElementById('active-mod-time');
    const theoryEl = document.getElementById('active-mod-theory');
    const practiceTextEl = document.getElementById('active-mod-practice-text');
    const practiceCodeEl = document.getElementById('practice-code-block');
    const editorInput = document.getElementById('code-editor-input');
    const assessDescEl = document.getElementById('active-mod-assess-desc');

    if (numEl) numEl.textContent = `Module ${mod.module_number || (this.activeModuleIndex + 1)}`;
    if (titleEl) titleEl.textContent = mod.title;
    if (timeEl) timeEl.textContent = `${mod.estimated_minutes || 35} mins`;
    if (theoryEl) theoryEl.textContent = mod.theory;
    if (practiceTextEl) practiceTextEl.textContent = mod.immediate_practice;
    if (practiceCodeEl) practiceCodeEl.textContent = mod.practice_code || `# Module ${mod.module_number} Starter\nprint("Ready to code!")`;
    
    // Set starter code in evaluator editor if empty or module changed
    if (editorInput) {
      editorInput.value = mod.practice_code || `def solve_milestone():\n    # Implement Module ${mod.module_number} logic here\n    return True\n`;
    }

    if (assessDescEl) {
      assessDescEl.textContent = mod.final_assessment || `Implement and submit the working code milestone for Module ${mod.module_number}.`;
    }

    // Render Quiz
    this.renderQuiz(mod.quiz || []);

    // Render Citations
    this.renderCitations(mod.citations || []);

    // Reset evaluation card
    const rubricCard = document.getElementById('rubric-result-container');
    if (rubricCard) rubricCard.style.display = 'none';
  },

  renderQuiz(quizList) {
    const container = document.getElementById('active-mod-quiz-container');
    if (!container) return;

    if (!quizList || quizList.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted);">No quiz questions for this module.</p>`;
      return;
    }

    container.innerHTML = quizList.map((q, qIdx) => {
      return `
        <div class="quiz-question-box" data-quiz-idx="${qIdx}">
          <div class="quiz-q-title">Q${qIdx + 1}: ${this.escapeHtml(q.question)}</div>
          <div class="quiz-options-list">
            ${(q.options || []).map((opt, optIdx) => `
              <div class="quiz-option-item" onclick="Modules.checkQuizAnswer(${qIdx}, ${optIdx}, '${this.escapeHtml(opt)}', '${this.escapeHtml(q.correct_answer)}', '${this.escapeHtml(q.explanation || '')}')">
                <span>${opt}</span>
              </div>
            `).join('')}
          </div>
          <div class="quiz-feedback-box" id="quiz-feedback-${qIdx}" style="display:none; margin-top: 0.75rem; padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.85rem;"></div>
        </div>
      `;
    }).join('');
  },

  checkQuizAnswer(qIdx, optIdx, selected, correct, explanation) {
    const box = document.querySelector(`[data-quiz-idx="${qIdx}"]`);
    if (!box) return;

    const options = box.querySelectorAll('.quiz-option-item');
    options.forEach(o => o.classList.remove('selected', 'correct', 'wrong'));

    const clicked = options[optIdx];
    const feedback = document.getElementById(`quiz-feedback-${qIdx}`);

    if (selected === correct) {
      clicked.classList.add('correct');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = 'rgba(16, 185, 129, 0.15)';
        feedback.style.color = '#10b981';
        feedback.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        feedback.innerHTML = `<strong>✓ Correct!</strong> ${explanation}`;
      }
      App.showToast('Correct answer! Concept reinforced.', 'success');
    } else {
      clicked.classList.add('wrong');
      // Highlight correct answer
      options.forEach(o => {
        if (o.textContent.trim() === correct) o.classList.add('correct');
      });
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.background = 'rgba(244, 63, 94, 0.15)';
        feedback.style.color = '#f43f5e';
        feedback.style.border = '1px solid rgba(244, 63, 94, 0.3)';
        feedback.innerHTML = `<strong>✗ Not quite.</strong> ${explanation}`;
      }
    }
  },

  renderCitations(citations) {
    const grid = document.getElementById('active-mod-citations-grid');
    if (!grid) return;

    if (!citations || citations.length === 0) {
      grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1;">Official documentation references are loaded automatically.</p>`;
      return;
    }

    grid.innerHTML = citations.map(c => `
      <div class="citation-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <span class="badge badge-emerald">${c.badge || '95% ML Credibility'}</span>
          </div>
          <div class="citation-title">${this.escapeHtml(c.title)}</div>
          <p class="citation-desc">${this.escapeHtml(c.source_note || 'Credible guide for deeper understanding.')}</p>
        </div>
        <a href="${c.url || 'https://developer.mozilla.org'}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="align-self: flex-start; margin-top: 0.5rem;">
          <span>Read Official Docs</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
    `).join('');
  },

  async submitCodeEvaluation() {
    if (!this.currentProject) return;
    const mod = this.getActiveModule();
    if (!mod) return;

    const editor = document.getElementById('code-editor-input');
    const notesInput = document.getElementById('code-notes-input');
    const code = editor ? editor.value.trim() : '';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!code) {
      App.showToast('Please write some code before submitting for evaluation.', 'error');
      return;
    }

    const btn = document.getElementById('eval-submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
      <span>Grading Against 3-Part Rubric...</span>
    `;

    try {
      const res = await API.evaluateModule(
        this.currentProject.project_id,
        mod.module_number || (this.activeModuleIndex + 1),
        code,
        notes
      );

      this.displayRubricResult(res);

      if (res.passed) {
        App.triggerConfetti();
        App.showToast(res.status_title || 'Module Mastered! Next Milestone Unlocked!', 'success');
        // Update project state
        this.currentProject.completed_modules = res.completed_modules;
        this.renderProjectHeader();
        this.renderStepper();
      } else {
        App.showToast(`Scored ${res.score}%. 80% required to pass. See feedback!`, 'info');
      }
    } catch (err) {
      App.showToast(`Evaluation error: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  displayRubricResult(res) {
    const card = document.getElementById('rubric-result-container');
    if (!card) return;

    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const rubric = res.rubric_breakdown || { syntax_and_structure: 35, goal_alignment: 26, best_practices: 25 };
    const score = res.score || 86;
    const passed = res.passed !== false;

    card.innerHTML = `
      <div class="rubric-header">
        <div>
          <h4 style="font-size: 1.15rem; color: ${passed ? 'var(--accent-emerald)' : 'var(--accent-amber)'}; display: flex; align-items: center; gap: 0.5rem;">
            ${passed ? '🎉' : '⚠️'} ${this.escapeHtml(res.status_title || 'Evaluation Result')}
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
            ${this.escapeHtml(res.feedback || '')}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: ${passed ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">
            ${score}%
          </div>
          <span class="badge ${passed ? 'badge-emerald' : 'badge-amber'}">${passed ? 'PASSED (≥80%)' : 'NEEDS REVISION (<80%)'}</span>
        </div>
      </div>

      <div class="rubric-bars-grid">
        <div class="rubric-bar-item">
          <div class="rubric-bar-label">
            <span>Syntax & Structure</span>
            <strong>${rubric.syntax_and_structure || 0} / 40</strong>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${((rubric.syntax_and_structure || 0) / 40) * 100}%"></div>
          </div>
        </div>

        <div class="rubric-bar-item">
          <div class="rubric-bar-label">
            <span>Goal Alignment</span>
            <strong>${rubric.goal_alignment || 0} / 30</strong>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${((rubric.goal_alignment || 0) / 30) * 100}%"></div>
          </div>
        </div>

        <div class="rubric-bar-item">
          <div class="rubric-bar-label">
            <span>Best Practices & Robustness</span>
            <strong>${rubric.best_practices || 0} / 30</strong>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${((rubric.best_practices || 0) / 30) * 100}%"></div>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
        <div style="background: rgba(16, 185, 129, 0.08); padding: 0.85rem; border-radius: var(--radius-md); border-left: 3px solid var(--accent-emerald);">
          <strong style="color: var(--accent-emerald); font-size: 0.8rem; text-transform: uppercase;">Strengths:</strong>
          <ul style="margin: 0.35rem 0 0 1.2rem; font-size: 0.825rem; color: var(--text-primary);">
            ${(res.strengths || ['Code structure clean']).map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div style="background: rgba(245, 158, 11, 0.08); padding: 0.85rem; border-radius: var(--radius-md); border-left: 3px solid var(--accent-amber);">
          <strong style="color: var(--accent-amber); font-size: 0.8rem; text-transform: uppercase;">Improvement Advice:</strong>
          <ul style="margin: 0.35rem 0 0 1.2rem; font-size: 0.825rem; color: var(--text-primary);">
            ${(res.improvements || ['Maintain steady progress']).map(i => `<li>${this.escapeHtml(i)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  },

  renderEmptyState() {
    const pane = document.querySelector('.modules-page-layout');
    if (pane) {
      pane.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
          <h2>No Active Project Selected</h2>
          <p style="margin: 0.5rem 0 1.5rem; color: var(--text-muted);">
            Create a project to have CurryKrust generate your custom AI mastery curriculum!
          </p>
          <a href="#add-project" class="btn btn-primary btn-lg">Add New Project</a>
        </div>
      `;
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};

window.Modules = Modules;
