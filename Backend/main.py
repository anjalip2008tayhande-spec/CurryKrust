import json
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import SessionLocal, User, Project, DailyProgress
from schemas import (
    SignUpRequest, LoginRequest, ProfileUpdateRequest,
    ProjectCreateRequest, ModuleCompleteRequest, TimeLogRequest
)

# Smart Plug-and-Play: Works standalone right now on Backend-feature branch,
# and automatically connects when you merge ML-feature and API-feature later!
try:
    from ml_engine import ml_engine
except ImportError:
    ml_engine = None

try:
    from ai_agent import generate_course_with_gemma
except ImportError:
    generate_course_with_gemma = None

app = FastAPI(
    title="CurryKrust Backend API",
    description="Backend-feature branch: Auth, Dashboard, Modules, Flashcards, Progress, Profile & Settings"
)

# CORS Bridge: Allows your teammate's frontend HTML/JS to talk to your backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper that opens and closes the filing cabinet safely for every request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 1. OPENING PAGE & AUTH (Sign Up / Log In)
# ==========================================
@app.get("/")
def root():
    return {
        "app": "CurryKrust",
        "purpose": "Beat procrastination with structured, credible module-wise courses.",
        "status": "Backend-feature running cleanly!"
    }

@app.post("/api/auth/signup")
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == req.username) | (User.email == req.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    new_user = User(username=req.username, email=req.email, password=req.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "Account created successfully",
        "user": {"id": new_user.id, "username": new_user.username, "email": new_user.email, "theme": new_user.theme}
    }

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username, User.password == req.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "message": "Login successful",
        "user": {"id": user.id, "username": user.username, "email": user.email, "bio": user.bio, "theme": user.theme}
    }

