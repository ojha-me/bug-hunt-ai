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

AI_MODEL = "qwen/qwen3.8-27b"

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


# Interview DSA patterns — the tutor reuses the same machinery, keyed by pattern slug.
PATTERN_BRIEFS = {
    "arrays-hashing": {"name": "the Arrays & Hashing pattern", "concepts": [
        "trading space for time with a hash map/set", "O(1) membership vs O(n) scans",
        "counting with a frequency map", "grouping by a computed key", "when order is or isn't preserved"]},
    "two-pointers": {"name": "the Two Pointers pattern", "concepts": [
        "converging pointers on sorted data", "which pointer to move from the comparison",
        "fast/slow pointers", "in-place partitioning", "why it beats a nested loop"]},
    "sliding-window": {"name": "the Sliding Window pattern", "concepts": [
        "contiguous subarray/substring problems", "grow-right / shrink-left",
        "incremental window state (not recomputing)", "fixed vs variable window", "each element enters and leaves once"]},
    "stack": {"name": "the Stack (and Monotonic Stack) pattern", "concepts": [
        "LIFO matching/undo", "monotonic stack for next-greater/smaller", "storing indices not values",
        "parsing nested structure", "handling leftover items"]},
    "binary-search": {"name": "the Binary Search pattern", "concepts": [
        "halving a sorted search space", "binary-searching the ANSWER over a monotonic feasibility test",
        "exact-match vs boundary search", "avoiding infinite loops", "picking lo<=hi vs lo<hi"]},
    "linked-list": {"name": "the Linked List pattern", "concepts": [
        "pointer rewiring (save next before rewiring)", "dummy head to kill edge cases",
        "fast/slow pointers for middle/cycle", "reverse in O(1) space"]},
    "trees": {"name": "the Trees (DFS/BFS) pattern", "concepts": [
        "recursion mirroring the tree", "solve children then combine", "BFS with a queue for level order",
        "carrying a (lo,hi) range for BST validation", "depth vs height"]},
    "heap": {"name": "the Heap / Priority Queue pattern", "concepts": [
        "O(log n) push/pop of the extreme", "size-k heap for top-k (O(n log k))",
        "min-heap vs max-heap via negation", "merging k sorted streams"]},
    "backtracking": {"name": "the Backtracking pattern", "concepts": [
        "choose / recurse / undo", "copying the path into results", "pruning invalid branches",
        "visited-marking to prevent reuse", "exponential worst case"]},
    "graphs": {"name": "the Graphs (BFS/DFS/Topo) pattern", "concepts": [
        "adjacency list / grid modeling", "BFS for shortest unweighted path, DFS for components",
        "topological sort via indegrees for dependencies", "visited to avoid infinite loops"]},
    "dynamic-programming": {"name": "the Dynamic Programming pattern", "concepts": [
        "overlapping subproblems + optimal substructure", "defining the state (dp[i] / dp[i][j])",
        "the transition/recurrence", "base cases and iteration order", "1D vs 2D and space compression"]},
    "intervals": {"name": "the Intervals pattern", "concepts": [
        "sort by start as the unlock", "overlap test: start <= previous end",
        "merging vs conflict detection", "touching endpoints edge case"]},
    "greedy": {"name": "the Greedy pattern", "concepts": [
        "locally optimal choice that's provably globally optimal", "carrying a running best",
        "furthest-reach / min-so-far", "when greedy fails and you need DP instead"]},
    "bit-manipulation": {"name": "the Bit Manipulation pattern", "concepts": [
        "XOR cancels pairs (a^a=0)", "n & (n-1) clears the lowest set bit",
        "AND/OR/shift as flag ops", "O(1)-space tricks vs a hash set"]},
}
COMPONENT_BRIEFS.update(PATTERN_BRIEFS)


