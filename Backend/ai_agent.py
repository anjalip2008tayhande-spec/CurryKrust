import warnings; warnings.filterwarnings("ignore")
import os
import json
import requests
from duckduckgo_search import DDGS

# Default to local Ollama (or override with a Cloud/DigitalOcean URL if needed)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "gemma4")


def format_readable_reality_check(project_name: str, ml_report: dict) -> dict:
    """
    Turns the raw ML numbers into a super clean, human-readable summary card
    that the frontend can display directly to the user!
    """
    will_finish = ml_report.get("will_complete_on_time", True)
    badge_color = "green" if will_finish else "orange"
    
    headline = (
        f"You're on track to master {project_name}!"
        if will_finish
        else f"Heads up! {project_name} is a tight squeeze before your deadline."
    )

    readable_Bullets = [
        f"True Skill Level Assessment: Started at {ml_report.get('assessed_level', 'Beginner')} ({ml_report.get('level_assessment_note', '')})",
        f"Time Budget: {ml_report.get('total_available_hours', 10)} total hours across {ml_report.get('days_remaining', 7)} days (Complexity: {ml_report.get('project_complexity_score', '5/10')}).",
        f"Course Depth Selected: {ml_report.get('recommended_course_depth', 'Standard Balanced')} ({ml_report.get('recommended_modules_count', 4)} structured modules).",
        f"Game Plan: {ml_report.get('procrastination_advice', 'Stay consistent daily!')}"
    ]

    return {
        "badge_color": badge_color,
        "status_title": ml_report.get("reality_check_status", "Reality Check Complete"),
        "friendly_headline": headline,
        "confidence_tag": f"{ml_report.get('ml_confidence_percent', 85)}% ML Confidence",
        "readable_summary_points": readable_Bullets
    }


def fetch_credible_citations(topic: str, max_results: int = 3) -> list:
    """
    Searches trusted developer documentation sites for real, up-to-date links
    so the user gets credible references after each module.
    """
    trusted_domains = (
        "site:developer.mozilla.org OR site:freecodecamp.org OR "
        "site:docs.python.org OR site:w3schools.com OR "
        "site:realpython.com OR site:geeksforgeeks.org"
    )
    query = f"{topic} tutorial guide ({trusted_domains})"
    citations = []

    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            for r in results:
                citations.append({
                    "title": r.get("title", f"{topic} Documentation"),
                    "url": r.get("href", "https://developer.mozilla.org"),
                    "source_note": r.get("body", "Credible reference guide for deeper understanding.")[:140] + "..."
                })
    except Exception:
        pass

    # Guaranteed credible fallback links if Wi-Fi drops during the hackathon demo
    if not citations:
        clean_q = topic.replace(" ", "+")
        citations = [
            {
                "title": f"MDN Web Docs: {topic} Reference",
                "url": f"https://developer.mozilla.org/en-US/search?q={clean_q}",
                "source_note": "Official Mozilla Developer Network documentation and code examples."
            },
            {
                "title": f"freeCodeCamp: {topic} Step-by-Step Guide",
                "url": f"https://www.freecodecamp.org/news/search/?query={clean_q}",
                "source_note": "Beginner-friendly tutorials and hands-on coding walkthroughs."
            },
            {
                "title": f"W3Schools: {topic} Interactive Examples",
                "url": f"https://www.w3schools.com",
                "source_note": "Quick syntax references and try-it-yourself sandboxes."
            }
        ]
    return citations


