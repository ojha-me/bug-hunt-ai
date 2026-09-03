import json
import logging
from django.utils import timezone
from ai_core.utils.groq_llm import GroqChat
from system_design.models import SDPracticeSession, SDPracticeStatus
from system_design.utils.sd_practice_prompts import (
    PRACTICE_SYSTEM_PROMPT,
    PRACTICE_GREETING_PROMPT,
    PRACTICE_PHASE_OPEN_PROMPT,
    PRACTICE_COMPLETE_PROMPT,
    PHASE_BY_NUM,
)

logger = logging.getLogger('system_design.practice')

AI_MODEL = "qwen/qwen3.8-27b"


def _extract_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    return {}


class SDPracticeService:
    def __init__(self):
        self.chat = GroqChat(model=AI_MODEL)

    def generate_greeting(self, case_study) -> dict:
        prompt = PRACTICE_GREETING_PROMPT.format(
            case_title=case_study.title,
            difficulty=case_study.difficulty,
            overview=case_study.overview,
        )
        response = self.chat.send_message(message=prompt)
        parsed = _extract_json(response.text)
        if parsed.get("greeting_message"):
            return {"greeting_message": parsed["greeting_message"]}
        return {"greeting_message": f"Welcome! We are about to design '{case_study.title}' step by step. Shall we start phase 1?"}

    def generate_phase_transition(self, current_phase: int) -> dict:
        next_phase = PHASE_BY_NUM.get(current_phase + 1)
        if not next_phase:
            return {}
        current = PHASE_BY_NUM.get(current_phase, {})
        prompt = PRACTICE_PHASE_OPEN_PROMPT.format(
            prev_num=current_phase,
            prev_name=current.get("name", ""),
            next_num=next_phase["num"],
            next_name=next_phase["name"],
        )
        response = self.chat.send_message(message=prompt)
        parsed = _extract_json(response.text)
        return {"message": parsed.get("message", f"Phase {next_phase['num']}: {next_phase['name']}.")}

    def generate_completion(self, case_study, weak_areas: list) -> dict:
        areas = ", ".join(weak_areas) if weak_areas else "deep dives and trade-offs"
        prompt = PRACTICE_COMPLETE_PROMPT.format(
            case_title=case_study.title,
            weak_areas=areas,
        )
        response = self.chat.send_message(message=prompt)
        parsed = _extract_json(response.text)
        return {"message": parsed.get("message", "Great work — you completed a full design drill!")}

    def generate_response(self, case_study, session: SDPracticeSession, message_content: str, diagram=None, context: str = "") -> dict:
        phase = PHASE_BY_NUM.get(session.current_phase, PHASE_BY_NUM[1])

        rubric = {
            "functional_requirements": case_study.functional_requirements,
            "non_functional_requirements": case_study.non_functional_requirements,
            "capacity": case_study.capacity,
            "key_components": case_study.key_components,
            "tradeoffs": case_study.tradeoffs,
            "reference_diagram": case_study.reference_diagram,
        }

        diagram_block = ""
        if diagram:
            diagram_block = (
                "\nThe learner drew this diagram on their whiteboard for Phase 4 (High-Level Design):\n"
                f"DIAGRAM NODES:\n{json.dumps(diagram.get('nodes', []))}\n"
                f"DIAGRAM EDGES:\n{json.dumps(diagram.get('edges', []))}\n"
                "Review it constructively. If it is a coherent end-to-end flow that matches the rubric's key components, mark complete."
            )

        prompt = f"""
{PRACTICE_SYSTEM_PROMPT}

CURRENT PHASE: Phase {phase['num']}: {phase['name']}
PHASE INSTRUCTION:
{phase['instruction']}

COMPLETION CRITERIA:
{phase['complete_criteria']}

SCRIPTED OPENING (only hand this out if they are stuck or blank):
{phase['scripted_open']}

CASE STUDY PROMPT:
{case_study.title} (difficulty: {case_study.difficulty})
{case_study.overview}

HIDDEN RUBRIC (NEVER reveal these to the learner; use them only to evaluate the phase attempt):
{json.dumps(rubric)}

ALREADY-COMPLETED PHASES: {json.dumps(session.phase_states)}

RECENT CONVERSATION:
{context or "(new session)"}

{diagram_block}

LEARNER'S MESSAGE: {message_content}
"""

        response = self.chat.send_message(message=prompt)
        parsed = _extract_json(response.text)
        if not parsed:
            return {
                "content": response.text.strip() or "Let's keep going.",
                "complete": False,
                "phase_summary": "",
                "notes": "",
            }

        return {
            "content": parsed.get("content", "Let's keep going."),
            "complete": bool(parsed.get("complete", False)),
            "phase_summary": parsed.get("phase_summary", ""),
            "notes": parsed.get("notes", ""),
        }

    def record_phase_result(self, session: SDPracticeSession, complete: bool, score: float, notes: str) -> bool:
        """Persist phase result; if the phase is complete, advance the session. Returns True if advanced/completed."""
        phase_num = session.current_phase
        states = dict(session.phase_states)

        if "phases" not in states:
            states["phases"] = {}

        recorded = states.setdefault("phases", {}).get(str(phase_num), {})
        recorded.update({
            "completed": complete,
            "score": score,
            "notes": notes,
            "updated_at": timezone.now().isoformat(),
        })
        states["phases"][str(phase_num)] = recorded

        weak = str(notes).strip()
        if weak and weak not in [w for w in session.weak_areas]:
            session.weak_areas = list(session.weak_areas) + [weak]

        progressed = False
        if complete:
            session.current_phase = phase_num + 1
            progressed = True
            if phase_num == 5:
                session.status = SDPracticeStatus.COMPLETED
                session.completed_at = timezone.now()

        session.phase_states = states
        session.save()
        return progressed