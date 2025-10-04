import uuid
from datetime import timedelta
from learning_paths.models import LearningTopic, LearningSubtopic
from users.models import CustomUser

class LearningPathSaver:
    @staticmethod
    def save_learning_path(data: dict, user: CustomUser) -> LearningTopic:
        """
        Save AI-generated topic and subtopics into DB.
        Returns the created LearningTopic.
        """
        topic_data = data["topic"]

        topic = LearningTopic.objects.create(
            id=uuid.uuid4(),
            name=topic_data["name"],
            description=topic_data["description"],
            difficulty_level=topic_data["difficulty_level"].upper(),
            estimated_duration=timedelta(
                seconds=LearningPathSaver._parse_duration(topic_data["estimated_duration"])
            ),
            is_active=True,
            created_by=user
        )

        subtopics = []
        for sub in data["subtopics"]:
            subtopics.append(
                LearningSubtopic(
                    id=uuid.uuid4(),
                    topic=topic,
                    name=sub["name"],
                    description=sub["description"],
                    order=sub["order"],
                    learning_objectives=sub["learning_objectives"],
                    estimated_duration=timedelta(
                        seconds=LearningPathSaver._parse_duration(sub["estimated_duration"])
                    ),
                    is_active=True,
                )
            )

        LearningSubtopic.objects.bulk_create(subtopics)
        return topic

    @staticmethod
    def _parse_duration(duration_str: str) -> int:
        """
        Convert "HH:MM:SS" into total seconds.
        """
        hours, minutes, seconds = map(int, duration_str.split(":"))
        return hours * 3600 + minutes * 60 + seconds
