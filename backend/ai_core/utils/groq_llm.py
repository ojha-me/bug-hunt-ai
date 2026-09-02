from groq import Groq
from django.conf import settings


def sanitize_unicode(text: str) -> str:
    """
    Repair text that may contain UTF-16 surrogate code points.

    Some Groq models occasionally emit surrogates in their generated text.
    Groq's SDK (pydantic JSON serializer) fails to encode *any* surrogate
    code point, raising ``UnicodeEncodeError: 'utf-8' codec can't encode
    ... surrogates not allowed``. This converts valid surrogate pairs into
    their real Unicode characters (so emoji survive) and drops lone
    (unpaired) surrogates, producing a clean string the SDK can serialize.
    """
    if not text:
        return text
    out = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        code = ord(ch)
        # High surrogate followed by a low surrogate => merge into the real code point
        if 0xD800 <= code <= 0xDBFF and i + 1 < n and 0xDC00 <= ord(text[i + 1]) <= 0xDFFF:
            low = ord(text[i + 1])
            cp = 0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00)
            out.append(chr(cp))
            i += 2
            continue
        # Any lone surrogate (high or low) => drop it
        if 0xD800 <= code <= 0xDFFF:
            i += 1
            continue
        out.append(ch)
        i += 1
    return "".join(out)


class GroqResponse:
    """Simple wrapper exposing a `.text` attribute like the Gemini SDK response."""

    def __init__(self, text: str):
        self.text = sanitize_unicode(text)


class GroqChat:
    """
    Minimal chat wrapper for the Groq (OpenAI-compatible) API that mimics the
    `google.genai` chat interface (`chat.send_message(...)` returning `.text`).

    Conversation history is accumulated per instance to preserve the behaviour
    previously provided by `client.chats.create(...)`.
    """

    MODELS = {
        "fast": "qwen/qwen3.8-27b",
        "default": "qwen/qwen3.8-27b",
    }

    def __init__(self, model: str = "default"):
        self.model = self.MODELS.get(model, model)
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.messages = []

    def send_message(self, message: str) -> GroqResponse:
        self.messages.append({"role": "user", "content": sanitize_unicode(message)})

        completion = self.client.chat.completions.create(
            model=self.model,
            messages=self.messages,
            temperature=0.7,
        )

        reply = sanitize_unicode(completion.choices[0].message.content or "")
        self.messages.append({"role": "assistant", "content": reply})
        return GroqResponse(reply)
