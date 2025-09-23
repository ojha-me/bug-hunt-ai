
from google import genai
from google.genai import types
from django.conf import settings
import logging
from .prompts import SYSTEM_PROMPT
GEMINI_API_KEY = settings.GEMINI_API_KEY
AI_MODEL = "gemini-2.5-flash"
client = genai.Client(api_key=GEMINI_API_KEY)

logger = logging.getLogger('ai_core.utils.ai_helpers')

class AIService:
    """
    This class is used to interact with the AI service.
    """

    def __init__(self):
        self.chat = client.chats.create(model=AI_MODEL)

    async def generate_response(self, prompt: str) -> str:
        """Send user prompt to AI and return text response."""
        full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
        response = self.chat.send_message(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )
        return response.text

    
    async def generate_title(self, prompt: str) -> str:
        """Generate a concise conversation title."""
        title_prompt = f"Generate a concise title for this conversation: {prompt}"
        response = self.chat.send_message(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=title_prompt
        )
        return response.text