# ==========================================
# 2. ADD PROJECT ("Plus Icon" & Search Bar)
# ==========================================
@app.post("/api/projects")
def create_project(req: ProjectCreateRequest, db: Session = Depends(get_db)):
    # Uses ML-feature if merged, otherwise uses clean mock response
    if ml_engine:
        ml_report = ml_engine.run_reality_check(
            req.description, req.end_goal, req.daily_time_hours, req.deadline, req.prior_level
        )
    else:
        ml_report = {
            "assessed_level": req.prior_level,
            "reality_check_status": "Achievable with Discipline (Backend Mock)",
            "recommended_course_depth": "Standard Balanced",
            "procrastination_advice": f"Stick to {req.daily_time_hours} hrs/day until {req.deadline}!",
            "recommended_modules_count": 4
        }

    # Uses API-feature if merged, otherwise uses clean mock modules + citations
    if generate_course_with_gemma:
        course_data = generate_course_with_gemma(req.project_name, req.description, req.end_goal, ml_report)
    else:
        course_data = {
            "course_title": f"Course: {req.project_name}",
            "final_goal_assistance": f"Step-by-step guide to finish: {req.end_goal}",
            "flashcards": [
                {"front": f"Core goal of {req.project_name}?", "back": req.end_goal},
                {"front": "Daily commitment required?", "back": f"{req.daily_time_hours} hours per day"}
            ],
            "modules": [
                {
                    "module_number": i,
                    "title": f"Module {i}: {req.project_name} Fundamentals",
                    "theory": f"Placeholder theory for module {i} (Will be populated by API-feature branch).",
                    "immediate_practice": "Write a 10-line starter snippet to test your understanding.",
                    "quiz": [{"question": "Ready to code?", "options": ["Yes", "Definitely"], "correct_answer": "Yes"}],
                    "final_assessment": f"Build part {i} of {req.end_goal}",
                    "citations": [{"title": "MDN Web Docs", "url": "https://developer.mozilla.org"}]
                } for i in range(1, 5)
            ]
        }

    new_project = Project(
        user_id=req.user_id,
        project_name=req.project_name,
        description=req.description,
        daily_time_hours=req.daily_time_hours,
        deadline=req.deadline,
        end_goal=req.end_goal,
        prior_level=req.prior_level,
        ml_reality_check_json=json.dumps(ml_report),
        course_json=json.dumps(course_data),
        completed_modules=0,
        total_modules=len(course_data.get("modules", []))
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return {
        "project_id": new_project.id,
        "project_name": new_project.project_name,
        "ml_reality_check": ml_report,
        "course": course_data
    }

# ==========================================
# 3. DASHBOARD & MODULE PAGE
# ==========================================
@app.get("/api/users/{user_id}/projects")
def get_all_user_projects(user_id: int, search: str = "", db: Session = Depends(get_db)):
    query = db.query(Project).filter(Project.user_id == user_id)
    if search:
        query = query.filter(Project.project_name.ilike(f"%{search}%"))
    
    projects = query.order_by(Project.id.desc()).all()
    return [
        {
            "project_id": p.id,
            "project_name": p.project_name,
            "description": p.description,
            "deadline": p.deadline,
            "daily_time_hours": p.daily_time_hours,
            "completed_modules": p.completed_modules,
            "total_modules": p.total_modules,
            "progress_percent": round((p.completed_modules / max(p.total_modules, 1)) * 100),
            "ml_reality_check": json.loads(p.ml_reality_check_json)
        }
        for p in projects
    ]

@app.get("/api/projects/{project_id}")
def get_single_project_modules(project_id: int, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "project_id": p.id,
        "project_name": p.project_name,
        "end_goal": p.end_goal,
        "completed_modules": p.completed_modules,
        "total_modules": p.total_modules,
        "ml_reality_check": json.loads(p.ml_reality_check_json),
        "course": json.loads(p.course_json)
    }

@app.post("/api/projects/{project_id}/complete-module")
def mark_module_completed(project_id: int, req: ModuleCompleteRequest, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    if req.module_number > p.completed_modules and p.completed_modules < p.total_modules:
        p.completed_modules = req.module_number
        db.commit()
    return {
        "project_id": p.id,
        "completed_modules": p.completed_modules,
        "total_modules": p.total_modules,
        "progress_percent": round((p.completed_modules / max(p.total_modules, 1)) * 100)
    }

# ==========================================
# 4. FLASHCARDS HOVER (Top-Right Icon)
# ==========================================
@app.get("/api/users/{user_id}/flashcards")
def get_user_flashcards(user_id: int, db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    all_cards = []
    for p in projects:
        course = json.loads(p.course_json)
        for card in course.get("flashcards", []):
            all_cards.append({
                "project_id": p.id,
                "project_name": p.project_name,
                "front": card.get("front"),
                "back": card.get("back")
            })
    return {"total_cards": len(all_cards), "flashcards": all_cards}

# ==========================================
# 5. PROGRESS PAGE (Daily Time Spent)
# ==========================================
@app.post("/api/progress/log")
def log_daily_time(req: TimeLogRequest, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    entry = db.query(DailyProgress).filter(
        DailyProgress.user_id == req.user_id,
        DailyProgress.date == today
    ).first()
    
    if entry:
        entry.minutes_spent += req.minutes_spent
    else:
        entry = DailyProgress(user_id=req.user_id, date=today, minutes_spent=req.minutes_spent)
        db.add(entry)
    db.commit()
    return {"date": today, "minutes_spent_today": entry.minutes_spent}

@app.get("/api/progress/{user_id}")
def get_progress_history(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(DailyProgress).filter(DailyProgress.user_id == user_id).order_by(DailyProgress.date.asc()).all()
    total_minutes = sum(l.minutes_spent for l in logs)
    return {
        "total_hours_all_time": round(total_minutes / 60, 2),
        "daily_logs": [{"date": l.date, "minutes_spent": l.minutes_spent} for l in logs]
    }

# ==========================================
# 6. PROFILE, SETTINGS & DARK/LIGHT TOGGLE
# ==========================================
@app.get("/api/users/{user_id}/profile")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    project_count = db.query(Project).filter(Project.user_id == user_id).count()
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "bio": user.bio,
        "theme": user.theme,
        "total_projects": project_count
    }

@app.put("/api/users/{user_id}/settings")
def update_profile_or_theme(user_id: int, req: ProfileUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if req.username is not None: user.username = req.username
    if req.email is not None: user.email = req.email
    if req.bio is not None: user.bio = req.bio
    if req.theme is not None: user.theme = req.theme
    
    db.commit()
    return {"message": "Settings updated", "theme": user.theme, "username": user.username, "bio": user.bio}