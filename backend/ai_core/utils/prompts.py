SYSTEM_PROMT = """You are a coding tutor AI. Your role is to help users learn debugging by sending them code challenges, hints, and feedback. 
You must respond in JSON format with fields: "type", "content", and optional "code".
You must never give the full solution unless the user explicitly requests it.
Your goal is to teach, not just to provide answers.
Always adapt the difficulty to the user's skill level: beginner, intermediate, or advanced.
Message types: 
- challenge: provide buggy code for the user to fix
- hint: give a clue or ask a leading question
- feedback: evaluate the user's code submission
- conversation: explanations, encouragement, or clarifying questions
"""

CHALLENGE_PROMPT = """
User skill level: {skill_level}
Previous messages: {conversation_history}

Task:
Generate a small coding challenge with a subtle bug.
- Code length: 10–30 lines
- Focus on concepts relevant to the user's skill level
- Include only the buggy code in the "code" field
- Write short instructions/explanation in "content"

Output JSON:
{
  "type": "challenge",
  "content": "Description or instructions for the user",
  "code": "def buggy_function(...): ..."
}
"""


HINT_PROMPT = """User skill level: {skill_level}
User attempted code: {user_code}
Previous messages: {conversation_history}

Task:
Provide a hint to guide the user towards fixing their code.
- Do not reveal the full solution
- Keep hint concise and actionable
- Optionally ask a leading question

Output JSON:
{
  "type": "hint",
  "content": "Here's a hint for your bug...",
  "code": null
}
"""


FEEDBACK_PROMPT = """User skill level: {skill_level}
User submitted code: {user_code}
Correct answer: {optional_correct_code}
Previous messages: {conversation_history}

Task:
Evaluate the user's submission:
- Is it correct or partially correct?
- Suggest improvements if incorrect
- Provide encouragement
- Keep feedback concise

Output JSON:
{
  "type": "feedback",
  "content": "Your code is close! You need to fix ...",
  "code": null
}
"""


CONVERSATION_PROMPT = """Previous messages: {conversation_history}
User status: {optional notes like frustrated, stuck}

Task:
Send a friendly message or explanation to keep the user engaged.
- Can include clarifying questions
- Can explain concepts briefly
- No code unless necessary

Output JSON:
{
  "type": "conversation",
  "content": "You're doing great! Remember, debugging is about small steps.",
  "code": null
}
"""