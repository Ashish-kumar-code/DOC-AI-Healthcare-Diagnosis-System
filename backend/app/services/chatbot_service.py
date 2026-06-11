"""
Symptom collection chatbot service.
Guides user through structured symptom questions.
"""

SYSTEM_QUESTIONS = [
    {
        "id": 1,
        "question": "What is your age?",
        "type": "number",
        "field": "age",
        "min": 1,
        "max": 120,
    },
    {
        "id": 2,
        "question": "What is your gender? (male/female/other/prefer_not_to_say)",
        "type": "choice",
        "field": "gender",
        "options": ["male", "female", "other", "prefer_not_to_say"],
    },
    {
        "id": 3,
        "question": "Describe your main symptoms in detail. What are you experiencing?",
        "type": "text",
        "field": "symptom_text",
    },
    {
        "id": 4,
        "question": "For how many days have you had these symptoms?",
        "type": "number",
        "field": "duration_days",
        "min": 1,
        "max": 365,
    },
    {
        "id": 5,
        "question": "How severe are your symptoms? (mild/moderate/severe)",
        "type": "choice",
        "field": "severity",
        "options": ["mild", "moderate", "severe"],
    },
    {
        "id": 6,
        "question": "What is your body temperature in Fahrenheit? (or skip with 'N')",
        "type": "number",
        "field": "temperature",
        "optional": True,
        "min": 90,
        "max": 110,
    },
    {
        "id": 7,
        "question": "Rate your pain level from 0-10 (0 = no pain, 10 = severe pain). Or skip with 'N'",
        "type": "number",
        "field": "pain_level",
        "optional": True,
        "min": 0,
        "max": 10,
    },
]

RED_FLAG_SYMPTOMS = [
    "chest pain", "difficulty breathing", "shortness of breath", "unconscious",
    "severe bleeding", "stroke signs", "suicidal", "poisoning", "severe allergic reaction",
]


class ChatbotService:
    def __init__(self):
        self.current_question_idx = 0
        self.collected_data = {}

    def get_next_question(self):
        if self.current_question_idx < len(SYSTEM_QUESTIONS):
            q = SYSTEM_QUESTIONS[self.current_question_idx]
            return {
                "question_id": q["id"],
                "question": q["question"],
                "type": q["type"],
                "options": q.get("options"),
                "optional": q.get("optional", False),
            }
        return None

    def process_answer(self, user_message):
        if self.current_question_idx >= len(SYSTEM_QUESTIONS):
            return {
                "status": "complete",
                "message": "All symptoms collected. Ready for diagnosis.",
                "data": self.collected_data,
            }

        question = SYSTEM_QUESTIONS[self.current_question_idx]
        field = question["field"]

        # Parse and validate answer
        try:
            if question["type"] == "number":
                val = float(user_message) if user_message.lower() != "n" else None
                if val is None and not question.get("optional", False):
                    return {
                        "status": "invalid",
                        "message": f"Please provide a valid number for {field}.",
                        "question": self.get_next_question(),
                    }
                if val is not None:
                    min_val = question.get("min")
                    max_val = question.get("max")
                    if not (min_val <= val <= max_val):
                        return {
                            "status": "invalid",
                            "message": f"Please enter a value between {min_val} and {max_val}.",
                            "question": self.get_next_question(),
                        }
                if val is not None:
                    self.collected_data[field] = val

            elif question["type"] == "choice":
                if user_message.lower() not in question["options"]:
                    return {
                        "status": "invalid",
                        "message": f"Please choose from: {', '.join(question['options'])}.",
                        "question": self.get_next_question(),
                    }
                self.collected_data[field] = user_message.lower()

            elif question["type"] == "text":
                if len(user_message.strip()) < 5:
                    return {
                        "status": "invalid",
                        "message": "Please provide more detail about your symptoms.",
                        "question": self.get_next_question(),
                    }
                self.collected_data[field] = user_message.strip()

                # Check for red flag symptoms
                for flag in RED_FLAG_SYMPTOMS:
                    if flag.lower() in user_message.lower():
                        return {
                            "status": "red_flag",
                            "message": f"⚠️ ALERT: You mentioned '{flag}'. **Please seek immediate medical attention or call emergency services!**",
                            "data": self.collected_data,
                        }

        except (ValueError, KeyError):
            return {
                "status": "invalid",
                "message": "Invalid input. Please try again.",
                "question": self.get_next_question(),
            }

        # Move to next question
        self.current_question_idx += 1
        next_q = self.get_next_question()

        if next_q:
            return {
                "status": "continued",
                "message": "Got it. Next question:",
                "question": next_q,
            }
        else:
            return {
                "status": "complete",
                "message": "All questions answered! Ready for diagnosis.",
                "data": self.collected_data,
            }

    def reset(self):
        self.current_question_idx = 0
        self.collected_data = {}
