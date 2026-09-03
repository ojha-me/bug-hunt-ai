from django.core.management.base import BaseCommand
from datetime import timedelta
from system_design.models import SDCourse, SDLesson
from system_design.utils.diagram_kinds import infer_kind


class Command(BaseCommand):
    help = 'Seed the System Design learning curriculum (courses + lessons with reference diagrams)'

    def handle(self, *args, **options):
        created_any = False

        # ---------------- Course 1: Fundamentals ----------------
        fundamentals, created = SDCourse.objects.get_or_create(
            name="Fundamentals",
            defaults={
                "description": "The core building blocks every system design is made of — how traffic flows, how compute scales, how data is stored and cached, and how services stay reliable.",
                "order": 1,
            },
        )
        if created:
            created_any = True
            self.stdout.write(f"Created course: {fundamentals.name}")

        fundamentals_lessons = [
            {
                "name": "Clients, DNS, CDN & Load Balancers",
                "description": "The edge of a system: how requests get from a user's browser to your servers.",
                "order": 1,
                "objectives": [
                    "Explain how DNS resolves a domain to an IP",
                    "Describe what a CDN is and when to use one",
                    "Explain load balancer roles and L4 vs L7",
                    "Understand reverse proxies in front of servers",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "user", "type": "input", "position": {"x": 0, "y": 180}, "data": {"label": "User / Client"}},
                        {"id": "dns", "type": "default", "position": {"x": 250, "y": 0}, "data": {"label": "DNS"}},
                        {"id": "cdn", "type": "default", "position": {"x": 250, "y": 360}, "data": {"label": "CDN (static)"}},
                        {"id": "lb", "type": "default", "position": {"x": 500, "y": 180}, "data": {"label": "Load Balancer"}},
                        {"id": "server", "type": "output", "position": {"x": 750, "y": 90}, "data": {"label": "App Servers"}},
                        {"id": "backup", "type": "output", "position": {"x": 750, "y": 270}, "data": {"label": "App Servers (backup)"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "user", "target": "dns", "label": "Domain lookup"},
                        {"id": "e2", "source": "user", "target": "cdn", "label": "Static content"},
                        {"id": "e3", "source": "user", "target": "lb", "label": "HTTPS"},
                        {"id": "e4", "source": "lb", "target": "server", "label": "route"},
                        {"id": "e5", "source": "lb", "target": "backup", "label": "failover"},
                    ],
                },
            },
            {
                "name": "App Servers & Compute",
                "description": "Stateless vs stateful services, and how you scale compute horizontally.",
                "order": 2,
                "objectives": [
                    "Explain stateless vs stateful servers",
                    "Describe vertical vs horizontal scaling",
                    "Understand the stateless server + shared state pattern",
                    "Know when to split a monolith into services",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "lb", "type": "input", "position": {"x": 0, "y": 200}, "data": {"label": "Load Balancer"}},
                        {"id": "s1", "type": "default", "position": {"x": 300, "y": 60}, "data": {"label": "App Server 1 (stateless)"}},
                        {"id": "s2", "type": "default", "position": {"x": 300, "y": 220}, "data": {"label": "App Server 2 (stateless)"}},
                        {"id": "s3", "type": "default", "position": {"x": 300, "y": 380}, "data": {"label": "App Server 3 (stateless)"}},
                        {"id": "shared", "type": "output", "position": {"x": 600, "y": 200}, "data": {"label": "Shared State (DB / Redis)"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "lb", "target": "s1"},
                        {"id": "e2", "source": "lb", "target": "s2"},
                        {"id": "e3", "source": "lb", "target": "s3"},
                        {"id": "e4", "source": "s1", "target": "shared", "label": "session/state"},
                        {"id": "e5", "source": "s2", "target": "shared"},
                        {"id": "e6", "source": "s3", "target": "shared"},
                    ],
                },
            },
            {
                "name": "Data Storage: SQL, NoSQL & Replication",
                "description": "Choosing databases, keeping data safe, and speeding up queries.",
                "order": 3,
                "objectives": [
                    "Compare SQL vs NoSQL and when to choose each",
                    "Understand primary/secondary replication",
                    "Explain basic sharding and partition keys",
                    "Know what an index is and why it speeds up reads",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "app", "type": "input", "position": {"x": 0, "y": 200}, "data": {"label": "App Server"}},
                        {"id": "primary", "type": "default", "position": {"x": 300, "y": 90}, "data": {"label": "Primary DB"}},
                        {"id": "replica", "type": "default", "position": {"x": 300, "y": 310}, "data": {"label": "Read Replica"}},
                        {"id": "cache", "type": "output", "position": {"x": 600, "y": 200}, "data": {"label": "Cache / Shard"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "app", "target": "primary", "label": "writes"},
                        {"id": "e2", "source": "primary", "target": "replica", "label": "replication"},
                        {"id": "e3", "source": "app", "target": "replica", "label": "reads"},
                        {"id": "e4", "source": "app", "target": "cache", "label": "hot reads"},
                    ],
                },
            },
            {
                "name": "Caching",
                "description": "Making reads fast by storing results close to the action.",
                "order": 4,
                "objectives": [
                    "Understand cache-aside, read-through, write-through",
                    "Explain cache invalidation and stale-data problems",
                    "Know eviction policies like LRU/LFU",
                    "Describe Redis use cases beyond caching",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "client", "type": "input", "position": {"x": 0, "y": 200}, "data": {"label": "Client"}},
                        {"id": "app", "type": "default", "position": {"x": 300, "y": 200}, "data": {"label": "App Server"}},
                        {"id": "cache", "type": "default", "position": {"x": 550, "y": 60}, "data": {"label": "Cache (Redis)"}},
                        {"id": "db", "type": "output", "position": {"x": 550, "y": 340}, "data": {"label": "Database"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "client", "target": "app"},
                        {"id": "e2", "source": "app", "target": "cache", "label": "check/read"},
                        {"id": "e3", "source": "app", "target": "db", "label": "miss → load"},
                        {"id": "e4", "source": "db", "target": "cache", "label": "populate"},
                    ],
                },
            },
            {
                "name": "Async, Message Queues & Event-Driven Design",
                "description": "Decoupling services with queues and events.",
                "order": 5,
                "objectives": [
                    "Explain why and when to use a message queue",
                    "Understand pub/sub and event-driven architecture",
                    "Know the idempotency problem and how to handle retries",
                    "Describe at-least-once vs exactly-once delivery",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "producer", "type": "input", "position": {"x": 0, "y": 180}, "data": {"label": "API Service"}},
                        {"id": "queue", "type": "default", "position": {"x": 300, "y": 180}, "data": {"label": "Message Queue (Kafka)"}},
                        {"id": "w1", "type": "default", "position": {"x": 600, "y": 60}, "data": {"label": "Worker 1"}},
                        {"id": "w2", "type": "default", "position": {"x": 600, "y": 300}, "data": {"label": "Worker 2"}},
                        {"id": "fanout", "type": "output", "position": {"x": 880, "y": 180}, "data": {"label": "Downstream Services"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "producer", "target": "queue", "label": "publish"},
                        {"id": "e2", "source": "queue", "target": "w1", "label": "consume"},
                        {"id": "e3", "source": "queue", "target": "w2", "label": "consume"},
                        {"id": "e4", "source": "w1", "target": "fanout"},
                        {"id": "e5", "source": "w2", "target": "fanout"},
                    ],
                },
            },
            {
                "name": "Reliability, Monitoring & Capacity Estimation",
                "description": "Keeping systems available, observable, and sized correctly.",
                "order": 6,
                "objectives": [
                    "Estimate QPS, bandwidth, and storage from rough numbers",
                    "Understand redundancy, failover, and health checks",
                    "Know rate limiting, backpressure, and circuit breakers",
                    "Describe metrics, logs, tracing, and alerts",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "lb", "type": "input", "position": {"x": 0, "y": 200}, "data": {"label": "Load Balancer"}},
                        {"id": "s1", "type": "default", "position": {"x": 300, "y": 90}, "data": {"label": "Server 1"}},
                        {"id": "s2", "type": "default", "position": {"x": 300, "y": 310}, "data": {"label": "Server 2"}},
                        {"id": "metrics", "type": "output", "position": {"x": 620, "y": 90}, "data": {"label": "Metrics / Alerts"}},
                        {"id": "logs", "type": "output", "position": {"x": 620, "y": 310}, "data": {"label": "Logs / Tracing"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "lb", "target": "s1"},
                        {"id": "e2", "source": "lb", "target": "s2"},
                        {"id": "e3", "source": "s1", "target": "metrics", "label": "health"},
                        {"id": "e4", "source": "s2", "target": "metrics"},
                        {"id": "e5", "source": "s1", "target": "logs"},
                        {"id": "e6", "source": "s2", "target": "logs"},
                    ],
                },
            },
            {
                "name": "Putting It Together: A Full Design",
                "description": "Combine everything into a complete architecture you can draw and defend.",
                "order": 7,
                "objectives": [
                    "Walk through requirements and clarifying questions",
                    "Produce a high-level box-and-arrow architecture",
                    "Discuss trade-offs and deep-dive the risky component",
                    "Present capacity numbers that back up the design",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "client", "type": "input", "position": {"x": 0, "y": 200}, "data": {"label": "Client"}},
                        {"id": "lb", "type": "default", "position": {"x": 250, "y": 200}, "data": {"label": "Load Balancer"}},
                        {"id": "app", "type": "default", "position": {"x": 500, "y": 200}, "data": {"label": "App Servers"}},
                        {"id": "cache", "type": "default", "position": {"x": 750, "y": 60}, "data": {"label": "Cache"}},
                        {"id": "queue", "type": "default", "position": {"x": 750, "y": 340}, "data": {"label": "Queue"}},
                        {"id": "db", "type": "output", "position": {"x": 1000, "y": 200}, "data": {"label": "Primary DB"}},
                        {"id": "replica", "type": "output", "position": {"x": 1000, "y": 380}, "data": {"label": "Read Replica"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "client", "target": "lb"},
                        {"id": "e2", "source": "lb", "target": "app"},
                        {"id": "e3", "source": "app", "target": "cache"},
                        {"id": "e4", "source": "app", "target": "queue"},
                        {"id": "e5", "source": "app", "target": "db", "label": "writes"},
                        {"id": "e6", "source": "db", "target": "replica", "label": "replication"},
                    ],
                },
            },
        ]

        # Tag each inline diagram node with a semantic kind for rich rendering.
        for lesson_data in fundamentals_lessons:
            diagram = lesson_data.get("reference_diagram")
            for node in (diagram or {}).get("nodes", []):
                node.setdefault("kind", infer_kind(node.get("data", {}).get("label", "")))

        for lesson_data in fundamentals_lessons:
            _, created = SDLesson.objects.get_or_create(
                course=fundamentals,
                name=lesson_data["name"],
                defaults={
                    "description": lesson_data["description"],
                    "order": lesson_data["order"],
                    "learning_objectives": lesson_data["objectives"],
                    "estimated_duration": timedelta(hours=3),
                    "reference_diagram": lesson_data["reference_diagram"],
                },
            )
            if created:
                created_any = True
                self.stdout.write(f"  + Lesson: {lesson_data['name']}")

        if created_any:
            self.stdout.write(self.style.SUCCESS("System Design curriculum seeded."))
        else:
            self.stdout.write(self.style.WARNING("Curriculum already seeded; nothing to do."))