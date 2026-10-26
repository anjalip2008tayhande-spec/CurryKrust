from pydantic import BaseModel
from typing import Optional

# Clipboard 1: Checking Sign Up form
class SignUpRequest(BaseModel):
    username: str
    email: str
    password: str

# Clipboard 2: Checking Log In form
class LoginRequest(BaseModel):
    username: str
    password: str

# Clipboard 3: Checking Settings & Top-Right Light/Dark Mode Toggle
class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    theme: Optional[str] = None  # "light" or "dark"

# Clipboard 4: Checking Add Project ("Plus Icon" & Bottom Search Bar)
class ProjectCreateRequest(BaseModel):
    user_id: int
    project_name: str
    description: str
    daily_time_hours: float
    deadline: str
    end_goal: str
    prior_level: str

# Clipboard 5: Checking when a user finishes a Module
class ModuleCompleteRequest(BaseModel):
    module_number: int

# Clipboard 6: Checking Daily Time Spent on App (Progress Page)
class TimeLogRequest(BaseModel):
    user_id: int
    minutes_spent: float