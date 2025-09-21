
from google import genai
from google.genai import types
from django.conf import settings


GEMINI_API_KEY = settings.GEMINI_API_KEY
AI_MODEL = "gemini-2.5-flash"
client = genai.Client(api_key=GEMINI_API_KEY)


class AIService:
    """
    This class is used to interact with the AI service.
    """

    def __init__(self):
        self.chat = client.chats.create(model=AI_MODEL)

    async def generate_response(self, prompt: str) -> str:
        """Send user prompt to AI and return text response."""
        response = self.chat.send_message(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=prompt
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