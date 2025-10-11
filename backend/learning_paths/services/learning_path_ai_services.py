from google import genai
from google.genai import types
from django.conf import settings
from django.utils import timezone
import json
import logging
from learning_paths.models import UserLearningPath, SubtopicProgress, LearningSubtopic
from learning_paths.utils.learning_prompts import (
    LEARNING_PATH_SYSTEM_PROMPT,
    SUBTOPIC_INTRODUCTION_PROMPT,
    SOCRATIC_QUESTIONING_PROMPT,
    ADAPTIVE_FEEDBACK_PROMPT,
    PROGRESS_ASSESSMENT_PROMPT,
    ENCOURAGEMENT_PROMPT,
    CONCEPT_EXPLANATION_PROMPT
)
from ai_core.models import Message, Summary
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
        
        # Get SubtopicProgress context
        progress_context = ""
        if current_subtopic:
            subtopic_progress = await sync_to_async(
                lambda: SubtopicProgress.objects.filter(
                    user_path=self.user_learning_path,
                    subtopic=current_subtopic
                ).first()
            )()
            
            if subtopic_progress:
                learning_objectives = await sync_to_async(lambda: current_subtopic.learning_objectives)()
                progress_context = f"""
            SUBTOPIC PROGRESS TRACKING:
            - Learning Objectives: {learning_objectives}
            - Covered Points: {subtopic_progress.covered_points}
            - Remaining Points: {subtopic_progress.remaining_points}
            - AI Confidence Level: {subtopic_progress.ai_confidence:.2f} (0.0-1.0 scale)
            - Challenges Completed: {subtopic_progress.challenges_completed}/{subtopic_progress.challenges_attempted}
            - Status: {subtopic_progress.status}
            
            Note: Track what concepts the student demonstrates understanding of and update covered_points/remaining_points accordingly.
            Update ai_confidence based on student's demonstrated mastery (0.0 = no understanding, 1.0 = complete mastery).
            Student is ready to move on when remaining_points is empty and ai_confidence >= 0.8.
            """
            else:
                learning_objectives = await sync_to_async(lambda: current_subtopic.learning_objectives)()
                progress_context = f"""
            SUBTOPIC PROGRESS TRACKING:
            - Learning Objectives: {learning_objectives}
            - Covered Points: []
            - Remaining Points: {learning_objectives}
            - AI Confidence Level: 0.00 (0.0-1.0 scale)
            - Challenges Completed: 0/0
            - Status: not_started
            
            Note: This is a new subtopic. Initialize remaining_points with all learning objectives.
            Track what concepts the student demonstrates understanding of and update covered_points/remaining_points accordingly.
            """
        
        teaching_prompt = f"""
            {LEARNING_PATH_SYSTEM_PROMPT}
            You are teaching: {topic_name} - {subtopic_name}

            {progress_context}
            
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
            - "next_action": What student should try next
            - "progress_update": {{
                "covered_points": [list of concepts student has now demonstrated understanding of],
                "remaining_points": [list of concepts still to be covered],
                "ai_confidence": float between 0.0-1.0 indicating mastery level,
                "notes": "Brief note about student's progress or areas needing attention"
              }}
            
            IMPORTANT: Always include progress_update to track learning progress."""

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
            
            # Update SubtopicProgress if progress_update is provided
            subtopic_complete = False
            if current_subtopic and parsed.get("progress_update"):
                subtopic_complete = await self._update_subtopic_progress(
                    current_subtopic,
                    parsed["progress_update"]
                )
            
            return json.dumps({
                "content": parsed.get("content", response_text),
                "code_snippet": parsed.get("code"),
                "language": parsed.get("language", "python"),
                "type": parsed.get("type", "explanation"),
                "next_action": parsed.get("next_action"),
                "subtopic_complete": subtopic_complete
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
    
    async def _update_subtopic_progress(self, current_subtopic, progress_update: dict):
        """Update SubtopicProgress based on AI's assessment and return completion status"""
        
        try:
            progress, created = await sync_to_async(
                SubtopicProgress.objects.get_or_create
            )(
                user_path=self.user_learning_path,
                subtopic=current_subtopic,
                defaults={
                    'status': 'learning',
                    'started_at': timezone.now(),
                    'remaining_points': progress_update.get('remaining_points', [])
                }
            )
            
            # Update progress fields
            if 'covered_points' in progress_update:
                progress.covered_points = progress_update['covered_points']
            
            if 'remaining_points' in progress_update:
                progress.remaining_points = progress_update['remaining_points']
            
            if 'ai_confidence' in progress_update:
                # Ensure ai_confidence is between 0 and 1
                confidence = float(progress_update['ai_confidence'])
                progress.ai_confidence = max(0.0, min(1.0, confidence))
            
            if 'notes' in progress_update:
                # Append new notes to existing notes
                timestamp = timezone.now().strftime("%Y-%m-%d %H:%M")
                new_note = f"[{timestamp}] {progress_update['notes']}"
                if progress.notes:
                    progress.notes = f"{progress.notes}\n{new_note}"
                else:
                    progress.notes = new_note
            
            # Update status if not already set
            if progress.status == 'not_started':
                progress.status = 'learning'
                if not progress.started_at:
                    progress.started_at = timezone.now()
            
            await sync_to_async(progress.save)()
            
            # Check if subtopic is complete using the property
            is_complete = await sync_to_async(lambda: progress.subtopic_complete)()
            
            logger.info(
                f"Updated progress for {current_subtopic.name}: "
                f"confidence={progress.ai_confidence:.2f}, "
                f"covered={len(progress.covered_points)}, "
                f"remaining={len(progress.remaining_points)}, "
                f"complete={is_complete}"
            )
            
            return is_complete
            
        except Exception as e:
            logger.error(f"Error updating subtopic progress: {e}")
            return False
    
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
    
    async def move_to_next_subtopic(self):
        """Move the user to the next subtopic in the learning path"""
        
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        
        if not current_subtopic:
            return None
        
        # Mark current subtopic as completed
        progress, created = await sync_to_async(
            SubtopicProgress.objects.get_or_create
        )(
            user_path=self.user_learning_path,
            subtopic=current_subtopic,
            defaults={'status': 'completed', 'completed_at': timezone.now()}
        )
        
        if not created and progress.status != 'completed':
            progress.status = 'completed'
            progress.completed_at = timezone.now()
            await sync_to_async(progress.save)()
        
        # Get next subtopic
        topic = await sync_to_async(lambda: self.user_learning_path.topic)()
        next_subtopic = await sync_to_async(
            lambda: LearningSubtopic.objects.filter(
                topic=topic,
                order__gt=current_subtopic.order,
                is_active=True
            ).order_by('order').first()
        )()
        
        if next_subtopic:
            # Update current subtopic
            self.user_learning_path.current_subtopic = next_subtopic
            await sync_to_async(self.user_learning_path.save)()
            
            # Get learning objectives for the new subtopic
            learning_objectives = await sync_to_async(lambda: next_subtopic.learning_objectives)()
            
            # Create progress entry for new subtopic with initialized remaining_points
            await sync_to_async(
                SubtopicProgress.objects.get_or_create
            )(
                user_path=self.user_learning_path,
                subtopic=next_subtopic,
                defaults={
                    'status': 'learning',
                    'started_at': timezone.now(),
                    'remaining_points': learning_objectives,
                    'covered_points': []
                }
            )
            
            return {
                'moved': True,
                'completed_subtopic': current_subtopic.name,
                'new_subtopic': next_subtopic.name,
                'new_subtopic_description': next_subtopic.description
            }
        else:
            # No more subtopics - learning path completed!
            self.user_learning_path.completed_at = timezone.now()
            self.user_learning_path.is_active = False
            await sync_to_async(self.user_learning_path.save)()
            
            return {
                'moved': False,
                'completed_subtopic': current_subtopic.name,
                'learning_path_completed': True
            }
    
    async def generate_summary(self, conversation):
        """
        Generate and save a summary of the learning path conversation.
        Includes learning progress and key concepts covered.
        """
        # Get learning context for richer summary
        # learning_context = await generate_learning_context(self.user_learning_path)
        
        # Get recent conversation messages
        messages = await sync_to_async(
            lambda: list(Message.objects.filter(conversation=conversation).order_by('-created_at')[:10])
        )()
        
        # Build conversation context
        conversation_text = "\n".join([
            f"{msg.sender}: {msg.content}" 
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
            last_message=last_message,

        )
