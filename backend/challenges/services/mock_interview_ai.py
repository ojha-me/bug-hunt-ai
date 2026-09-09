"""
AI service for the live mock coding interview. Two jobs:
  1. Play a realistic senior-engineer interviewer during the session (present the
     problem, make the candidate explain their approach first, probe, give GRADED
     hints, never dump the solution).
  2. At the end, score the whole transcript + final code against a rubric.

It reuses the GroqChat wrapper and, for accurate probing/hints, is fed the
verified editorial for the problem as private reference (never revealed).
"""
import json

from ai_core.utils.groq_llm import GroqChat
from challenges.solutions import SOLUTIONS

AI_MODEL = "qwen/qwen3.8-27b"


class MockInterviewService:
    def __init__(self, problem):
        self.problem = problem
        self.chat = GroqChat(model=AI_MODEL)

    # ---------------- prompt building ----------------

    def _problem_brief(self) -> str:
        p = self.problem
        examples = "\n".join(
            f"  - Input: {e.get('input', '')} -> Output: {e.get('output', '')}"
            for e in (p.examples or [])[:2]
        )
        editorial = SOLUTIONS.get(p.slug, {})
        ref = ""
        if editorial:
            ref = (
                "\n\nPRIVATE REFERENCE SOLUTION (for your judgement only — NEVER reveal it, "
                "never paste it, never dictate it line by line):\n"
                f"Approach: {editorial.get('explanation', '')}\n"
                f"Optimal complexity: {editorial.get('complexity', '')}"
            )
        return (
            f"PROBLEM: {p.title} ({p.difficulty})\n"
            f"Topics: {', '.join(p.topics or [])}\n"
            f"Statement: {p.description[:900]}\n"
            f"Examples:\n{examples}"
            f"{ref}"
        )

    def _persona(self) -> str:
        return (
            "You are a senior software engineer conducting a live, timed coding interview with one "
            "candidate. Behave like a real, human interviewer, not a tutor:\n"
            "- Make the candidate drive. Have them explain their APPROACH out loud before they write code.\n"
            "- Probe their thinking: ask about time/space complexity, edge cases, and why they chose an approach.\n"
            "- When they are stuck or ask for help, give ONE small graded hint that nudges them forward — start "
            "vague and only get more specific if they stay stuck. NEVER hand them the full solution or write it for "
            "them.\n"
            "- If their approach is wrong or suboptimal, don't lecture — ask a pointed question that exposes the "
            "problem (a failing case, a complexity cost) and let them fix it.\n"
            "- When they share code, react briefly and specifically (a bug, a missed case, the complexity), then let "
            "them continue. Do not rewrite it for them.\n"
            "- Stay warm but efficient. Keep every reply short (1-4 sentences), one question at a time. Plain, "
            "conversational prose — no markdown headings or bullet dumps.\n\n"
            f"{self._problem_brief()}"
        )

    # ---------------- turns ----------------

    def generate_opening(self) -> str:
        instruction = (
            "\n\nStart the interview now. Briefly greet the candidate (one line), tell them the full problem is on "
            "the right for them to read, and ask them to talk you through their approach BEFORE they start coding. "
            "Do NOT restate the whole problem and do NOT give any hints yet. Two or three sentences, max."
        )
        response = self.chat.send_message(message=self._persona() + instruction, json_mode=False)
        return response.text.strip()

    def generate_response(self, candidate_message: str, context: str = "") -> dict:
        instruction = (
            "Respond as the interviewer, in character. If the candidate stated an approach, probe it (complexity? a "
            "tricky case?) or, if it's solid, tell them to go ahead and code it. If they're stuck or asked for help, "
            "give ONE small graded hint — never the full solution. If they shared code, react to it specifically "
            "(a bug, a missing case, the complexity) and ask a follow-up. Keep it short, one question at a time."
        )
        prompt = (
            self._persona()
            + f"\n\nINTERVIEW SO FAR:\n{context or '(the interview is just beginning)'}\n\n"
            f"CANDIDATE JUST SAID:\n{candidate_message}\n\n"
            + instruction
        )
        response = self.chat.send_message(message=prompt, json_mode=False)
        return {"content": response.text.strip(), "type": "explanation", "diagram": None}

    # ---------------- final evaluation ----------------

    def evaluate(self, transcript: str, code: str, passed: int, total: int, elapsed_minutes: int) -> dict:
        """
        Score the interview. Correctness is grounded in the real judge result
        (passed/total); the rest is judged from the transcript + code by the LLM.
        Returns a dict; falls back to a minimal rubric if the model output is bad.
        """
        prompt = (
            "You are the interviewer above, now writing up your hire decision after the interview. "
            "Score the candidate honestly, like a real interviewer would.\n\n"
            f"{self._problem_brief()}\n\n"
            f"AUTOMATED JUDGE RESULT: the candidate's final code passed {passed} of {total} hidden test cases.\n"
            f"TIME SPENT: about {elapsed_minutes} minutes.\n\n"
            f"FINAL CODE:\n```python\n{code[:2500]}\n```\n\n"
            f"FULL TRANSCRIPT:\n{transcript[:4000]}\n\n"
            "Return ONLY a compact JSON object (no prose outside it) with EXACTLY these keys:\n"
            '{\n'
            '  \"verdict\": one of \"strong_hire\" | \"hire\" | \"lean_hire\" | \"no_hire\",\n'
            '  \"scores\": {\"correctness\": 0-4, \"communication\": 0-4, \"problem_solving\": 0-4, '
            '\"coding\": 0-4, \"speed\": 0-4},\n'
            '  \"strengths\": [up to 3 short phrases],\n'
            '  \"improvements\": [up to 3 short, actionable phrases],\n'
            '  \"summary\": one or two sentences of overall feedback\n'
            "}\n"
            "Ground 'correctness' in the judge result (0 tests passed -> low, all passed -> high). Judge "
            "'communication' on whether they explained approach before coding and thought out loud, 'problem_solving' "
            "on approach quality and how much hinting they needed, 'speed' on time vs difficulty. Be fair but not "
            "generous. Keep every string short."
        )
        response = self.chat.send_message(message=prompt, json_mode=True)
        data = self._parse(response.text)
        return self._normalize(data, passed, total)

    def _parse(self, text: str) -> dict:
        try:
            return json.loads(text)
        except Exception:
            # try to salvage a JSON object embedded in prose
            start, end = text.find("{"), text.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start : end + 1])
                except Exception:
                    pass
        return {}

    def _normalize(self, data: dict, passed: int, total: int) -> dict:
        def clamp(v):
            try:
                return max(0, min(4, int(round(float(v)))))
            except Exception:
                return 0

        raw_scores = data.get("scores") or {}
        scores = {k: clamp(raw_scores.get(k, 0)) for k in
                  ("correctness", "communication", "problem_solving", "coding", "speed")}
        verdict = data.get("verdict")
        if verdict not in ("strong_hire", "hire", "lean_hire", "no_hire"):
            avg = sum(scores.values()) / 5.0
            verdict = "strong_hire" if avg >= 3.3 else "hire" if avg >= 2.6 else "lean_hire" if avg >= 1.8 else "no_hire"

        def strlist(v):
            if isinstance(v, list):
                return [str(x)[:160] for x in v[:3] if str(x).strip()]
            return []

        return {
            "verdict": verdict,
            "scores": scores,
            "passed": passed,
            "total": total,
            "strengths": strlist(data.get("strengths")),
            "improvements": strlist(data.get("improvements")),
            "summary": str(data.get("summary", ""))[:500] or "Interview complete.",
        }
