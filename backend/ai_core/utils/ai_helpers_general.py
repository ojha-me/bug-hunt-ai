import logging
from ai_core.models import Summary, Message, Conversation
from .context_helpers import generate_context
from .prompts import SYSTEM_PROMPT
from .groq_llm import GroqChat
from asgiref.sync import sync_to_async

AI_MODEL = "qwen/qwen3-32b"

logger = logging.getLogger('ai_core.utils.ai_helpers')

class AIService:
    """
    This class is used to interact with the AI service.
    """

    def __init__(self):
        self.chat = GroqChat(model=AI_MODEL)

    async def generate_response(self, message_content: str, code_snippet: str | None, conversation: Conversation) -> str:
        """Send user prompt to AI and return text response."""
        additional_context = await generate_context(conversation)
        full_prompt = f"{SYSTEM_PROMPT}\n\n{message_content}"
        if code_snippet:
            full_prompt += f"\n\nCode Snippet: {code_snippet}"
        if additional_context:
            full_prompt += f"\n\nAdditional Context: {additional_context}"
        response = self.chat.send_message(message=full_prompt)
        return response.text

    async def generate_title(self, prompt: str) -> str:
        """Generate a concise conversation title."""
        title_prompt = f"Generate a concise title for this conversation: {prompt}"
        response = self.chat.send_message(message=title_prompt)
        return response.text

    async def generate_summary(self, conversation):
        """
        Generate and save a summary of a conversation.
        """

        context = await generate_context(conversation)

        summary_prompt = f"Summarize the following conversation:\n{context}"

        summary_response = self.chat.send_message(message=summary_prompt)

        last_message = await sync_to_async(
            lambda: Message.objects.filter(conversation=conversation).order_by('-created_at').first()
        )()

        await sync_to_async(Summary.objects.create)(
            conversation=conversation,
            content=summary_response.text,
            last_message=last_message
        )
