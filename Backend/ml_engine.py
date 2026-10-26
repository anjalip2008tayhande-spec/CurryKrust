import numpy as np
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime

class CurryKrustMLEngine:
    def __init__(self):
        # ==========================================================
        # TRAINING DATA FOR OUR RANDOM FOREST CLASSIFIER
        # Columns: [total_available_hours, project_complexity (1-10), true_skill_level (1-3)]
        # Labels (y): 
        #   0 = Unrealistic Deadline -> Needs "Crash Course (Essentials Only)"
        #   1 = Tight / Balanced     -> Needs "Standard Balanced Course"
        #   2 = Plenty of Time       -> Needs "Deep Dive Mastery Course"
        # ==========================================================
        self.X_train = np.array([
            # Label 0: Too little time for hard projects
            [4, 8, 1],   [8, 9, 1],   [6, 6, 1],   [10, 8, 2],  [5, 7, 1],
            # Label 1: Reasonable time for medium/hard projects
            [18, 6, 1],  [20, 7, 2],  [14, 5, 2],  [25, 8, 2],  [12, 4, 1],
            # Label 2: Plenty of hours available
            [45, 6, 2],  [60, 8, 3],  [35, 4, 2],  [50, 7, 1],  [40, 5, 3]
        ])
        self.y_train = np.array([
            0, 0, 0, 0, 0,
            1, 1, 1, 1, 1,
            2, 2, 2, 2, 2
        ])

        # Create 50 Decision Trees that vote together
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.model.fit(self.X_train, self.y_train)

    def estimate_complexity(self, description: str, end_goal: str) -> int:
        """Reads the user's project description & end-goal to score difficulty from 1 to 10."""
        text = f"{description} {end_goal}".lower()
        
        hard_words = ["machine learning", "ai", "neural", "fullstack", "full-stack", "blockchain", "cloud", "microservices", "deploy", "compiler", "3d"]
        medium_words = ["api", "database", "sql", "sqlite", "supabase", "backend", "frontend", "javascript", "python", "react", "dashboard", "auth"]

        score = 3  # Base score for any newbie project
        for word in hard_words:
            if word in text:
                score += 2
        for word in medium_words:
            if word in text:
                score += 1

        # Keep score between 2 and 10
        return min(max(score, 2), 10)

    def assess_true_level(self, claimed_level: str, description: str) -> dict:
        """
        Assesses TRUE understanding of the user before starting the course
        by analyzing their claimed level against the technical depth of their description.
        """
        level_map = {"beginner": 1, "intermediate": 2, "advanced": 3}
        claimed_num = level_map.get(claimed_level.strip().lower(), 1)

        words = description.strip().split()
        word_count = len(words)
        
        tech_terms = ["api", "database", "function", "component", "model", "server", "schema", "endpoint", "frontend", "backend", "algorithm", "state"]
        tech_Hits = sum(1 for t in tech_terms if t in description.lower())

        # Rule 1: Claimed Intermediate/Advanced, but wrote a super vague 1-4 word description
        if claimed_num > 1 and word_count < 6 and tech_Hits == 0:
            true_num = claimed_num - 1
            reason = "Your description was quite brief, so we adjusted the starting depth down one notch to make sure your foundations are rock-solid!"
        # Rule 2: Claimed Beginner, but used multiple specific technical architecture terms
        elif claimed_num == 1 and tech_Hits >= 3 and word_count >= 10:
            true_num = 2
            reason = "You already know key technical concepts based on your description! We bumped your track to Intermediate so you don't get bored."
        else:
            true_num = claimed_num
            reason = "Your project description matches your selected skill level."

        inv_map = {1: "Beginner", 2: "Intermediate", 3: "Advanced"}
        return {
            "claimed_level": claimed_level.capitalize(),
            "assessed_level": inv_map[true_num],
            "assessed_level_num": true_num,
            "level_assessment_note": reason
        }

    def run_reality_check(self, description: str, end_goal: str, daily_hours: float, deadline_str: str, prior_level: str) -> dict:
        """
        Runs the ML model to check if the course can be completed in the given daily time & deadline,
        and adjusts the depth and module count of the course.
        """
        # 1. Calculate how many days until the deadline
        try:
            deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d").date()
            today_date = datetime.now().date()
            days_left = max((deadline_date - today_date).days, 1)
        except ValueError:
            days_left = 7  # Fallback if date isn't formatted as YYYY-MM-DD

        total_hours = round(days_left * daily_hours, 1)

        # 2. Get Complexity & True Understanding Level
        complexity = self.estimate_complexity(description, end_goal)
        level_data = self.assess_true_level(prior_level, description)
        true_level_num = level_data["assessed_level_num"]

        # 3. Ask the Random Forest ML Model for a prediction
        features = np.array([[total_hours, complexity, true_level_num]])
        prediction = int(self.model.predict(features)[0])
        confidence = round(float(max(self.model.predict_proba(features)[0])) * 100, 1)

        # 4. Adjust Course Depth & Reality Check message based on ML prediction
        if prediction == 0:
            will_complete_easily = False
            status = "Reality Check: Tight Crunch! High Procrastination Risk"
            depth = "Fast-Track Essentials (Theory Trimmed, 100% Action)"
            recommended_modules = 3
            min_hours_needed = complexity * 3
            recommended_daily = round(min_hours_needed / days_left, 1)
            advice = (
                f"You have {total_hours} hours total ({days_left} days x {daily_hours}h/day) for a "
                f"complexity {complexity}/10 project. To finish on time, either bump your daily time to "
                f"~{recommended_daily}h/day, or follow our trimmed 3-module Fast-Track course!"
            )
        elif prediction == 1:
            will_complete_easily = True
            status = "Reality Check: Realistic & Achievable with Discipline"
            depth = "Standard Balanced (Core Theory + Immediate Practice)"
            recommended_modules = 4
            advice = (
                f"You have {total_hours} total hours across {days_left} days. That is a sweet spot for a "
                f"complexity {complexity}/10 project! Stick to {daily_hours}h every day and don't skip the daily quizzes."
            )
        else:
            will_complete_easily = True
            status = "Reality Check: Plenty of Time for Deep Mastery"
            depth = "Comprehensive Deep-Dive (Architecture + Best Practices + Bonus Challenges)"
            recommended_modules = 5
            advice = (
                f"With {total_hours} total hours before {deadline_str}, you have plenty of breathing room! "
                f"We unlocked a 5-module Deep-Dive track so you master both the 'how' and the 'why'."
            )

        return {
            "will_complete_on_time": will_complete_easily,
            "reality_check_status": status,
            "ml_confidence_percent": confidence,
            "days_remaining": days_left,
            "total_available_hours": total_hours,
            "project_complexity_score": f"{complexity}/10",
            "claimed_level": level_data["claimed_level"],
            "assessed_level": level_data["assessed_level"],
            "level_assessment_note": level_data["level_assessment_note"],
            "recommended_course_depth": depth,
            "recommended_modules_count": recommended_modules,
            "procrastination_advice": advice
        }

# Create a single ready-to-use instance
ml_engine = CurryKrustMLEngine()

# ==========================================================
# QUICK TEST BLOCK (Runs when you type: python ml_engine.py)
# ==========================================================
if __name__ == "__main__":
    import json
    print("\n--- TEST 1: Procrastinator trying to build a huge AI app in 2 days ---")
    test1 = ml_engine.run_reality_check(
        description="Build fullstack AI web app",
        end_goal="Deploy working app with database and login",
        daily_hours=1.5,
        deadline_str="2026-10-28",
        prior_level="Advanced" # Claimed Advanced, but wrote a super short 5-word description!
    )
    print(json.dumps(test1, indent=2))