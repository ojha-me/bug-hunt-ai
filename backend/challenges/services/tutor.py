from groq import Groq
from django.conf import settings
from ai_core.utils.groq_llm import sanitize_unicode

MODEL = "qwen/qwen3.8-27b"
MAX_HISTORY_TURNS = 10
MAX_STORED_TURNS = 40


def build_tutor_system_prompt(problem) -> str:
    examples = "\n".join(
        f"- Input: {e.get('input', '')}\n  Output: {e.get('output', '')}"
        + (f"\n  Explanation: {e.get('explanation', '')}" if e.get("explanation") else "")
        for e in (problem.examples or [])
    )
    constraints = "\n".join(f"- {c}" for c in (problem.constraints or []))
    topics = ", ".join(problem.topics or [])

    return (
        "You are a senior software engineering interview tutor helping a candidate solve a coding problem."
        "\n\nThe problem:"
        f"\nTitle: {problem.title} ({problem.difficulty} difficulty, topics: {topics})"
        f"\nStatement:\n{problem.description}"
        f"\n\nExamples:\n{examples or '(none)'}"
        f"\n\nConstraints:\n{constraints or '(none)'}"
        f"\n\nTest cases (input -> expected output):\n"
        + "\n".join(
            f"- {c.get('name', 'case')}: input=\"{c.get('stdin', '')}\" -> expected=\"{c.get('expected_output', '')}\""
            for c in (problem.test_cases or [])
        )
        + "\n\nRules:"
        "\n- NEVER give the full solution outright. Never dump final code."
        "\n- Guide the candidate with Socratic hints, small steps, and questions."
        "\n- If they shared code, point out bugs or edge cases in that code and suggest how to think about fixing them."
        "\n- Tailor guidance to their current approach; assume they want to learn, not be given the answer."
        "\n- Keep replies concise (under ~150 words) and end with a question or a nudge."
    )


def _get_client() -> Groq:
    return Groq(api_key=settings.GROQ_API_KEY)


def send_tutor_message(problem, session, user_message: str, code: str = "") -> str:
    """
    Appends the user's message (optionally with their current code) to the
    tutor session, gets an AI reply, persists both, and returns the reply.
    """
    turn = user_message.strip() or "Can you give me a hint?"
    if code and code.strip():
        turn += f"\n\n[CURRENT CODE]\n```python\n{code}\n```"

    messages = [{"role": "system", "content": build_tutor_system_prompt(problem)}]
    history = session.history or []
    messages.extend(history[-MAX_HISTORY_TURNS:])
    messages.append({"role": "user", "content": sanitize_unicode(turn)})

    completion = _get_client().chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.6,
        max_tokens=500,
    )
    reply = sanitize_unicode(completion.choices[0].message.content or "")
    reply = reply.strip() or "I'm not sure — let's reason through it together."

    history.append({"role": "user", "content": turn})
    history.append({"role": "assistant", "content": reply})
    session.history = history[-MAX_STORED_TURNS:]
    session.save(update_fields=["history", "updated_at"])
    return reply