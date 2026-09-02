from django.core.management.base import BaseCommand
from datetime import timedelta
from learning_paths.models import LearningTopic, LearningSubtopic, DifficultyLevelChoices
from users.models import CustomUser


class Command(BaseCommand):
    help = 'Create the System Design Fundamentals learning topic and subtopics'

    def handle(self, *args, **options):
        topic_name = "System Design Fundamentals"

        if LearningTopic.objects.filter(name=topic_name).exists():
            self.stdout.write(self.style.WARNING(
                f'Topic "{topic_name}" already exists. Skipping creation.'
            ))
            return

        creator = CustomUser.objects.first()
        if creator is None:
            self.stdout.write(self.style.ERROR('No user found to set as created_by.'))
            return

        topic = LearningTopic.objects.create(
            name=topic_name,
            description=(
                "Learn how large-scale systems actually work. Walk through the core building blocks "
                "of system design — clients & edge, compute, data storage, caching, async & queues, "
                "and reliability & scaling — then apply them to classic interview problems."
            ),
            difficulty_level=DifficultyLevelChoices.BEGINNER,
            estimated_duration=timedelta(hours=24),
            created_by=creator,
        )

        subtopics = [
            {
                'name': 'Clients, DNS, CDN & Load Balancers',
                'description': 'The edge of a system: how traffic gets from users to your servers.',
                'order': 1,
                'learning_objectives': [
                    'Understand web/mobile clients and how DNS resolves domains',
                    'Explain what a CDN is and when to use one',
                    'Describe what a load balancer does and the difference between L4 and L7',
                    'Understand reverse proxies and why they sit in front of servers'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'App Servers & Compute',
                'description': 'Stateless vs stateful services, and scaling your compute tier.',
                'order': 2,
                'learning_objectives': [
                    'Explain stateless vs stateful servers and why stateless scales better',
                    'Describe vertical vs horizontal scaling and the limits of each',
                    'Understand the stateless server + shared state (e.g. Redis/DB) pattern',
                    'Know when to split a monolith into services'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Data Storage: SQL, NoSQL & Replication',
                'description': 'Choosing databases and keeping data safe and fast.',
                'order': 3,
                'learning_objectives': [
                    'Compare SQL vs NoSQL and when to choose each',
                    'Understand primary/secondary replication and reads vs writes',
                    'Explain basic sharding and partition keys',
                    'Know what an index is and why it speeds up queries'
                ],
                'estimated_duration': timedelta(hours=4)
            },
            {
                'name': 'Caching',
                'description': 'Making reads fast by storing results close to the action.',
                'order': 4,
                'learning_objectives': [
                    'Understand cache-aside, read-through, and write-through strategies',
                    'Explain cache invalidation and the stale-data problem',
                    'Know eviction policies like LRU/LFU',
                    'Describe what Redis is used for beyond caching (sessions, counters)'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Async, Message Queues & Event-Driven Design',
                'description': 'Decoupling services with queues and events.',
                'order': 5,
                'learning_objectives': [
                    'Explain why and when to use a message queue (e.g. Kafka, SQS)',
                    'Understand pub/sub and event-driven architecture',
                    'Know the idempotency problem and how to handle retries',
                    'Describe at-least-once vs exactly-once delivery and trade-offs'
                ],
                'estimated_duration': timedelta(hours=4)
            },
            {
                'name': 'Reliability, Monitoring & Capacity Estimation',
                'description': 'Keeping systems available, observable, and sized correctly.',
                'order': 6,
                'learning_objectives': [
                    'Estimate QPS, bandwidth, and storage from rough numbers',
                    'Understand redundancy, failover, and health checks',
                    'Know rate limiting, backpressure, and circuit breakers',
                    'Describe the basics of monitoring: metrics, logs, tracing, alerts'
                ],
                'estimated_duration': timedelta(hours=3)
            },
            {
                'name': 'Putting It Together: A Full Design',
                'description': 'Combine everything into a complete architecture you can draw and defend.',
                'order': 7,
                'learning_objectives': [
                    'Walk through requirements and clarifying questions for a classic system',
                    'Produce a high-level box-and-arrow architecture with load balancers, cache, DB, queues',
                    'Discuss trade-offs and deep-dive on the highest-risk component',
                    'Present capacity numbers that back up your design decisions'
                ],
                'estimated_duration': timedelta(hours=4)
            },
        ]

        for subtopic_data in subtopics:
            LearningSubtopic.objects.create(topic=topic, **subtopic_data)

        self.stdout.write(self.style.SUCCESS(
            f'Created "{topic_name}" with {len(subtopics)} subtopics.'
        ))
