from django.core.management.base import BaseCommand
from system_design.models import SDCaseStudy
from system_design.utils.diagram_kinds import infer_kind


class Command(BaseCommand):
    help = 'Seed curated system design case studies (with canonical reference diagrams)'

    def handle(self, *args, **options):
        for case in CASE_STUDIES:
            obj, created = SDCaseStudy.objects.get_or_create(
                slug=case["slug"],
                defaults=case,
            )
            if created:
                self.stdout.write(f"Created case study: {obj.title}")
            else:
                for field, value in case.items():
                    setattr(obj, field, value)
                obj.save()

        if not any(SDCaseStudy.objects.filter(slug=c["slug"]).exists() for c in CASE_STUDIES):
            self.stdout.write("No case studies seeded yet.")


def _n(node_id: str, x: int, y: int, label: str, node_type: str = "default", kind: str = None):
    return {
        "id": node_id,
        "type": node_type,
        "kind": infer_kind(label, kind),
        "position": {"x": x, "y": y},
        "data": {"label": label},
    }


def _e(edge_id: str, source: str, target: str, label: str = None):
    return {"id": edge_id, "source": source, "target": target, "label": label}


CASE_STUDIES = [
    {
        "slug": "design-url-shortener",
        "title": "Design a URL Shortener",
        "difficulty": "easy",
        "topics": ["Caching", "Databases", "API Design"],
        "overview": (
            "Design a service like bit.ly or TinyURL that takes long URLs and produces short aliases, "
            "redirecting users to the original destination. A strong answer covers a collision-free ID "
            "scheme, fast redirects via a cache, and analytics wire-through. "
            "**Key questions:** write-to-read ratio, redirect latency targets, collision handling, expiry."
        ),
        "functional_requirements": [
            "Shorten a long URL to a unique short code (e.g. https://short.ly/8abC3)",
            "Redirect a short code to the original URL (301/302)",
            "Optional: custom aliases and expiry for premium users",
            "Track click counts per short code (analytics)",
        ],
        "non_functional_requirements": [
            "Redirect latency < 100ms p99",
            "Availability 99.95% (read-heavy: ~100:1 read:write)",
            "Short codes must be globally unique and unforgeable-enough",
            "Highly scalable reads (billions of redirects/month)",
        ],
        "capacity": {
            "Writes per month": "100M",
            "Reads per month": "10B (100:1 read:write)",
            "Write rate": "~40 req/s avg, 2K peak",
            "Read rate": "~4K req/s avg, 200K peak",
            "Codes needed in 10 years": "100M * 12 * 10 = 12B + headroom",
            "Storage": "12B rows * ~120 bytes = 1.4 TB",
            "Cache size (90% LRU)": "~9M entries * 100 bytes = ~900 MB (one-tier Redis)",
            "Bandwidth": "~500 Mbps peak at 200K rps responses",
        },
        "key_components": [
            {"name": "API Gateway", "responsibility": "Terminate HTTPS, rate limit shorten/redirect requests"},
            {"name": "Shorten Service", "responsibility": "Generate unique code (base62 of counter/random), persist mapping"},
            {"name": "Redirect Service", "responsibility": "Look up code, respond 301 with Location header"},
            {"name": "Cache (Redis)", "responsibility": "Fast path for hot codes; read-through from DB on miss"},
            {"name": "Primary DB", "responsibility": "System of record (code -> URL). Postgres or sharded MySQL"},
            {"name": "Click Worker + Analytics DB", "responsibility": "Async ingestion of click events for dashboards"},
        ],
        "tradeoffs": [
            "Hash+encode vs counter: hash may collide and isn't reversible; counter+base62 is monotonic, needs a key service or ID range from a centralized generator",
            "DB-first with cache write-through vs cache-first: prefer cache on read path only (write path = DB row + async cache refresh)",
            "Sync analytics write vs async queue: queue keeps shorten latency low, at the cost of 'eventual' analytics",
            "301 vs 302: 301 is cached by browsers (fewer hits, harder analytics); 302 preserves click counting",
            "Monolithic DB vs sharding by code prefix: shard once codes exceed a single node's capacity",
        ],
        "reference_diagram": {
            "nodes": [
                _n("user", 0, 180, "User / Client", "input"),
                _n("gateway", 250, 180, "API Gateway (HTTPS, auth, rate limit)"),
                _n("shorten", 500, 60, "Shorten Service"),
                _n("redirect", 500, 300, "Redirect Service"),
                _n("cache", 750, 60, "Cache (Redis)"),
                _n("db", 750, 300, "Primary DB (code -> URL)"),
                _n("worker", 500, 540, "Click Analytics Worker"),
                _n("analytics", 750, 540, "Analytics DB"),
            ],
            "edges": [
                _e("e1", "user", "gateway", "HTTP"),
                _e("e2", "gateway", "shorten", "POST /shorten"),
                _e("e3", "gateway", "redirect", "GET /{code}"),
                _e("e4", "shorten", "db", "INSERT"),
                _e("e5", "redirect", "cache", "cache GET"),
                _e("e6", "cache", "db", "read-through on miss"),
                _e("e7", "redirect", "worker", "log click"),
                _e("e8", "worker", "analytics", "async insert"),
            ],
        },
    },
    {
        "slug": "design-rate-limiter",
        "title": "Design a Rate Limiter",
        "difficulty": "medium",
        "topics": ["Caching", "Distributed Systems", "API Design"],
        "overview": (
            "Design an API rate limiter that caps how fast a client (keyed by user, IP or token) can call a "
            "backend service. A strong answer separates **algorithm choice** (token bucket vs sliding window), "
            "**storage** (local vs distributed), and **deployment** (edge vs in-service)."
        ),
        "functional_requirements": [
            "Limit requests per key (user_id / IP / token) within a time window",
            "Return 429 Too Many Requests with Retry-After header when exceeded",
            "Support configurable limits per tier (free vs premium)",
            "Send a push notification when a user exceeds the limit (informational)",
        ],
        "non_functional_requirements": [
            "Limiter decisions add < 5ms to the hot path",
            "Highly available: misuse must never crash the limiter",
            "Distributed: all gateway instances share a consistent view",
            "Loosely coupled: backend services should each enforce their own limit",
        ],
        "capacity": {
            "Requests per second": "1M rps across the edge",
            "Rules count": "~100 distinct rule templates",
            "In-memory hot keys": "~10M buckets in Redis",
            "Per-key footprint": "~40 bytes (counter + window)", 
            "Redis memory": "10M * 40 bytes = 400 MB primary, replicas for read",
        },
        "key_components": [
            {"name": "Edge / Gateway", "responsibility": "Runs the limit check before routing each request"},
            {"name": "Rate Limiter Client (Lib)", "responsibility": "In-process token bucket for low-latency best effort"},
            {"name": "Redis (counters)", "responsibility": "Authoritative distributed store of key -> window counters"},
            {"name": "Rules Service", "responsibility": "Serves limit config per key/tier, cached at edge"},
            {"name": "Backend Services", "responsibility": "Enforce their own stricter limits for the hot path"},
        ],
        "tradeoffs": [
            "Token bucket (allows bursts, simple) vs fixed/sliding window (steadier but more memory/config)",
            "In-memory local limiter (fast, per-instance) vs Redis (global, consistent, +network hop)",
            "Edge (protects all services, single chokepoint) vs in-service (per-tier exactly, harder to share)",
            "Eventually consistent leaderboard of top offenders vs strict accounting: prefer strict for correctness",
            "Allow-list for internal/trusted clients to avoid false 429s on webhooks",
        ],
        "reference_diagram": {
            "nodes": [
                _n("client", 0, 180, "Clients", "input"),
                _n("edge", 250, 180, "Edge Rate Limiter (lib)"),
                _n("redis", 500, 180, "Redis Buckets"),
                _n("rules", 750, 60, "Rules Service"),
                _n("gateway", 500, 360, "API Gateway"),
                _n("service-a", 750, 320, "Service A"),
                _n("service-b", 750, 440, "Service B"),
            ],
            "edges": [
                _e("d1", "client", "edge", "requests"),
                _e("d2", "edge", "redis", "INCR / RATE_CHECK"),
                _e("d3", "edge", "gateway", "pass if allowed"),
                _e("d4", "rules", "edge", "config (cached)"),
                _e("d5", "gateway", "service-a", "rate-limit again"),
                _e("d6", "gateway", "service-b", "rate-limit again"),
                _e("d7", "edge", "client", "429 + Retry-After"),
            ],
        },
    },
    {
        "slug": "design-news-feed",
        "title": "Design a News Feed (Twitter)",
        "difficulty": "medium",
        "topics": ["Caching", "Fan-out", "Consistency", "Timeline"],
        "overview": (
            "Design the feed that shows a user posts from the people and pages they follow, like the Twitter "
            "home timeline. A strong answer weighs **pull vs push (fan-out on write vs on read)** and "
            "usually blends them for celebrities, then leans on a hot timeline cache."
        ),
        "functional_requirements": [
            "Publish a post (text/media) to a user's followers",
            "Show the signed-in user a feed of recent posts from followed users, newest first",
            "Support likes/comments/retweets aggregated onto feed items",
            "Timeline pagination with cursor",
        ],
        "non_functional_requirements": [
            "Feed load latency < 200ms p99",
            "Availability 99.99% for reads; processing for write is eventual",
            "Scalability: 200M DAU, 100M posts/day",
            "Timeline must be strongly consistent per user",
            "Fault isolation: one celebrity's post must not spike latency for everyone",
        ],
        "capacity": {
            "DAU": "200M",
            "New posts per day": "100M",
            "Avg followers per user": "~200",
            "Fan-out on write for normal users": "100M posts * 200 = 20B timeline inserts/day peak",
            "Fan-out on read for celebrities": "reading N timelines at read time",
            "Feed cache per active user": "~500 posts * 300 bytes = ~150 KB -> 10M hot users = ~1.5 TB",
        },
        "key_components": [
            {"name": "Client / Web", "responsibility": "Renders home timeline, polls or long-polls for updates"},
            {"name": "Feed Service", "responsibility": "Serve cached timelines + pagination cursor; handles missing portions by pull"},
            {"name": "Post Service", "responsibility": "Create post, fan-out to follower timelines (async)"},
            {"name": "Fan-out Worker", "responsibility": "Push post id into each follower's timeline list in Redis"},
            {"name": "Social Graph (follow cache)", "responsibility": "Provides follower lists; feeds the worker"},
            {"name": "Timeline Cache (Redis/List)", "responsibility": "Per-user post id lists with scores (post time)"},
            {"name": "Meta DB (Postgres)", "responsibility": "Post content, author, engagement counters (system of record)"},
        ],
        "tradeoffs": [
            "Fan-out on write (fast reads, expensive writes, celebrity spikes) vs fan-out on read (simple writes, slow reads). Use hybrid: push for normal users, pull+prepare for celebrities",
            "Redis List for timelines is simple and fast; needs hydration from Meta DB on read — keep post ids + volume counters to stay cheap",
            "Store media in object store with CDN; timeline only references ids, never binaries",
            "Eventual consistency for engagement counters (likes/retweet counts) validated against a counter service, not the DB",
            "Cache cold start: rebuild timeline from {following's recent posts} via pull on first access after eviction",
        ],
        "reference_diagram": {
            "nodes": [
                _n("client", 0, 180, "Client", "input"),
                _n("feed", 250, 180, "Feed Service"),
                _n("post", 250, 360, "Post Service"),
                _n("cache", 500, 180, "Timeline Cache (Redis)"),
                _n("meta", 750, 180, "Meta DB (Postgres)"),
                _n("graph", 500, 360, "Social Graph Cache"),
                _n("worker", 500, 540, "Fan-out Worker"),
                _n("object", 750, 360, "Object Store + CDN"),
            ],
            "edges": [
                _e("f1", "client", "feed", "GET timeline"),
                _e("f2", "feed", "cache", "timeline list"),
                _e("f3", "feed", "meta", "hydrate posts"),
                _e("f4", "client", "post", "POST create"),
                _e("f5", "post", "graph", "followers"),
                _e("f6", "post", "worker", "fan-out job"),
                _e("f7", "worker", "cache", "push post id"),
                _e("f8", "post", "object", "media"),
                _e("f9", "feed", "object", "CDN media refs"),
            ],
        },
    },
    {
        "slug": "design-chat-system",
        "title": "Design a Chat System (WhatsApp)",
        "difficulty": "hard",
        "topics": ["WebSockets", "Pub/Sub", "Replication", "Delivery Semantics"],
        "overview": (
            "Design a 1:1 and group messaging system like WhatsApp: real-time delivery, read receipts, "
            "history stored forever. A strong answer centers on a persistent WebSocket gateway, durable "
            "message store, and a pub/sub fan-out per chat with reliable delivery metadata."
        ),
        "functional_requirements": [
            "Send and receive messages with real-time delivery",
            "Unread counts + read receipts (delivered/read)",
            "Group chats up to ~500 members",
            "Message history stored forever, searchable later",
            "Multiple devices per user, online presence",
        ],
        "non_functional_requirements": [
            "End-to-end delivery latency < 100ms typical",
            "Exactly-once *delivery attempt* semantics: track delivered via local state (not global exactly-once)",
            "1B users, 100K concurrent connections per gateway node",
            "Messages must not be lost if the device is offline (spool on server)",
            "Horizontal scaling of gateways, chat state, and presence",
        ],
        "capacity": {
            "Total users": "1B",
            "Concurrent connections": "250M",
            "Messages per day": "20B",
            "Avg message size": "~100 bytes (text) up to MBs for media (separate flow)",
            "Storage per day": "20B * ~200 bytes = 4 TB/day -> ~1.4 PB/yr for text",
            "Gateway nodes": "250M connections / 100K per node = ~2500 nodes",
        },
        "key_components": [
            {"name": "Clients (web/mobile)", "responsibility": "Render conversation list + history, push local receipt"},
            {"name": "Gateway (WS), stateless", "responsibility": "Hold 100K TCP/WS connections each; route by device->server map"},
            {"name": "Chat Service", "responsibility": "Authorize, accept messages, append to chat history, pub/sub to members"},
            {"name": "Pub/Sub per chat", "responsibility": "Fan out a message to only online members for this chat (e.g. Redis/Kafka keyed by chat_id)"},
            {"name": "Message Store (PreShard DB)", "responsibility": "Log-structured store: per-user inbox or per-chat log; shard by chat_id hash"},
            {"name": "Presence Service", "responsibility": "Tracks online/offline per device; pushes presence updates to contacts"},
            {"name": "Offline Notifications", "responsibility": "APNs/FCM for devices that disconnected seconds ago (gateway spools short-term)"},
        ],
        "tradeoffs": [
            "Per-user mailbox (easy last-message lists, heavy replication) vs per-chat log (single source of truth, paginate per chat). Real systems use mixed: per-conversation log + per-user summary",
            "Store WS connection map in Redis (stateless gateway, one extra hop) vs sticky sessions (faster, harder reconnects) — prefer Redis map + routing",
            "At-least-once delivery with client dedup by message id instead of global exactly-once (much cheaper)",
            "Media not in main flow: client uploads to object store, sends reference via chat; avoids copying MBs through WS",
            "Presence: heartbeats via WS keep-alive; degrade to coarse presence when nodes split",
        ],
        "reference_diagram": {
            "nodes": [
                _n("ca", 0, 60, "User A Client", "input"),
                _n("cb", 0, 300, "User B Client (offline)", "input"),
                _n("gw", 250, 180, "WS Gateways (stateless xN)"),
                _n("chat", 500, 180, "Chat Service"),
                _n("pubsub", 750, 60, "Pub/Sub (per chat)"),
                _n("store", 750, 300, "Message Store (sharded)"),
                _n("presence", 500, 420, "Presence Service"),
                _n("push", 750, 540, "APNs / FCM"),
                _n("box", 250, 480, "Other Gateways (B's device)"),
            ],
            "edges": [
                _e("g1", "ca", "gw", "WS send"),
                _e("g2", "gw", "chat", "append msg"),
                _e("g3", "chat", "store", "persist"),
                _e("g4", "chat", "pubsub", "fan-out"),
                _e("g5", "pubsub", "box", "to online members"),
                _e("g6", "box", "cb", "deliver when online"),
                _e("g7", "gw", "presence", "heartbeat"),
                _e("g8", "chat", "push", "offline notif"),
                _e("g9", "store", "gw", "history on open"),
            ],
        },
    },
    {
        "slug": "design-notification-system",
        "title": "Design a Notification System",
        "difficulty": "medium",
        "topics": ["Queueing", "Fault Tolerance", "Fan-out", "Delivery"],
        "overview": (
            "Design a platform that sends push, email, SMS, and in-app notifications triggered by events in "
            "other services (likes, follows, order updates). A strong answer decouples producers from "
            "delivery workers with a queue, de-duplicates, and retries with backoff."
        ),
        "functional_requirements": [
            "Send notification to a user on a triggering event across channels (push/email/SMS/in-app)",
            "Respect per-user channel + quiet-hours preferences",
            "Retry delivery with exponential backoff; never drop permanently",
            "Support scheduled & rate-limited sends",
        ],
        "non_functional_requirements": [
            "Delivery worker scale-out must not lose messages",
            "At-least-once semantics; each notification is de-duplicated by (user, type, payload-key)",
            "Provider failures (APNs down) must not block the queue",
            "Include a soft real-time requirement: pushes within ~1s",
        ],
        "capacity": {
            "Events per second": "5M avg, 50M peak",
            "Users": "1B",
            "Push provider calls": "1M/s",
            "Queue backlog": "must absorb 10x bursts for hours",
            "Dedupe cache": "10M entries * ~100 bytes = 1 GB (Redis TTL 24h)",
        },
        "key_components": [
            {"name": "Producer Services", "responsibility": "Emit typed events (like.feed.onPost, orm.order.created)"},
            {"name": "Notification Service", "responsibility": "Maps event -> template + recipients; applies prefs; persists intent"},
            {"name": "Queues (Kafka/SQS)", "responsibility": "Durable backlog, segregated by channel and priority"},
            {"name": "Delivery Workers", "responsibility": "Pull, call provider, acknowledge on success"},
            {"name": "Provider Adapters", "responsibility": "APNs / FCM / SMTP / SMS gateways with rate control"},
            {"name": "Temp User DB + Prefs Cache", "responsibility": "Device tokens, quiet hours, channel preferences"},
        ],
        "tradeoffs": [
            "Single queue vs channel-specific queues: separate queues isolate a sick provider from the rest; adds ops overhead",
            "Synchronous provider call vs batch worker: worker + retry keeps producers fast but adds latency",
            "Dedup via Redis keyed by event hash (cheap, some loss on restart) vs DB unique constraint (authoritative, slower) — use cache-first + periodic reconcile",
            "Template storage in service vs provider: keep templates + push metadata in the notification record to stay provider-agnostic",
            "Backoff from a poison-pill dead-letter queue to avoid blocking the healthy backlog",
        ],
        "reference_diagram": {
            "nodes": [
                _n("prod", 0, 180, "Producer Services", "input"),
                _n("notif", 250, 180, "Notification Service"),
                _n("prefs", 250, 360, "Prefs + Device DB"),
                _n("queue", 500, 180, "Queues (per channel)"),
                _n("push-w", 750, 60, "Push Workers"),
                _n("email-w", 750, 180, "Email Workers"),
                _n("sms-w", 750, 300, "SMS Workers"),
                _n("apns", 1000, 60, "APNs / FCM"),
                _n("smtp", 1000, 180, "SMTP"),
                _n("smsprovider", 1000, 300, "SMS Gateway"),
                _n("dlq", 500, 480, "Dead Letter Queue"),
            ],
            "edges": [
                _e("n1", "prod", "notif", "events"),
                _e("n2", "notif", "prefs", "resolve recipients"),
                _e("n3", "notif", "queue", "enqueue per channel"),
                _e("n4", "queue", "push-w", "consume"),
                _e("n5", "queue", "email-w", "consume"),
                _e("n6", "queue", "sms-w", "consume"),
                _e("n7", "push-w", "apns", "send"),
                _e("n8", "email-w", "smtp", "send"),
                _e("n9", "sms-w", "smsprovider", "send"),
                _e("n10", "push-w", "dlq", "retry -> DLQ"),
            ],
        },
    },
]