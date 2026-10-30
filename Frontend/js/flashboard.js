/**
 * CurryKrust - Flashboard Hover & Interactive Deck
 * Connects to /api/users/{user_id}/flashcards
 */

const Flashboard = {
  cards: [],
  currentIndex: 0,
  isFlipped: false,

  async init() {
    this.setupListeners();
    await this.refresh();
  },

  setupListeners() {
    const cardScene = document.getElementById('flashboard-card-scene');
    if (cardScene) {
      cardScene.addEventListener('click', () => this.toggleFlip());
    }

    const prevBtn = document.getElementById('fb-prev-btn');
    const nextBtn = document.getElementById('fb-next-btn');
    const flipBtn = document.getElementById('fb-flip-btn');
    const pinBtn = document.getElementById('fb-pin-btn');

    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prevCard(); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.nextCard(); });
    if (flipBtn) flipBtn.addEventListener('click', (e) => { e.stopPropagation(); this.toggleFlip(); });
    if (pinBtn) {
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('flashboard-dropdown');
        if (dropdown) dropdown.classList.toggle('pinned');
      });
    }
  },

  async refresh() {
    const user = Auth.getUser();
    if (!user) return;

    try {
      const data = await API.getFlashcards(user.id);
      this.cards = data.flashcards || [];
      const badge = document.getElementById('flashboard-badge');
      if (badge) {
        badge.textContent = this.cards.length;
      }
      this.render();
    } catch (err) {
      // Fallback sample cards if server is starting
      if (!this.cards || this.cards.length === 0) {
        this.cards = [
          {
            project_name: "FastAPI REST API",
            front: "Why use Pydantic models for request bodies?",
            back: "They automatically parse, validate, and convert JSON inputs into typed Python objects with clear error messages."
          },
          {
            project_name: "FastAPI REST API",
            front: "What does SQLite connect_args={'check_same_thread': False} do?",
            back: "Allows multiple FastAPI async worker threads to safely share the same SQLite database connection pool."
          },
          {
            project_name: "CurryKrust Mastery",
            front: "What is CurryKrust's Anti-Procrastination Rule?",
            back: "Complete the 10-minute Immediate Practice right after reading Theory to cement memory before distraction strikes."
          }
        ];
        const badge = document.getElementById('flashboard-badge');
        if (badge) badge.textContent = this.cards.length;
        this.render();
      }
    }
  },

  toggleFlip() {
    const inner = document.getElementById('flashcard-inner');
    if (!inner) return;
    this.isFlipped = !this.isFlipped;
    inner.classList.toggle('flipped', this.isFlipped);
  },

  nextCard() {
    if (this.cards.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.cards.length;
    this.resetFlip();
    this.render();
  },

  prevCard() {
    if (this.cards.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
    this.resetFlip();
    this.render();
  },

  resetFlip() {
    this.isFlipped = false;
    const inner = document.getElementById('flashcard-inner');
    if (inner) inner.classList.remove('flipped');
  },

  render() {
    if (this.cards.length === 0) {
      const frontText = document.getElementById('flashcard-front-text');
      if (frontText) frontText.textContent = "No flashcards yet. Add a project to unlock curriculum flashcards!";
      return;
    }

    const card = this.cards[this.currentIndex];
    const projectTag = document.getElementById('flashcard-project-tag');
    const frontText = document.getElementById('flashcard-front-text');
    const backText = document.getElementById('flashcard-back-text');
    const counter = document.getElementById('flashboard-counter');

    if (projectTag) projectTag.textContent = card.project_name || 'Active Course';
    if (frontText) frontText.textContent = card.front;
    if (backText) backText.textContent = card.back;
    if (counter) counter.textContent = `Card ${this.currentIndex + 1} of ${this.cards.length}`;
  }
};

window.Flashboard = Flashboard;
