from sqlalchemy import create_engine, Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

# 1. Name our SQLite filing cabinet file
DATABASE_URL = "sqlite:///./currykrust.db"

# 2. Connect Python to the filing cabinet
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# DRAWER 1: Users (For Sign Up, Log In, Profile Page, Settings & Light/Dark Toggle)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    bio = Column(String, default="Tech Newbie crushing procrastination!")
    theme = Column(String, default="light")  # Default is "light", toggles to "dark"

# DRAWER 2: Projects (For Plus Icon, Bottom Search Bar, Dashboard & Module Page)
class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # The 6 exact inputs from your requirements:
    project_name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    daily_time_hours = Column(Float, nullable=False)
    deadline = Column(String, nullable=False)       # e.g., "2026-11-05"
    end_goal = Column(Text, nullable=False)
    prior_level = Column(String, nullable=False)    # Beginner, Intermediate, Advanced
    
    # Boxes that hold ML Reality Check + AI Modules, Quizzes, Citations & Flashcards
    ml_reality_check_json = Column(Text, default="{}")
    course_json = Column(Text, default="{}")
    
    # Progress tracker for modules
    completed_modules = Column(Integer, default=0)
    total_modules = Column(Integer, default=4)
    created_at = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))

# DRAWER 3: Daily Progress (For Everyday Time Spent on Application)
class DailyProgress(Base):
    __tablename__ = "daily_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d"))
    minutes_spent = Column(Float, default=0.0)

# 3. Build all 3 drawers automatically!
Base.metadata.create_all(bind=engine)