# Data-structure foundations — the prerequisites before patterns. Taught hands-on.
DS_FOUNDATION_BRIEFS = {
    "arrays-strings": {"name": "the Array (and String) data structure", "concepts": [
        "contiguous memory and O(1) indexing", "iteration and in-place modification",
        "slicing and its O(k) cost", "strings as immutable sequences of characters", "when an array is the right choice"]},
    "hashing-maps": {"name": "the Hash Map & Hash Set", "concepts": [
        "O(1) average insert/lookup/delete", "hashing and collisions (conceptually)",
        "counting with a frequency map", "dedup with a set", "keys must be hashable; no sorted order"]},
    "stacks-queues": {"name": "the Stack & Queue", "concepts": [
        "LIFO stack: push/pop/peek in O(1)", "FIFO queue", "collections.deque for O(1) at both ends",
        "using a Python list as a stack", "when LIFO vs FIFO matters"]},
    "linked-lists": {"name": "the Linked List", "concepts": [
        "nodes with a value and a next pointer", "O(1) insert/delete at a node vs O(n) search",
        "singly vs doubly linked", "the dummy-head trick", "rewiring pointers without losing the list"]},
    "recursion": {"name": "Recursion", "concepts": [
        "base case + recursive case", "the call stack and how frames unwind",
        "reducing a problem to a smaller subproblem", "recursion vs iteration", "stack depth and overflow"]},
    "trees-bst": {"name": "the Tree & Binary Search Tree", "concepts": [
        "nodes, root, children, leaves, height", "traversals: pre/in/post-order and level-order (BFS)",
        "the BST ordering property", "recursion mirrors the tree", "balanced vs skewed and why it matters"]},
    "heaps-pq": {"name": "the Heap / Priority Queue", "concepts": [
        "a binary heap keeps the min (or max) at the root", "push/pop in O(log n)",
        "Python heapq (min-heap; negate for max)", "top-k with a size-k heap", "heapify in O(n)"]},
    "graphs-basics": {"name": "the Graph", "concepts": [
        "vertices and edges; directed vs undirected", "adjacency list vs adjacency matrix",
        "representing a graph in Python (dict of lists)", "BFS vs DFS traversal", "tracking visited nodes"]},
    "tries": {"name": "the Trie (prefix tree)", "concepts": [
        "a tree keyed by characters", "insert/search/startsWith in O(word length)",
        "node children as a dict", "when a trie beats a hash set (prefix queries)", "the space cost"]},
}
COMPONENT_BRIEFS.update(DS_FOUNDATION_BRIEFS)

# Topics that are coding lessons — they use the hands-on, write-code persona.
CODING_TOPICS = set(PATTERN_BRIEFS.keys()) | set(DS_FOUNDATION_BRIEFS.keys())

# Every valid tutor topic (component kinds + pattern slugs + DS foundations).
TUTOR_TOPICS = set(COMPONENT_BRIEFS.keys())


class ComponentTutorService:
    def __init__(self, kind: str):
        self.kind = kind
        self.brief = COMPONENT_BRIEFS.get(kind, DEFAULT_BRIEF)
        self.is_coding = kind in CODING_TOPICS  # pattern or DS foundation -> hands-on code lesson
        self.chat = GroqChat(model=AI_MODEL)

    def _persona(self) -> str:
        name = self.brief["name"]
        concepts = "; ".join(self.brief["concepts"])
        if self.is_coding:
            return (
                f"You are a sharp, encouraging coding-interview tutor running a hands-on 1:1 lesson on {name}.\n"
                "Teach like a great mentor: explain the core idea with ONE small concrete example, then hand the "
                "learner a SMALL, specific coding exercise to implement THEMSELVES in Python. They have a code "
                "editor beside the chat — they can run their code and click 'Send to tutor' to share it.\n"
                "When they share code, review it directly and specifically: is it correct, does it actually use "
                "this pattern, what's the time/space complexity, and exactly what to fix. Then either ask them to "
                "fix it or set the next, slightly harder exercise. Keep them WRITING code — don't just lecture.\n"
                f"Ground the lesson in these ideas (cover them over the session, but NEVER paste this list): {concepts}.\n"
                "When you set an exercise, state the task in one or two lines and give a clear Python function "
                "signature, and tell them to write it in the editor and hit 'Send to tutor' when ready. Keep "
                "replies short and conversational (2-6 sentences). Use fenced ```python blocks for any code."
            )
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
        if self.is_coding:
            instruction = (
                "\n\nBegin the lesson now. Greet the learner in one line, explain the core idea of this pattern "
                "in 2-3 sentences with a tiny concrete example, then give them their FIRST small coding exercise: "
                "state the task and a clear Python function signature, and tell them to write it in the editor and "
                "hit 'Send to tutor' when ready. Keep it approachable — start easy."
            )
        else:
            instruction = (
                "\n\nBegin the session now. Greet the learner in one line, then set up a fresh, specific, "
                "slightly unusual scenario that motivates this component and ask them what they'd do. "
                "Do not explain the answer yet — just pose the situation and the question."
            )
        response = self.chat.send_message(message=self._persona() + instruction)
        return response.text.strip()

    def generate_response(self, user_message: str, diagram=None, context: str = "") -> dict:
        if self.is_coding:
            instruction = (
                "Respond as the coding tutor. If they shared code, review it specifically (correctness, does it "
                "use the pattern, complexity, what to fix) and then either ask them to fix it or set the next, "
                "slightly harder exercise with a clear signature. If they asked a question, answer briefly and "
                "steer them back to writing code. Always keep them coding."
            )
        else:
            instruction = (
                "Respond as the tutor: react to their reasoning, teach the next idea through the ongoing scenario "
                "(or a new one if it's time to move on), and end with a question."
            )
        prompt = (
            self._persona()
            + f"\n\nCONVERSATION SO FAR:\n{context or '(the session is just beginning)'}\n\n"
            f"LEARNER JUST SAID:\n{user_message}\n\n"
            + instruction
        )
        response = self.chat.send_message(message=prompt)
        return {"content": response.text.strip(), "type": "explanation", "diagram": None}
