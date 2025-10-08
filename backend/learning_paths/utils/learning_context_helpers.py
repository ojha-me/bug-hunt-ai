from django.db.models import Q, Count, Avg
from asgiref.sync import sync_to_async
from learning_paths.models import UserLearningPath, SubtopicProgress, LearningSubtopic
from ai_core.models import Message, Conversation
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class LearningContextGenerator:
    """
    Generates rich context for learning path AI interactions
    """
    
    def __init__(self, user_learning_path: UserLearningPath):
        self.user_learning_path = user_learning_path
    
    async def generate_full_context(self) -> Dict:
        """Generate comprehensive context for AI tutoring"""
        context = {
            "learning_profile": await self._get_learning_profile(),
            "current_progress": await self._get_current_progress(),
            "performance_patterns": await self._get_performance_patterns(),
            "conversation_context": await self._get_conversation_context(),
            "next_steps": await self._get_suggested_next_steps(),
            "emotional_indicators": await self._get_emotional_indicators()
        }
        return context
    
    async def _get_learning_profile(self) -> Dict:
        """Get student's learning profile and preferences"""
        user = await sync_to_async(lambda: self.user_learning_path.user)()
        topic = await sync_to_async(lambda: self.user_learning_path.topic)()
        
        return {
            "topic_name": topic.name,
            "topic_description": topic.description,
            "difficulty_level": topic.difficulty_level,
            "estimated_duration": str(topic.estimated_duration),
            "user_email": user.email,
            "started_at": self.user_learning_path.started_at.isoformat(),
            "is_active": self.user_learning_path.is_active
        }
    
    async def _get_current_progress(self) -> Dict:
        """Get detailed current progress information"""
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        
        progress_records = await sync_to_async(list)(
            SubtopicProgress.objects.filter(
                user_path=self.user_learning_path
            ).select_related('subtopic').order_by('subtopic__order')
        )
        
        progress_summary = []
        for progress in progress_records:
            progress_summary.append({
                "subtopic_name": progress.subtopic.name,
                "status": progress.status,
                "started_at": progress.started_at.isoformat() if progress.started_at else None,
                "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
                "challenges_completed": progress.challenges_completed,
                "challenges_attempted": progress.challenges_attempted,
                "success_rate": progress.challenge_success_rate,
                "notes": progress.notes
            })
        
        progress_percentage = await sync_to_async(lambda: self.user_learning_path.progress_percentage)()
        is_completed = await sync_to_async(lambda: self.user_learning_path.is_completed)()
        
        return {
            "current_subtopic": {
                "name": current_subtopic.name if current_subtopic else None,
                "description": current_subtopic.description if current_subtopic else None,
                "learning_objectives": current_subtopic.learning_objectives if current_subtopic else [],
                "order": current_subtopic.order if current_subtopic else None
            },
            "overall_progress_percentage": progress_percentage,
            "is_completed": is_completed,
            "subtopic_progress": progress_summary
        }
    
    async def _get_performance_patterns(self) -> Dict:
        """Analyze learning patterns and performance trends"""
        progress_records = await sync_to_async(list)(
            SubtopicProgress.objects.filter(
                user_path=self.user_learning_path,
                started_at__isnull=False
            ).order_by('started_at')
        )
        
        if not progress_records:
            return {
                "pattern": "insufficient_data",
                "learning_pace": "just_started",
                "overall_success_rate": 0,
                "completed_subtopics": 0,
                "total_subtopics": 0,
                "struggling_areas": [],
                "days_active": 0
            }
        
        completed_count = len([p for p in progress_records if p.status == 'completed'])
        total_time = (datetime.now() - self.user_learning_path.started_at.replace(tzinfo=None)).days
        
        total_challenges = sum(p.challenges_attempted for p in progress_records)
        total_successes = sum(p.challenges_completed for p in progress_records)
        avg_success_rate = (total_successes / total_challenges * 100) if total_challenges > 0 else 0
        
        struggling_subtopics = [
            p.subtopic.name for p in progress_records 
            if p.challenge_success_rate < 50 and p.challenges_attempted > 0
        ]
        
        if completed_count == 0:
            pace = "just_started"
        elif total_time == 0:
            pace = "very_fast"
        else:
            completion_rate = completed_count / total_time
            if completion_rate > 1:
                pace = "fast"
            elif completion_rate > 0.5:
                pace = "steady"
            else:
                pace = "slow"
        
        return {
            "learning_pace": pace,
            "overall_success_rate": round(avg_success_rate, 2),
            "completed_subtopics": completed_count,
            "total_subtopics": len(progress_records),
            "struggling_areas": struggling_subtopics,
            "days_active": total_time,
            "pattern": self._identify_learning_pattern(progress_records)
        }
    
    def _identify_learning_pattern(self, progress_records: List) -> str:
        """Identify the student's learning pattern"""
        if len(progress_records) < 3:
            return "insufficient_data"
        
        recent_records = progress_records[-3:]
        success_rates = [p.challenge_success_rate for p in recent_records if p.challenges_attempted > 0]
        
        if not success_rates:
            return "theory_focused"
        
        avg_recent_success = sum(success_rates) / len(success_rates)
        
        if avg_recent_success > 80:
            return "high_achiever"
        elif avg_recent_success > 60:
            return "steady_learner"
        elif avg_recent_success > 40:
            return "needs_support"
        else:
            return "struggling"
    
    async def _get_conversation_context(self) -> Dict:
        """Get recent conversation context for continuity"""
        conversation = await sync_to_async(lambda: self.user_learning_path.conversation)()
        
        recent_messages = await sync_to_async(list)(
            Message.objects.filter(
                conversation=conversation
            ).order_by('-created_at')[:10]
        )
        
        if not recent_messages:
            return {"recent_messages": [], "conversation_tone": "new"}
        
        recent_messages.reverse()
        
        message_summary = []
        for msg in recent_messages:
            message_summary.append({
                "sender": msg.sender,
                "content": msg.content[:200] + "..." if len(msg.content) > 200 else msg.content,
                "created_at": msg.created_at.isoformat(),
                "has_code": bool(msg.code_snippet)
            })
        
        user_messages = [msg for msg in recent_messages if msg.sender == 'user']
        if user_messages:
            last_user_message = user_messages[-1].content.lower()
            if any(word in last_user_message for word in ['confused', 'don\'t understand', 'stuck', 'help']):
                tone = "needs_help"
            elif any(word in last_user_message for word in ['got it', 'understand', 'clear', 'thanks']):
                tone = "confident"
            else:
                tone = "neutral"
        else:
            tone = "new"
        
        return {
            "recent_messages": message_summary,
            "conversation_tone": tone,
            "message_count": len(recent_messages)
        }
    
    async def _get_suggested_next_steps(self) -> Dict:
        """Determine appropriate next steps based on progress"""
        current_subtopic = await sync_to_async(lambda: self.user_learning_path.current_subtopic)()
        topic = await sync_to_async(lambda: self.user_learning_path.topic)()
        
        if not current_subtopic:
            first_subtopic = await sync_to_async(
                lambda: topic.subtopics.filter(is_active=True).order_by('order').first()
            )()
            
            return {
                "action": "start_learning_path",
                "next_subtopic": first_subtopic.name if first_subtopic else None,
                "recommendation": "Begin with topic introduction and first subtopic"
            }
        
        current_progress = await sync_to_async(
            lambda: SubtopicProgress.objects.filter(
                user_path=self.user_learning_path,
                subtopic=current_subtopic
            ).first()
        )()
        
        if not current_progress or current_progress.status == 'not_started':
            return {
                "action": "introduce_subtopic",
                "current_subtopic": current_subtopic.name,
                "recommendation": "Introduce current subtopic and assess prior knowledge"
            }
        elif current_progress.status == 'learning':
            return {
                "action": "continue_learning",
                "current_subtopic": current_subtopic.name,
                "recommendation": "Continue with current subtopic content and exercises"
            }
        elif current_progress.status == 'challenging':
            return {
                "action": "provide_challenges",
                "current_subtopic": current_subtopic.name,
                "recommendation": "Provide practice challenges and assess mastery"
            }
        elif current_progress.status == 'completed':
            next_subtopic = await sync_to_async(
                lambda: topic.subtopics.filter(
                    is_active=True,
                    order__gt=current_subtopic.order
                ).order_by('order').first()
            )()
            
            if next_subtopic:
                return {
                    "action": "advance_to_next",
                    "next_subtopic": next_subtopic.name,
                    "recommendation": "Advance to next subtopic in learning path"
                }
            else:
                return {
                    "action": "complete_topic",
                    "recommendation": "Congratulate completion and suggest next topic"
                }
        
        return {
            "action": "assess_progress",
            "recommendation": "Assess current understanding and determine next steps"
        }
    
    async def _get_emotional_indicators(self) -> Dict:
        """Detect emotional state indicators from recent interactions"""
        conversation = await sync_to_async(lambda: self.user_learning_path.conversation)()
        
        recent_messages = await sync_to_async(list)(
            Message.objects.filter(
                conversation=conversation,
                sender='user'
            ).order_by('-created_at')[:5]
        )
        
        if not recent_messages:
            return {"emotional_state": "neutral", "indicators": []}
        
        frustration_words = ['frustrated', 'confused', 'stuck', 'don\'t get it', 'hard', 'difficult']
        confidence_words = ['got it', 'understand', 'clear', 'easy', 'makes sense']
        engagement_words = ['interesting', 'cool', 'awesome', 'love', 'like']
        
        indicators = []
        emotional_state = "neutral"
        
        for msg in recent_messages:
            content_lower = msg.content.lower()
            
            if any(word in content_lower for word in frustration_words):
                indicators.append("frustration")
                emotional_state = "frustrated"
            elif any(word in content_lower for word in confidence_words):
                indicators.append("confidence")
                if emotional_state == "neutral":
                    emotional_state = "confident"
            elif any(word in content_lower for word in engagement_words):
                indicators.append("engagement")
                if emotional_state == "neutral":
                    emotional_state = "engaged"
        
        if len(recent_messages) >= 3:
            time_diff = (recent_messages[0].created_at - recent_messages[2].created_at).total_seconds()
            if time_diff < 300:  
                indicators.append("high_engagement")
        
        return {
            "emotional_state": emotional_state,
            "indicators": list(set(indicators)),
            "recent_activity_level": "high" if len(recent_messages) >= 3 else "moderate"
        }


async def generate_learning_context(user_learning_path: UserLearningPath) -> str:
    """
    Main function to generate context for learning path AI
    """
    generator = LearningContextGenerator(user_learning_path)
    context = await generator.generate_full_context()
    
    formatted_context = f"""
Learning Context Summary:
- Student: {context['learning_profile']['user_email']}
- Topic: {context['learning_profile']['topic_name']} ({context['learning_profile']['difficulty_level']})
- Progress: {context['current_progress']['overall_progress_percentage']:.1f}% complete
- Current Subtopic: {context['current_progress']['current_subtopic']['name'] or 'Not started'}
- Learning Pattern: {context['performance_patterns']['pattern']}
- Success Rate: {context['performance_patterns']['overall_success_rate']}%
- Emotional State: {context['emotional_indicators']['emotional_state']}
- Recommended Action: {context['next_steps']['action']}

Recent Conversation Tone: {context['conversation_context']['conversation_tone']}
Struggling Areas: {', '.join(context['performance_patterns']['struggling_areas']) or 'None identified'}
"""
    
    return formatted_context.strip()
