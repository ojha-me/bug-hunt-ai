# ai_core/services/learning_path_service.py
from google import genai
from google.genai import types
from django.conf import settings
import json
import logging

logger = logging.getLogger("ai_core.services.learning_path_service")

GEMINI_API_KEY = settings.GEMINI_API_KEY
AI_MODEL = "gemini-2.5-flash"
client = genai.Client(api_key=GEMINI_API_KEY)


class LearningPathAI:
    def __init__(self):
        self.chat = client.chats.create(model=AI_MODEL)

    async def generate_learning_path(self, user_query: str) -> dict:
        """
        Generate a structured learning path (topic + subtopics) from Gemini.
        Returns a dict matching our DB model structure.
        """

        system_prompt = """
        You are an AI that generates structured learning paths.

        ⚠️ Response Format Rules (strict):
            - You must respond **only in JSON** (no Markdown fences, no extra text).
            - Valid JSON must be parsable by `json.loads` without errors.
            - Do not include triple backticks or language tags like ```json or ```python.
            - Do not include commentary outside the JSON.
            - Give me the estimated_duration in HH:MM:SS format ONLY, no extra text, no explanations. Example: 02:30:15

        Example format:

        {
          "topic": {
            "name": "string",
            "description": "string",
            "difficulty_level": "Beginner|Intermediate|Advanced",
            "estimated_duration": "HH:MM:SS"
          },
          "subtopics": [
            {
              "name": "string",
              "description": "string",
              "order": 1,
              "learning_objectives": ["list", "of", "strings"],
              "estimated_duration": "HH:MM:SS"
            }
          ]
        }
        """

        full_prompt = f"{system_prompt}\n\nUser request: {user_query}"

        response = self.chat.send_message(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )

        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as exception:
            logger.error("Gemini returned invalid JSON: %s", response.text)
            raise ValueError("Invalid AI response format") from exception

        return data
