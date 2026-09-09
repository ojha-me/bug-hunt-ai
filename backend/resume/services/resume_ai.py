"""
Resume intelligence over Groq. Two jobs:
  1. review(resume, jd)  -> ATS-style match score + targeted, JD-aware feedback.
  2. tailor(resume, jd)  -> compact swap-in pieces (summary / skills / bullets)
     the user pastes into their LaTeX source. We deliberately do NOT regenerate
     the whole resume — output stays inside the free-tier token budget and
     targeted tailoring is how good tailoring actually works.
"""
import json

from ai_core.utils.groq_llm import GroqChat

AI_MODEL = "qwen/qwen3.8-27b"


class ResumeAIService:
    def __init__(self):
        self.chat = GroqChat(model=AI_MODEL)

    # ---------------- review ----------------

    def review(self, resume_text: str, job_description: str) -> dict:
        prompt = (
            "You are a pragmatic technical recruiter and ATS screener. Compare this candidate's resume against the "
            "job description and give honest, specific, actionable feedback. The resume is in LaTeX — judge the "
            "CONTENT, ignore formatting/markup.\n\n"
            f"JOB DESCRIPTION:\n{job_description[:3500]}\n\n"
            f"RESUME (LaTeX source):\n{resume_text[:5000]}\n\n"
            "Return ONLY a compact JSON object with EXACTLY these keys:\n"
            '{\n'
            '  \"match_score\": integer 0-100 (how well this resume fits THIS role),\n'
            '  \"summary\": one or two sentences on overall fit,\n'
            '  \"matched_keywords\": [up to 10 important skills/keywords from the JD the resume already shows],\n'
            '  \"missing_keywords\": [up to 10 important skills/keywords from the JD the resume is missing or hiding],\n'
            '  \"strengths\": [up to 3 short phrases — what makes this candidate a fit],\n'
            '  \"gaps\": [up to 4 short phrases — concrete weaknesses vs this JD],\n'
            '  \"bullet_rewrites\": [up to 4 objects {\"before\": existing bullet text, \"after\": a stronger, '
            'JD-aligned rewrite with quantified impact}],\n'
            '  \"tailoring_tips\": [up to 4 short, concrete actions to better fit this role]\n'
            "}\n"
            "Be honest — if it's a weak match, say so and score it low. Keep every string short. For bullet_rewrites, "
            "quote real bullets from the resume as 'before'."
        )
        response = self.chat.send_message(message=prompt, json_mode=True)
        return self._normalize_review(self._parse(response.text))

    # ---------------- tailor ----------------

    def tailor(self, resume_text: str, job_description: str) -> dict:
        prompt = (
            "You are helping a candidate tailor their resume to a specific job. Produce a small set of swap-in "
            "pieces they can paste into their resume — do NOT rewrite the whole thing. The resume is in LaTeX; "
            "return PLAIN TEXT content (no LaTeX markup), the candidate will format it themselves.\n\n"
            f"JOB DESCRIPTION:\n{job_description[:3500]}\n\n"
            f"CURRENT RESUME (LaTeX source):\n{resume_text[:5000]}\n\n"
            "Return ONLY a compact JSON object with EXACTLY these keys:\n"
            '{\n'
            '  \"summary\": a tailored 2-3 sentence professional summary aimed at this role,\n'
            '  \"skills\": a tailored, comma-separated skills line prioritising what THIS JD asks for (only skills '
            'the candidate plausibly has based on the resume),\n'
            '  \"bullets\": [up to 5 objects {\"context\": which role/project it belongs to, \"text\": a strong, '
            'JD-aligned bullet with quantified impact}]\n'
            "}\n"
            "Ground everything in the candidate's real experience — do not invent employers, titles, or metrics they "
            "don't have. Keep it truthful and concise."
        )
        response = self.chat.send_message(message=prompt, json_mode=True)
        return self._normalize_tailor(self._parse(response.text))

    # ---------------- helpers ----------------

    def _parse(self, text: str) -> dict:
        try:
            return json.loads(text)
        except Exception:
            start, end = text.find("{"), text.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start : end + 1])
                except Exception:
                    pass
        return {}

    def _strlist(self, v, n, maxlen=200):
        if isinstance(v, list):
            return [str(x)[:maxlen] for x in v[:n] if str(x).strip()]
        return []

    def _normalize_review(self, data: dict) -> dict:
        try:
            score = max(0, min(100, int(round(float(data.get("match_score", 0))))))
        except Exception:
            score = 0
        rewrites = []
        raw = data.get("bullet_rewrites")
        if isinstance(raw, list):
            for item in raw[:4]:
                if isinstance(item, dict) and (item.get("before") or item.get("after")):
                    rewrites.append({
                        "before": str(item.get("before", ""))[:400],
                        "after": str(item.get("after", ""))[:400],
                    })
        return {
            "match_score": score,
            "summary": str(data.get("summary", ""))[:400] or "Analysis complete.",
            "matched_keywords": self._strlist(data.get("matched_keywords"), 10, 60),
            "missing_keywords": self._strlist(data.get("missing_keywords"), 10, 60),
            "strengths": self._strlist(data.get("strengths"), 3),
            "gaps": self._strlist(data.get("gaps"), 4),
            "bullet_rewrites": rewrites,
            "tailoring_tips": self._strlist(data.get("tailoring_tips"), 4),
        }

    def _normalize_tailor(self, data: dict) -> dict:
        bullets = []
        raw = data.get("bullets")
        if isinstance(raw, list):
            for item in raw[:5]:
                if isinstance(item, dict) and item.get("text"):
                    bullets.append({
                        "context": str(item.get("context", ""))[:120],
                        "text": str(item.get("text", ""))[:400],
                    })
        return {
            "summary": str(data.get("summary", ""))[:600],
            "skills": str(data.get("skills", ""))[:600],
            "bullets": bullets,
        }
