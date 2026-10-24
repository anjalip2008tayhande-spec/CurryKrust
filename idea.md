---
marp: true
theme: gaia
class: lead
backgroundColor: #0f172a
color: #f8fafc
---

# **CurryKrust** 🥧

## **Curriculum + Trust: The Mastery-Gated AI Project Accelerator**

<italic>Turning Project Ideas into Verified, Time-Boxed, Completable Modules</italic>

**Tech Stack:** HTML5 / CSS3 / Vanilla JS • FastAPI • Tavily API • Scikit-Learn ML • Gemini 2.5

---

## 1. The Problem: Why Self-Learners Fail Deadlines

* **Search Engine Overload:** Searching "How to build X" dumps 10,000 unverified blog posts with no structure or time management.
* **AI Hallucination & Passive Reading:** Standard LLMs generate walls of unverified text without checking if the learner actually understood it.
* **Zero Accountability:** Existing roadmaps let users skip ahead without writing a single line of practice code.

---

## 2. The Solution: What is CurryKrust?

You input **5 parameters**:

1. **Project Name & Brief Description**
2. **Available Hours / Day** & **Hard Deadline**
3. **Current Level of Understanding** *(Beginner / Intermediate / Advanced)*

**CurryKrust outputs a locked sequence of completable modules:**
`Verified Theory` $\rightarrow$ `Immediate Practice` $\rightarrow$ `5-Q Quiz` $\rightarrow$ `Mini-Project` $\rightarrow$ `Final AI Evaluation (80% to Unlock Next Module)`

---

## 3. How We Combined APIs + ML + AI

| Pillar | Implementation | Why It Matters |
| :--- | :--- | :--- |
| **APIs** | **Tavily Search + YouTube API** | Pulls real documentation (MDN, Python Docs, MIT, IEEE) — zero hallucinated URLs. |
| **ML** | **TF-IDF + Cosine Similarity** | Ranks scraped resources against your exact project description & adapts pacing. |
| **GenAI** | **Gemini 2.5 Structured JSON** | Generates micro-practice, quizzes, and grades your mini-project code against a rubric. |
| **Frontend** | **Custom HTML5, CSS3 & JS** | Fast, framework-free UI with locked module states (`localStorage` + REST API). |

---

## 4. System Workflow (End-to-End Architecture)

1. **Input & Time Budgeting (JS $\rightarrow$ FastAPI):** Calculates `Total Study Hours = Days × Hours/Day`.
2. **Credible Material Scraping (API Layer):** Pulls candidate articles & videos from high-authority domains.
3. **Semantic Relevance Filtering (ML Layer):** Scikit-Learn computes similarity matrix; top 3 links per module get a **90%+ Credibility Badge**.
4. **Mastery Gatekeeper (GenAI + JS DOM):** Next module remains `🔒 LOCKED` in the DOM until Quiz + Project evaluation scores **$\ge$ 80%**.

---

## 5. Inside a Single CurryKrust Module

* **Step 1: Curated Theory** — Real documentation links with ML Relevance Badges + concise synthesis.
* **Step 2: Immediate Practice** — A 5-minute hands-on micro-task right inside the browser.
* **Step 3: Concept Check Quiz** — 5 interactive JS multiple-choice questions with instant explanations.
* **Step 4: Final Module Assessment** — User builds a real component of their project; AI evaluates code quality & unlocks Module $N+1$.

---

## 6. Competitive Advantage

| Feature | Course Generators *(Coursebox)* | Coding Platforms *(Hyperskill)* | AI Search *(Perplexity)* | **CurryKrust** |
| :--- | :---: | :---: | :---: | :---: |
| **Custom Project + Deadline Input** | ❌ | ❌ | ✅ | **✅** |
| **ML-Verified External Sources** | ❌ | ❌ | ✅ | **✅** |
| **Immediate Practice + Quiz** | ✅ | ✅ | ❌ | **✅** |
| **Mastery-Locked Progression** | ❌ | ✅ | ❌ | **✅** |

---

## 7. Live Demo & Future Scope

* **Live Demo Flow:** Input Project $\rightarrow$ Inspect ML Credibility Scores $\rightarrow$ Pass Module 1 Assessment $\rightarrow$ Watch Module 2 Unlock Live!
* **Next Steps:**
  * GitHub Repo Webhook integration for automated commit grading.
  * Spaced-repetition flashcards auto-generated from missed quiz questions.
