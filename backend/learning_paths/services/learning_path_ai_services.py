# ai_core/services/learning_path_service.py
from google import genai
from google.genai import types
from django.conf import settings
import json
import logging
from learning_paths.models import UserLearningPath, SubtopicProgress
from learning_paths.utils.learning_prompts import (
    LEARNING_PATH_SYSTEM_PROMPT,
    SUBTOPIC_INTRODUCTION_PROMPT,
    SOCRATIC_QUESTIONING_PROMPT,
    ADAPTIVE_FEEDBACK_PROMPT,
    PROGRESS_ASSESSMENT_PROMPT,
    ENCOURAGEMENT_PROMPT,
    CONCEPT_EXPLANATION_PROMPT
)
from learning_paths.utils.learning_context_helpers import generate_learning_context
from asgiref.sync import sync_to_async

logger = logging.getLogger("ai_core.services.learning_path_service")

GEMINI_API_KEY = settings.GEMINI_API_KEY
AI_MODEL = "gemini-2.5-flash"
client = genai.Client(api_key=GEMINI_API_KEY)


class LearningPathAI:
    def __init__(self):
        self.chat = client.chats.create(model=AI_MODEL)

    async def generate_learning_path(self, user_query: str) -> dict:
        """
        Generate a structured learning path (topic + subtopics) from Gemini.
        Returns a dict matching our DB model structure.
        """

        system_prompt = """
        You are an AI that generates structured learning paths.

        ⚠️ Response Format Rules (strict):
            - You must respond **only in JSON** (no Markdown fences, no extra text).
            - Valid JSON must be parsable by `json.loads` without errors.
            - Do not include triple backticks or language tags like ```json or ```python.
            - Do not include commentary outside the JSON.
            - Give me the estimated_duration in HH:MM:SS format ONLY, no extra text, no explanations. Example: 02:30:15

        Example format:

        {
          "topic": {
            "name": "string",
            "description": "string",
            "difficulty_level": "Beginner|Intermediate|Advanced",
            "estimated_duration": "HH:MM:SS"
          },
          "subtopics": [
            {
              "name": "string",
              "description": "string",
              "order": 1,
              "learning_objectives": ["list", "of", "strings"],
              "estimated_duration": "HH:MM:SS"
            }
          ]
        }
        """

        full_prompt = f"{system_prompt}\n\nUser request: {user_query}"

        response = self.chat.send_message(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )

        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as exception:
            logger.error("Gemini returned invalid JSON: %s", response.text)
            raise ValueError("Invalid AI response format") from exception

        return data


