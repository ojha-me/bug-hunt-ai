"""
Dynamic, per-component tutoring.

Unlike the static lesson content on the frontend, this service GENERATES a fresh
Socratic teaching session each time — grounded in a terse concept checklist per
component so it stays on-topic, but instructed to invent its own scenarios so no
two sessions read the same.
"""
import logging
from ai_core.utils.groq_llm import GroqChat

logger = logging.getLogger('ai_core.utils.component_tutor_ai')

AI_MODEL = "qwen/qwen3-32b"

# Terse grounding per component: the concepts the tutor should cover over a
# session. Deliberately short — the model supplies the scenarios and delivery.
COMPONENT_BRIEFS = {
    "client": {
        "name": "the Client (web/mobile)",
        "concepts": [
            "the client is the untrusted origin of every request",
            "server-side validation/authorization vs client convenience",
            "idempotency keys to make retries safe",
            "optimistic updates and reconciliation",
            "thick vs thin clients, offline and stale local caches",
        ],
    },
    "cdn": {
        "name": "a CDN",
        "concepts": [
            "edge PoPs caching content near users to cut latency and origin load",
            "what is safe to cache vs personalized responses",
            "cache invalidation via versioned/content-hashed URLs vs purging",
            "TTLs matched to change frequency",
            "eventual consistency between edge and origin",
        ],
    },
    "load_balancer": {
        "name": "a Load Balancer",
        "concepts": [
            "distributing traffic across interchangeable, stateless backends",
            "health checks and automatic failover",
            "L4 vs L7 routing",
            "why local session state breaks; shared state vs sticky sessions",
            "avoiding the LB itself as a single point of failure",
        ],
    },
    "api_gateway": {
        "name": "an API Gateway",
        "concepts": [
            "a single front door for cross-cutting concerns",
            "centralizing auth, rate limiting, routing",
            "why business logic must NOT live in the gateway",
            "backend-for-frontend / request aggregation",
            "avoiding the gateway as a bottleneck or god-object",
        ],
    },
    "service": {
        "name": "a stateless application Service",
        "concepts": [
            "statelessness as the enabler of horizontal scaling",
            "where state should live (shared stores, not local memory)",
            "autoscaling on CPU/RPS behind a load balancer",
            "when microservices are and aren't worth the overhead",
            "chatty inter-service calls and latency",
        ],
    },
    "worker": {
        "name": "a background Worker",
        "concepts": [
            "moving slow work off the request path via a queue",
            "at-least-once delivery forcing idempotent jobs",
            "retries with backoff and dead-letter queues",
            "backpressure and scaling on queue depth",
        ],
    },
    "database": {
        "name": "a Database (SQL vs NoSQL)",
        "concepts": [
            "choosing from access patterns, not product names",
            "ACID/joins/transactions vs horizontal scale",
            "when NoSQL's denormalization and eventual consistency pay off",
            "read replicas vs sharding, and why sharding SQL is hard",
        ],
    },
    "cache": {
        "name": "a Cache",
        "concepts": [
            "trading freshness for speed in front of the source of truth",
            "cache-aside, TTLs, LRU eviction, write-through vs delete-on-write",
            "cache invalidation and stale-read bugs",
            "cache stampedes and mitigations",
            "read skew being required for a cache to help",
        ],
    },
    "object_storage": {
        "name": "Object Storage",
        "concepts": [
            "cheap, durable, unlimited blob storage",
            "store the blob, keep only the pointer in the DB",
            "pre-signed URLs and CDN fronting",
            "not queryable/transactional; request and egress costs",
        ],
    },
    "search": {
        "name": "a Search Index",
        "concepts": [
            "inverted index vs SQL LIKE scans",
            "relevance ranking, stemming, fuzzy/typo tolerance, facets",
            "search as a secondary index synced from the DB (CDC/dual-write)",
            "indexing lag and eventual consistency",
        ],
    },
    "warehouse": {
        "name": "a Data Warehouse",
        "concepts": [
            "OLAP vs OLTP; isolating analytics from the serving DB",
            "columnar storage and why it speeds aggregation",
            "ETL/ELT and data freshness (minutes-to-hours stale)",
            "MPP and separating storage from compute",
        ],
    },
    "queue": {
        "name": "a Message Queue",
        "concepts": [
            "decoupling producers and consumers in time",
            "consumed-once semantics and at-least-once delivery",
            "idempotent consumers and dead-letter queues",
            "why a queue can't fan out or replay like a stream",
        ],
    },
    "stream": {
        "name": "an Event Stream (log)",
        "concepts": [
            "append-only log with per-consumer offsets",
            "fan-out to many independent consumers",
            "replay within a retention window",
            "per-partition ordering via partition keys",
            "when a stream is overkill vs a simple queue",
        ],
    },
    "external": {
        "name": "an External / third-party Service",
        "concepts": [
            "treating dependencies you don't control as unreliable",
            "timeouts, retries with backoff, circuit breakers",
            "graceful degradation and making non-critical calls async",
            "the adapter / anti-corruption layer",
        ],
    },
}

DEFAULT_BRIEF = {"name": "a system-design component", "concepts": ["core purpose", "trade-offs", "how it scales"]}


class ComponentTutorService:
    def __init__(self, kind: str):
        self.kind = kind
        self.brief = COMPONENT_BRIEFS.get(kind, DEFAULT_BRIEF)
        self.chat = GroqChat(model=AI_MODEL)

    def _persona(self) -> str:
        name = self.brief["name"]
        concepts = "; ".join(self.brief["concepts"])
        return (
            f"You are a sharp, encouraging system-design tutor running a focused 1:1 session on {name}.\n"
            "Teach dynamically and Socratically: present ONE concrete scenario at a time, ask the learner to "
            "reason about it, then respond to what they actually say — affirm what's right, correct "
            "misconceptions directly, and push one level deeper. Invent your own varied, specific scenarios so "
            "no two sessions are alike; avoid generic textbook framings.\n"
            f"Ground the session in these concepts (cover them naturally over the conversation, but NEVER paste "
            f"this list or lecture it verbatim): {concepts}.\n"
            "Keep every reply short and conversational — 2 to 6 sentences — and end with a question that makes "
            "the learner think. Plain prose, no markdown headings, no bullet dumps."
        )

    def generate_opening(self) -> str:
        prompt = (
            self._persona()
            + "\n\nBegin the session now. Greet the learner in one line, then set up a fresh, specific, "
            "slightly unusual scenario that motivates this component and ask them what they'd do. "
            "Do not explain the answer yet — just pose the situation and the question."
        )
        response = self.chat.send_message(message=prompt)
        return response.text.strip()

    def generate_response(self, user_message: str, diagram=None, context: str = "") -> dict:
        prompt = (
            self._persona()
            + f"\n\nCONVERSATION SO FAR:\n{context or '(the session is just beginning)'}\n\n"
            f"LEARNER JUST SAID:\n{user_message}\n\n"
            "Respond as the tutor: react to their reasoning, teach the next idea through the ongoing scenario "
            "(or a new one if it's time to move on), and end with a question."
        )
        response = self.chat.send_message(message=prompt)
        return {"content": response.text.strip(), "type": "explanation", "diagram": None}
