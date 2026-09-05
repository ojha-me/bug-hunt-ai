import os
import json
import logging
from groq import Groq
from django.conf import settings

logger = logging.getLogger(__name__)


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
        # Allow env override for A/B and versioning
        env_model = os.getenv("GROQ_MODEL", "")
        if env_model:
            self.model = env_model
        else:
            self.model = self.MODELS.get(model, model)
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.messages = []
        # Cap output so a single request stays under Groq's free-tier
        # output-tokens-per-minute limit (otherwise every call 429s as
        # "request too large"). Configurable via GROQ_MAX_TOKENS.
        try:
            self.max_tokens = int(os.getenv("GROQ_MAX_TOKENS", "900"))
        except ValueError:
            self.max_tokens = 900

    def _graceful_failure(self, err: Exception) -> "GroqResponse":
        """
        Return a readable message instead of raising, so a Groq error (rate
        limit, network) never tears down the WebSocket. JSON-mode callers fall
        back to treating this text as the message content.
        """
        if self.messages and self.messages[-1]["role"] == "user":
            self.messages.pop()  # don't leave a dangling user turn in history
        text = str(err)
        low = text.lower()
        if "rate_limit" in low or "429" in low or "too large" in low:
            msg = "The AI is momentarily rate-limited (Groq free tier's output-per-minute cap). Please wait a minute, then try again."
        else:
            msg = "The AI service had a hiccup generating a reply. Please try again in a moment."
        logger.warning("Groq call failed, returning graceful message: %s", text[:300])
        return GroqResponse(msg)

    def _strip_fences(self, text: str) -> str:
        t = text.strip()
        if t.startswith("```json"):
            t = t[7:]
        elif t.startswith("```"):
            t = t[3:]
        if t.endswith("```"):
            t = t[:-3]
        return t.strip()

    def send_message(self, message: str, json_mode: bool = True) -> GroqResponse:
        self.messages.append({"role": "user", "content": sanitize_unicode(message)})

        kwargs = {
            "model": self.model,
            "messages": self.messages,
            "temperature": 0.7,
            "max_tokens": self.max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        try:
            completion = self.client.chat.completions.create(**kwargs)
        except Exception as first_err:
            # retry once without json_mode if the model rejects response_format
            if json_mode and "response_format" in kwargs:
                try:
                    kwargs.pop("response_format")
                    completion = self.client.chat.completions.create(**kwargs)
                except Exception as retry_err:
                    return self._graceful_failure(retry_err)
            else:
                return self._graceful_failure(first_err)

        reply = sanitize_unicode(completion.choices[0].message.content or "")
        # Validate JSON when requested
        if json_mode:
            txt = self._strip_fences(reply)
            try:
                json.loads(txt)
            except json.JSONDecodeError as e:
                logger.warning("Groq JSON mode returned invalid JSON: %s | err %s", txt[:500], e)
                # keep raw but mark for caller retry
        self.messages.append({"role": "assistant", "content": reply})
        return GroqResponse(reply)

    def send_message_stream(self, message: str, on_chunk=None):
        """Streaming variant — yields chunks, calls on_chunk per delta. Falls back to non-stream if unsupported."""
        self.messages.append({"role": "user", "content": sanitize_unicode(message)})
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=self.messages,
                temperature=0.7,
                max_tokens=self.max_tokens,
                stream=True,
            )
            full = ""
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    full += delta
                    if on_chunk:
                        on_chunk(delta)
            full = sanitize_unicode(full)
            self.messages.append({"role": "assistant", "content": full})
            return GroqResponse(full)
        except Exception as e:
            logger.warning("stream fallback: %s", e)
            # fallback to non-stream
            self.messages.pop()
            return self.send_message(message)