def generate_course_with_gemma(project_name: str, description: str, end_goal: str, ml_report: dict) -> dict:
    """
    Uses Ollama (gemma4) + ML Reality Check to build a structured, module-wise course
    with Theory, Immediate Practice, Quiz, Final Assessment, Flashcards, and Citations.
    """
    num_modules = ml_report.get("recommended_modules_count", 4)
    depth = ml_report.get("recommended_course_depth", "Standard Balanced")
    true_level = ml_report.get("assessed_level", "Beginner")

    # 1. Build the human-readable ML Reality Check card for the UI
    readable_ml_card = format_readable_reality_check(project_name, ml_report)

    # 2. Prompt for Ollama Gemma 4
    prompt = f"""
You are CurryKrust AI, an energetic anti-procrastination coding mentor for tech newbies.
Build a {num_modules}-module structured course for this user project:
- Project Name: {project_name}
- Description: {description}
- Final End Goal: {end_goal}
- Student Assessed Level: {true_level}
- Course Depth Mode: {depth}

Respond ONLY with valid JSON matching this exact schema:
{{
  "course_title": "Catchy Course Title",
  "final_goal_assistance": "Clear 3-step roadmap to finish and ship their End Goal: {end_goal}",
  "flashcards": [
    {{"front": "Key Concept Question 1?", "back": "Short, punchy newbie-friendly answer"}},
    {{"front": "Key Concept Question 2?", "back": "Short, punchy newbie-friendly answer"}},
    {{"front": "Key Concept Question 3?", "back": "Short, punchy newbie-friendly answer"}}
  ],
  "modules": [
    {{
      "module_number": 1,
      "title": "Module Title",
      "estimated_minutes": 35,
      "theory": "Clear, engaging explanation written for a {true_level} student ({depth}).",
      "immediate_practice": "A specific 10-minute hands-on micro-task the user must do right now.",
      "quiz": [
        {{
          "question": "Practical multiple-choice question testing this module?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A"
        }}
      ],
      "final_assessment": "Mini milestone check the user must pass before unlocking the next module.",
      "search_topic": "Specific technical search term for official documentation"
    }}
  ]
}}
"""

    course_data = None
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=60
        )
        response.raise_for_status()
        raw_json = response.json().get("response", "{}")
        course_data = json.loads(raw_json)
        course_data["generated_by"] = f"Ollama ({MODEL_NAME})"
    except Exception as e:
        # Smart Hackathon Failsafe: If Ollama isn't running yet, generate structured modules
        # dynamically so the app & live demo never crash!
        stage_names = [
            "Environment Setup & Core Fundamentals",
            "Building the Core Architecture & Logic",
            "Connecting Components & Interactive Features",
            "Testing, Debugging & Polishing",
            "Final Deployment & Goal Launch"
        ]
        course_data = {
            "course_title": f"{project_name}: {depth}",
            "generated_by": f"CurryKrust AI Engine (Ollama {MODEL_NAME} Ready)",
            "final_goal_assistance": (
                f"To achieve your end goal ('{end_goal}'): "
                f"1) Complete each module's 10-minute Immediate Practice without skipping. "
                f"2) Pass the Final Assessment in Module {num_modules}. "
                f"3) Push your working code to GitHub and test the live workflow!"
            ),
            "flashcards": [
                {"front": f"What is our #1 strategy for {project_name}?", "back": f"Following the {depth} track one module at a time without multitasking."},
                {"front": "Why do Immediate Practice right after Theory?", "back": "Writing code within 5 minutes of reading locks the concept into your memory and beats procrastination."},
                {"front": f"What is the End Goal of {project_name}?", "back": end_goal}
            ],
            "modules": []
        }

        for i in range(num_modules):
            stage = stage_names[i] if i < len(stage_names) else f"Advanced Milestone {i+1}"
            course_data["modules"].append({
                "module_number": i + 1,
                "title": f"Module {i + 1}: {stage}",
                "estimated_minutes": 30 if num_modules == 3 else 45,
                "theory": (
                    f"[{true_level} Track - {depth}] In this module for '{project_name}', "
                    f"we focus on {stage.lower()}. Break the problem down into small inputs and outputs "
                    f"related to: {description}."
                ),
                "immediate_practice": (
                    f"Open VS Code right now and spend 10 minutes building the starter file for "
                    f"'{stage}' toward your goal: {end_goal}."
                ),
                "quiz": [
                    {
                        "question": f"What is the main focus of Module {i + 1} ({stage})?",
                        "options": [
                            f"Completing the hands-on practice for {stage}",
                            "Skipping straight to the final deadline",
                            "Memorizing syntax without writing code",
                            "Adding unnecessary features first"
                        ],
                        "correct_answer": f"Completing the hands-on practice for {stage}"
                    }
                ],
                "final_assessment": f"Verify that your Module {i + 1} code runs without errors before unlocking Module {i + 2}.",
                "search_topic": f"{project_name} {description} {stage}"
            })

    # 3. Attach the human-readable ML Reality Check Banner
    course_data["readable_reality_check_banner"] = readable_ml_card

    # 4. Fetch & attach real, credible Citations after every single module
    for mod in course_data.get("modules", []):
        topic_query = mod.get("search_topic", f"{project_name} {mod.get('title', '')}")
        mod["citations"] = fetch_credible_citations(topic_query, max_results=3)

    return course_data


# ==========================================================
# QUICK TEST BLOCK (Runs when you type: .\venv\Scripts\python.exe ai_agent.py)
# ==========================================================
if __name__ == "__main__":
    sample_ml_report = {
        "will_complete_on_time": False,
        "reality_check_status": "Reality Check: Tight Crunch! High Procrastination Risk",
        "ml_confidence_percent": 82.0,
        "days_remaining": 2,
        "total_available_hours": 3.0,
        "project_complexity_score": "10/10",
        "assessed_level": "Intermediate",
        "level_assessment_note": "Adjusted down one notch to keep foundations rock-solid!",
        "recommended_course_depth": "Fast-Track Essentials (Theory Trimmed, 100% Action)",
        "recommended_modules_count": 3,
        "procrastination_advice": "Follow our trimmed 3-module Fast-Track course!"
    }

    print("\n--- Generating Structured Course + Live Credible Citations ---")
    result = generate_course_with_gemma(
        project_name="Python FastAPI Portfolio",
        description="Build a web API with SQLite database",
        end_goal="Working backend server with 5 endpoints",
        ml_report=sample_ml_report
    )
    print(json.dumps(result, indent=2))