class LearningPathTutorAI:
    """
    Specialized AI tutor for learning path interactions using Socratic methodology
    """
    
    def __init__(self, user_learning_path: UserLearningPath):
        self.chat = client.chats.create(model=AI_MODEL)
        self.user_learning_path = user_learning_path
    
    async def generate_greeting_message(self, topic_name: str, subtopic_name: str):
        """Generate a greeting message for the user"""
        system_prompt = (
            "You are a helpful assistant that creates friendly, motivational greeting messages "
            "for learning modules. "
            """Response Format Rules (strict):
            - You must respond **only in JSON** (no Markdown fences, no extra text).
            - Valid JSON must be parsable by `json.loads` without errors.
            - Do not include triple backticks or language tags like ```json or ```python.
            - Do not include commentary outside the JSON.
            - The JSON must have exactly this structure: {"greeting_message": "your message here"}
            """
        )

        user_query = (
            f"Create a short, engaging greeting message for a learning module.\n"
            f"Topic: {topic_name}\n"
            f"Subtopic: {subtopic_name}\n\n"
            "The message should:\n"
            "1. Start with a friendly, welcoming greeting.\n"
            "2. Briefly introduce the topic and subtopic in a motivating way.\n"
            "3. Explain why this subtopic is important or exciting to learn.\n"
            "4. Clearly tell the learner what they will be able to do or understand by the end of this subtopic.\n"
            "5. End with an engaging, open-ended question to encourage the user to reply, like, Shall we start?.\n\n"
            'Return ONLY a JSON object with this exact format: {"greeting_message": "your complete message here"}'
        )


        full_prompt = f"{system_prompt}\n\nUser request: {user_query}"

        response = self.chat.send_message(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )

        try:
            data = json.loads(response.text)
        except json.JSONDecodeError as exception:
            logger.error("Gemini returned invalid JSON: %s", response.text)
            raise ValueError("Invalid AI response format") from exception

        return data
    
    async def generate_response(self, message_content: str, code_snippet: str | None = None, conversation=None) -> str:
        """Generate contextual tutoring response based on learning progress"""
        from ai_core.models import Message, Summary
        
        # Get conversation context (messages + summary)
        context_from_messages = ""
        context_from_summary = ""
        
        if conversation:
            messages = await sync_to_async(
                lambda: list(Message.objects.filter(conversation=conversation).order_by('-created_at')[:6])
            )()
            
            # Build message context (oldest to newest)
            for message in reversed(messages):
                context_from_messages += f"{message.sender}: {message.content[:300]}\n"
            
            # Get summary if available
            summary = await sync_to_async(
                lambda: Summary.objects.filter(conversation=conversation).order_by('-last_updated_at').first()
            )()
            
            if summary:
                context_from_summary = f"Previous Session Summary:\n{summary.content}\n\n"
        
        # Get learning path context
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        subtopic_name = current_subtopic.name if current_subtopic else "General Programming"
        topic_name = await sync_to_async(lambda: self.user_learning_path.topic.name)()
        
        # Build teaching-focused prompt
        teaching_prompt = f"""{LEARNING_PATH_SYSTEM_PROMPT}

You are teaching: {topic_name} - {subtopic_name}

TEACHING APPROACH:
- Be INSTRUCTIONAL and DIRECT (not overly Socratic)
- ALWAYS provide code examples when teaching programming concepts
- Explain concepts clearly with practical examples
- Show working code that students can run and experiment with
- Use analogies to make complex ideas simple
- Ask questions ONLY to check understanding, not as primary teaching method
- Build on previous conversation context

{context_from_summary}

RECENT CONVERSATION:
{context_from_messages}

STUDENT'S MESSAGE: {message_content}
{f"STUDENT'S CODE: {code_snippet}" if code_snippet else ""}

Respond with JSON containing:
- "content": Your clear, instructional explanation
- "code": Working code example (REQUIRED for programming concepts)
- "language": "python"
- "type": "explanation"
- "next_action": What student should try next"""

        response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=teaching_prompt,
        )
        
        # Strip markdown and parse response
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        try:
            parsed = json.loads(response_text)
            return json.dumps({
                "content": parsed.get("content", response_text),
                "code_snippet": parsed.get("code"),
                "language": parsed.get("language", "python"),
                "type": parsed.get("type", "explanation"),
                "next_action": parsed.get("next_action")
            })
        except json.JSONDecodeError:
            return json.dumps({
                "content": response_text,
                "code_snippet": None,
                "language": None,
                "type": "explanation"
            })
    
    async def _determine_response_type(self, message_content: str, learning_context: str) -> str:
        """Determine what type of response is most appropriate"""
        
        # Check if this is a new subtopic introduction
        if "start_learning_path" in learning_context or "introduce_subtopic" in learning_context:
            return "introduction"
        
        # Check for code submission (feedback needed)
        if any(keyword in message_content.lower() for keyword in ['def ', 'function', 'class ', 'import ', '```']):
            return "feedback"
        
        # Check for confusion/help requests
        if any(keyword in message_content.lower() for keyword in ['confused', 'don\'t understand', 'stuck', 'help', '?']):
            return "socratic_question"
        
        # Check for progress assessment needs
        if any(keyword in message_content.lower() for keyword in ['done', 'finished', 'complete', 'next']):
            return "assessment"
        
        # Check for encouragement needs
        if "frustrated" in learning_context or "struggling" in learning_context:
            return "encouragement"
        
        # Check for explanation requests
        if any(keyword in message_content.lower() for keyword in ['explain', 'what is', 'how does', 'why']):
            return "explanation"
        
        return "socratic_question"  # Default to Socratic questioning
    
    async def _generate_subtopic_introduction(self) -> str:
        """Generate an introduction to the current subtopic"""
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        if not current_subtopic:
            return await self._generate_general_response("Let's start your learning journey!", "")
        
        learning_context = await generate_learning_context(self.user_learning_path)
        
        # Get learning objectives asynchronously
        learning_objectives = await sync_to_async(lambda: current_subtopic.learning_objectives)()
        topic_name = await sync_to_async(lambda: self.user_learning_path.topic.name)()
        difficulty_level = await sync_to_async(lambda: self.user_learning_path.topic.difficulty_level)()
        
        prompt = SUBTOPIC_INTRODUCTION_PROMPT.format(
            topic_name=topic_name,
            subtopic_name=current_subtopic.name,
            learning_objectives=learning_objectives,
            progress_summary=learning_context,
            difficulty_level=difficulty_level
        )
        
        full_prompt = f"{LEARNING_PATH_SYSTEM_PROMPT}\n\n{prompt}"
        
        response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )
        
        return response.text
    
    async def _generate_socratic_question(self, student_response: str, learning_context: str) -> str:
        """Generate a Socratic question to guide learning"""
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        if not current_subtopic:
            return await self._generate_general_response(student_response, learning_context)
        
        # Get current learning objective asynchronously
        learning_objectives = await sync_to_async(lambda: current_subtopic.learning_objectives)()
        current_objective = learning_objectives[0] if learning_objectives else "Understanding the concept"
        
        prompt = SOCRATIC_QUESTIONING_PROMPT.format(
            subtopic_name=current_subtopic.name,
            student_response=student_response,
            current_objective=current_objective,
            recent_conversation=learning_context
        )
        
        full_prompt = f"{LEARNING_PATH_SYSTEM_PROMPT}\n\n{prompt}"
        
        response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )
        
        return response.text
    
    async def _generate_adaptive_feedback(self, student_work: str, code_snippet: str | None, learning_context: str) -> str:
        """Generate adaptive feedback based on student's work"""
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        if not current_subtopic:
            return await self._generate_general_response(student_work, learning_context)
        
        # Get performance pattern from context
        performance_pattern = "steady_learner"  # Default, should be extracted from learning_context
        if "struggling" in learning_context:
            performance_pattern = "struggling"
        elif "high_achiever" in learning_context:
            performance_pattern = "high_achiever"
        
        exercise_description = f"Working on {current_subtopic.name}"
        learning_objectives = await sync_to_async(lambda: current_subtopic.learning_objectives)()
        learning_outcome = learning_objectives[0] if learning_objectives else "Understanding the concept"
        
        prompt = ADAPTIVE_FEEDBACK_PROMPT.format(
            subtopic_name=current_subtopic.name,
            exercise_description=exercise_description,
            student_work=student_work + (f"\n\nCode:\n{code_snippet}" if code_snippet else ""),
            learning_outcome=learning_outcome,
            performance_pattern=performance_pattern
        )
        
        full_prompt = f"{LEARNING_PATH_SYSTEM_PROMPT}\n\n{prompt}"
        
        response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )
        
        # Update progress based on feedback
        await self._update_subtopic_progress_from_feedback(response.text)
        
        return response.text
    
    async def _generate_progress_assessment(self, learning_context: str) -> str:
        """Assess student's progress and readiness to advance"""
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        if not current_subtopic:
            return await self._generate_general_response("Let's assess your progress!", learning_context)
        
        # Get current progress data
        current_progress = await sync_to_async(
            lambda: SubtopicProgress.objects.filter(
                user_path=self.user_learning_path,
                subtopic=current_subtopic
            ).first()
        )()
        
        objectives_list = await sync_to_async(lambda: current_subtopic.learning_objectives)()
        interaction_summary = learning_context
        time_spent = "Ongoing"  # Could be calculated from progress timestamps
        challenges_completed = current_progress.challenges_completed if current_progress else 0
        
        prompt = PROGRESS_ASSESSMENT_PROMPT.format(
            subtopic_name=current_subtopic.name,
            objectives_list=objectives_list,
            interaction_summary=interaction_summary,
            time_spent=time_spent,
            challenges_completed=challenges_completed
        )
        
        full_prompt = f"{LEARNING_PATH_SYSTEM_PROMPT}\n\n{prompt}"
        
        response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )
        
        return response.text
    
    async def _generate_encouragement(self, learning_context: str) -> str:
        """Generate motivational encouragement"""
        # Extract emotional indicators from context
        challenge_level = "moderate"
        recent_performance = "mixed"
        emotional_indicators = "frustration"
        consistency_pattern = "regular"
        
        if "struggling" in learning_context:
            challenge_level = "high"
            recent_performance = "challenging"
        elif "high_achiever" in learning_context:
            challenge_level = "appropriate"
            recent_performance = "excellent"
            emotional_indicators = "confidence"
        
        prompt = ENCOURAGEMENT_PROMPT.format(
            challenge_level=challenge_level,
            recent_performance=recent_performance,
            emotional_indicators=emotional_indicators,
            consistency_pattern=consistency_pattern
        )
        
        full_prompt = f"{LEARNING_PATH_SYSTEM_PROMPT}\n\n{prompt}"
        
        response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )
        
        return response.text
    
    async def _generate_concept_explanation(self, concept_request: str, learning_context: str) -> str:
        """Generate clear concept explanations"""
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        concept_name = concept_request
        
        # Extract understanding level from context
        current_understanding = "basic"
        if "high_achiever" in learning_context:
            current_understanding = "advanced"
        elif "struggling" in learning_context:
            current_understanding = "beginner"
        
        learning_style = "mixed"  # Could be determined from user preferences
        subtopic_context = current_subtopic.name if current_subtopic else "General learning"
        complexity_level = await sync_to_async(lambda: self.user_learning_path.topic.difficulty_level.lower())()
        
        prompt = CONCEPT_EXPLANATION_PROMPT.format(
            concept_name=concept_name,
            current_understanding=current_understanding,
            learning_style=learning_style,
            subtopic_context=subtopic_context,
            complexity_level=complexity_level
        )
        
        full_prompt = f"{LEARNING_PATH_SYSTEM_PROMPT}\n\n{prompt}"
        
        response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )
        
        return response.text
    
    async def _generate_general_response(self, message_content: str, learning_context: str) -> str:
        """Generate general tutoring response"""
        full_prompt = f"{LEARNING_PATH_SYSTEM_PROMPT}\n\nLearning Context:\n{learning_context}\n\nStudent Message: {message_content}"
        
        response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=full_prompt,
        )
        
        # Strip markdown code fences if present
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Try to parse and restructure the response
        try:
            parsed = json.loads(response_text)
            # Restructure to match expected format
            return json.dumps({
                "content": parsed.get("content", response_text),
                "code_snippet": parsed.get("code"),
                "language": parsed.get("language", "python"),
                "type": parsed.get("type", "conversation"),
                "next_action": parsed.get("next_action")
            })
        except json.JSONDecodeError:
            # Return as plain text wrapped in JSON
            return json.dumps({
                "content": response_text,
                "code_snippet": None,
                "language": None,
                "type": "conversation"
            })
    
    async def _update_subtopic_progress_from_feedback(self, ai_response: str):
        """Update subtopic progress based on AI feedback analysis"""
        try:
            # Parse AI response to extract difficulty adjustment
            response_data = json.loads(ai_response)
            difficulty_adjustment = response_data.get('difficulty_adjustment')
            
            if difficulty_adjustment:
                current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
                if current_subtopic:
                    progress, created = await sync_to_async(
                        SubtopicProgress.objects.get_or_create
                    )(
                        user_path=self.user_learning_path,
                        subtopic=current_subtopic,
                        defaults={'status': 'learning'}
                    )
                    
                    # Update progress based on difficulty adjustment
                    if difficulty_adjustment == "easier":
                        # Student is struggling, provide more support
                        progress.notes = f"Needs additional support. {progress.notes or ''}".strip()
                    elif difficulty_adjustment == "harder":
                        # Student is ready for more challenge
                        progress.notes = f"Ready for advanced challenges. {progress.notes or ''}".strip()
                    
                    await sync_to_async(progress.save)()
                    
        except (json.JSONDecodeError, KeyError):
            # AI response wasn't in expected format, continue without updating
            pass
    
    async def generate_summary(self, conversation):
        """
        Generate and save a summary of the learning path conversation.
        Includes learning progress and key concepts covered.
        """
        from ai_core.models import Message, Summary
        from learning_paths.utils.learning_context_helpers import generate_learning_context
        
        # Get learning context for richer summary
        learning_context = await generate_learning_context(self.user_learning_path)
        
        # Get recent conversation messages
        messages = await sync_to_async(
            lambda: list(Message.objects.filter(conversation=conversation).order_by('-created_at')[:10])
        )()
        
        # Build conversation context
        conversation_text = "\n".join([
            f"{msg.sender}: {msg.content[:200]}" 
            for msg in reversed(messages)
        ])
        
        # Get current subtopic info
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        subtopic_name = current_subtopic.name if current_subtopic else "General"
        topic_name = await sync_to_async(lambda: self.user_learning_path.topic.name)()
        
        summary_prompt = f"""Summarize this learning session focusing on:
1. Key concepts discussed
2. Student's understanding level
3. Progress made
4. Areas needing more work

Learning Path Context:
- Topic: {topic_name}
- Current Subtopic: {subtopic_name}
- Learning Context: {learning_context[:500]}

Recent Conversation:
{conversation_text}

Provide a concise summary (2-3 sentences) that captures the essence of this learning session."""

        summary_response = await sync_to_async(self.chat.send_message)(
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
            message=summary_prompt
        )

        last_message = await sync_to_async(
            lambda: Message.objects.filter(conversation=conversation).order_by('-created_at').first()
        )()

        await sync_to_async(Summary.objects.create)(
            conversation=conversation,
            content=summary_response.text,
            last_message=last_message
        )
