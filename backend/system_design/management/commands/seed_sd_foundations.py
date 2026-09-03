from django.core.management.base import BaseCommand
from datetime import timedelta
from system_design.models import SDCourse, SDLesson
from system_design.utils.diagram_kinds import infer_kind


class Command(BaseCommand):
    help = 'Seed the "System Design Foundations" course (the 5-phase thinking protocol used in interviews)'

    def handle(self, *args, **options):
        created_any = False

        course, created = SDCourse.objects.get_or_create(
            name="System Design Foundations",
            defaults={
                "description": "Your thinking system for system design interviews: a 5-phase protocol (Clarify → Estimate → Components → High-Level Design → Deep Dives) that turns a blank page into a structured answer. Learn the ritual, then practice it until it's automatic.",
                "order": 0,
            },
        )
        if created:
            created_any = True
            self.stdout.write(f"Created course: {course.name}")

        lessons = [
            {
                "name": "The 5-Phase Thinking Protocol",
                "description": "Before any diagram or deep-dive, you run a fixed mental sequence that forces structure onto a blank page. The 5 phases: (1) Clarify requirements, (2) Estimate capacity, (3) Choose core components, (4) Draw the high-level design, (5) Deep-dive the risky parts. Every phase has a scripted opening you can say out loud, even when you feel lost. Practice the order until reciting it is automatic.",
                "order": 1,
                "objectives": [
                    "Memorize the 5 phases in order: Clarify, Estimate, Components, High-Level Design, Deep Dives",
                    "Explain why clarifying questions come before any architecture discussion",
                    "Recite the scripted opening line for starting an unknown system design question",
                    "Understand that phases 1-3 require zero prior knowledge — they are templates",
                    "Complete at least one full verbal walk-through in order",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "start", "type": "input", "position": {"x": 0, "y": 180}, "data": {"label": "Blank page / question"}},
                        {"id": "p1", "type": "default", "position": {"x": 250, "y": 0}, "data": {"label": "1. Clarify requirements"}},
                        {"id": "p2", "type": "default", "position": {"x": 250, "y": 120}, "data": {"label": "2. Estimate capacity"}},
                        {"id": "p3", "type": "default", "position": {"x": 250, "y": 240}, "data": {"label": "3. Choose components"}},
                        {"id": "p4", "type": "default", "position": {"x": 250, "y": 360}, "data": {"label": "4. High-level design"}},
                        {"id": "p5", "type": "output", "position": {"x": 520, "y": 180}, "data": {"label": "5. Deep dives & trade-offs"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "start", "target": "p1"},
                        {"id": "e2", "source": "p1", "target": "p2", "label": "in order"},
                        {"id": "e3", "source": "p2", "target": "p3"},
                        {"id": "e4", "source": "p3", "target": "p4"},
                        {"id": "e5", "source": "p4", "target": "p5"},
                    ],
                },
            },
            {
                "name": "Phase 1: Clarify Requirements",
                "description": "You never design before you understand the problem. Open with: 'Let me make sure I understand the requirements. Can you walk me through the main user flows?' Then pin down: WHO uses it, WHAT the core actions are, and HOW it is used (frequency, volume). The 5 clarifiers: (1) the 2-3 core features, (2) scale now vs in 2 years, (3) read-write ratio, (4) consistency vs availability preference, (5) non-functional needs (latency, durability). Write the requirement list down — it becomes your skeleton.",
                "order": 2,
                "objectives": [
                    "Recite the scripted clarifying opening verbatim",
                    "List the 5 clarifiers and what each one pins down",
                    "Distinguish functional requirements from non-functional ones",
                    "Ask about scale and read-write ratio before offering a design",
                    "Produce a written requirements summary for a given prompt",
                ],
            },
            {
                "name": "Phase 2: Estimate Capacity",
                "description": "The back-of-envelope numbers that make a design defensible. The ritual: DAU (daily active users) → requests per user per day → QPS (queries per second) → peak QPS (x5) → storage per record → total storage per month/year → bandwidth if relevant. Use rounded numbers (100M users → 50M DAU → 1B requests/day → ~10k QPS → ~50k peak). You do not need rocket science — order-of-magnitude math under 30 seconds is the skill. These numbers decide which components you will even need.",
                "order": 3,
                "objectives": [
                    "Recite the capacity-estimation sequence: DAU → requests/day → QPS → peak → storage",
                    "Convert daily numbers to QPS with the 100k-second rule",
                    "Estimate storage for a record type and project months of growth",
                    "Use the estimate to justify whether you need a cache or queue",
                    "Complete an estimate for a sample prompt in under 2 minutes",
                ],
            },
            {
                "name": "Phase 3: Choose Core Components",
                "description": "You are not inventing architecture — you are picking from a palette of ~10 proven components. The mental model: a component exists to solve a job. Load Balancer (spread traffic), App Server (compute, stateless), Cache (fast reads), Database (source of truth; SQL vs NoSQL), Message Queue (async, decoupled work), Object Storage / CDN (blobs, static content), Search (index + query), Analytics (batch processing). Rule of thumb: start minimal — Client → LB → App Server → DB — then add cache/queue/CDN only when your Phase-2 numbers demand it. If the design fits in your head with 4-6 components, that is correct.",
                "order": 4,
                "objectives": [
                    "Name the job of each core component: LB, app server, cache, DB, queue, CDN, object storage, search",
                    "Start with the minimal skeleton: Client → LB → App Server → DB",
                    "Add cache, queue, or CDN only when capacity numbers justify them",
                    "Decide SQL vs NoSQL from the write/read patterns and data shape",
                    "Justify each component choice in one sentence",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "client", "type": "input", "position": {"x": 0, "y": 180}, "data": {"label": "Client"}},
                        {"id": "lb", "type": "default", "position": {"x": 250, "y": 180}, "data": {"label": "Load Balancer"}},
                        {"id": "app", "type": "default", "position": {"x": 500, "y": 180}, "data": {"label": "App Servers (stateless)"}},
                        {"id": "cache", "type": "default", "position": {"x": 750, "y": 40}, "data": {"label": "Cache (Redis)"}},
                        {"id": "db", "type": "output", "position": {"x": 750, "y": 320}, "data": {"label": "Database"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "client", "target": "lb", "label": "HTTPS"},
                        {"id": "e2", "source": "lb", "target": "app"},
                        {"id": "e3", "source": "app", "target": "cache", "label": "hot reads"},
                        {"id": "e4", "source": "app", "target": "db", "label": "source of truth"},
                    ],
                },
            },
            {
                "name": "Phase 4: High-Level Design",
                "description": "Now you draw. Connect the components you chose into a box-and-arrow flow from left (clients) to right (data). The ritual: draw the happy path first (request → LB → app → DB → response), then annotate with cache/queue/CDN alongside. As you draw, say one sentence per component explaining its job — this is what interviewers listen for. Keep the picture small and clean: 5-8 nodes, arrows labeled with the noun (HTTPS, writes, reads). A high-level design you cannot explain in 60 seconds is too complicated.",
                "order": 5,
                "objectives": [
                    "Draw the happy-path flow: Client → LB → App → DB → response",
                    "Label arrow edges with the noun of the interaction (HTTPS, reads, writes)",
                    "Explain every component on the board in one sentence",
                    "Place cache / queue / CDN as justified additions, not defaults",
                    "Summarize the full diagram verbally in under 60 seconds",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "client", "type": "input", "position": {"x": 0, "y": 180}, "data": {"label": "Client"}},
                        {"id": "lb", "type": "default", "position": {"x": 250, "y": 180}, "data": {"label": "Load Balancer"}},
                        {"id": "app", "type": "default", "position": {"x": 500, "y": 180}, "data": {"label": "App Servers"}},
                        {"id": "cache", "type": "default", "position": {"x": 750, "y": 40}, "data": {"label": "Cache"}},
                        {"id": "queue", "type": "default", "position": {"x": 750, "y": 320}, "data": {"label": "Queue"}},
                        {"id": "db", "type": "output", "position": {"x": 1000, "y": 180}, "data": {"label": "Primary DB"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "client", "target": "lb", "label": "HTTPS"},
                        {"id": "e2", "source": "lb", "target": "app"},
                        {"id": "e3", "source": "app", "target": "cache", "label": "reads"},
                        {"id": "e4", "source": "app", "target": "queue", "label": "async work"},
                        {"id": "e5", "source": "app", "target": "db", "label": "writes"},
                        {"id": "e6", "source": "db", "target": "app", "label": "reads"},
                    ],
                },
            },
            {
                "name": "Phase 5: Deep Dives & Trade-offs",
                "description": "The interview ends here: the interviewer picks one risky area and asks 'what if'. Be ready to handle the classics: DB failure (retries, failover, replicas), traffic spikes (horizontal scaling, cache, queue backpressure), data loss (durability, backups, replication sync/async), latency (async processing, caching, CDN), single point of failure (redundancy at every tier). The honest fallback that NEVER fails you: 'I don't know that off the top of my head, but here is how I would investigate: first I'd...' Then name 2 concrete diagnostic steps. Cover the risk you'd least want to fail, and state your trade-off as a sentence: 'We chose X over Y because of Z.'",
                "order": 6,
                "objectives": [
                    "List the 4 classic deep-dive areas: failure, spike, data loss, latency",
                    "Recite the honest fallback script for questions you cannot answer",
                    "Describe redundancy and failover for the main components",
                    "State a trade-off as 'We chose X over Y because of Z'",
                    "Answer a 'what if' about the riskiest component in the design",
                ],
            },
            {
                "name": "Rehearsal: A Full Walk-Through",
                "description": "Put the whole protocol together on one worked example: 'Design a URL shortener.' Watch each phase fire in order — clarify (hash? analytics? expiry? scale), estimate (50M new/year → ~16 writes/s, 500x reads → ~8k QPS), components (LB, app, DB, cache), high-level (the flows you just built), deep dive (hash collision, cache stampede, analytics reads). Your goal: narrate all 5 phases end-to-end out loud, then rebuild the story for 'Design a news feed' without prompting. This is the rehearsal that makes the protocol automatic.",
                "order": 7,
                "objectives": [
                    "Narrate a full URL-shortener design across all 5 phases",
                    "Narrate a full news-feed design across all 5 phases",
                    "Move between phases smoothly without being prompted",
                    "Identify which phase you rush or freeze on, and slow it down",
                    "Complete the course ready to rehearse on any prompt",
                ],
                "reference_diagram": {
                    "nodes": [
                        {"id": "client", "type": "input", "position": {"x": 0, "y": 180}, "data": {"label": "Client"}},
                        {"id": "lb", "type": "default", "position": {"x": 250, "y": 180}, "data": {"label": "Load Balancer"}},
                        {"id": "app", "type": "default", "position": {"x": 500, "y": 180}, "data": {"label": "App Servers"}},
                        {"id": "cache", "type": "default", "position": {"x": 750, "y": 60}, "data": {"label": "Cache (hot URLs)"}},
                        {"id": "db", "type": "output", "position": {"x": 750, "y": 300}, "data": {"label": "URL Database"}},
                    ],
                    "edges": [
                        {"id": "e1", "source": "client", "target": "lb"},
                        {"id": "e2", "source": "lb", "target": "app"},
                        {"id": "e3", "source": "app", "target": "cache", "label": "reads"},
                        {"id": "e4", "source": "app", "target": "db", "label": "writes"},
                        {"id": "e5", "source": "db", "target": "cache", "label": "populate"},
                    ],
                },
            },
        ]

        # Tag each inline diagram node with a semantic kind for rich rendering.
        for lesson_data in lessons:
            diagram = lesson_data.get("reference_diagram")
            for node in (diagram or {}).get("nodes", []):
                node.setdefault("kind", infer_kind(node.get("data", {}).get("label", "")))

        for lesson_data in lessons:
            _, created = SDLesson.objects.get_or_create(
                course=course,
                name=lesson_data["name"],
                defaults={
                    "description": lesson_data["description"],
                    "order": lesson_data["order"],
                    "learning_objectives": lesson_data["objectives"],
                    "estimated_duration": timedelta(hours=1),
                    "reference_diagram": lesson_data.get("reference_diagram"),
                },
            )
            if created:
                created_any = True
                self.stdout.write(f"  + Lesson: {lesson_data['name']}")

        if created_any:
            self.stdout.write(self.style.SUCCESS("System Design Foundations course seeded."))
        else:
            self.stdout.write(self.style.WARNING("Foundations course already seeded; nothing to do."))