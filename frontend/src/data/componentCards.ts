import type { NodeKind } from "../types/ai_core/api_types";

/**
 * Teaching content for the system-design "component cards" library. Each card
 * maps a diagram `kind` (see SystemDesignNodes.tsx) to when-to-use guidance and
 * the consistency / scaling trade-offs an interviewer probes. Icon + colour are
 * pulled from KIND_META so the vocabulary stays in one place.
 */
export interface ComponentCard {
  kind: NodeKind;
  name: string;
  category: CardCategory;
  tagline: string;
  whenToUse: string[];
  watchOut: string[];
  consistency: string;
  scaling: string;
  examples: string[];
  /** Present once the component has a full taught lesson (otherwise reference-only). */
  lesson?: ComponentLesson;
}

/** A scenario-based active-recall question with an explained answer. */
export interface Drill {
  scenario: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

/** A common mistake, named and explained (not just listed). */
export interface Pitfall {
  title: string;
  detail: string;
}

/** The taught lesson: reason your way to the component, then test it. */
export interface ComponentLesson {
  /** The motivating problem that makes you *want* this component. */
  problem: string;
  /** The analogy / mental model to hold onto. */
  mentalModel: string;
  /** The mechanism — how it actually does the job. */
  howItWorks: string;
  /** Why the trade-offs exist, reasoned rather than listed. */
  why: string;
  pitfalls: Pitfall[];
  drills: Drill[];
  /** Seed prompt for the "Discuss with the tutor" CTA. */
  tutorPrompt: string;
}

export type CardCategory = "Edge & Traffic" | "Compute" | "Data Stores" | "Messaging" | "Integration";

export const CARD_CATEGORIES: CardCategory[] = [
  "Edge & Traffic",
  "Compute",
  "Data Stores",
  "Messaging",
  "Integration",
];

export const COMPONENT_CARDS: ComponentCard[] = [
  {
    kind: "client",
    name: "Client",
    category: "Edge & Traffic",
    tagline: "The user-facing app (browser, mobile, desktop) that originates every request.",
    whenToUse: [
      "Always the entry point — name it explicitly in the design",
      "Decide thick vs thin client: how much logic and caching lives on-device",
      "Model offline behaviour, retries, and network variability for mobile",
    ],
    watchOut: [
      "Never trust the client — always validate on the server",
      "Client-side caches (localStorage, service workers) can serve stale data",
      "Many device types means many network conditions to handle",
    ],
    consistency: "N/A itself, but on-device caches can hold stale reads until refreshed.",
    scaling: "Scales with your user base, not your infra — push work to the CDN/edge to spare the origin.",
    examples: ["Web (React/Vue)", "iOS / Android apps", "CLI & SDK consumers"],
  },
  {
    kind: "cdn",
    name: "CDN",
    category: "Edge & Traffic",
    tagline: "Geographically distributed cache that serves content from a point of presence close to the user.",
    whenToUse: [
      "Static assets: images, JS/CSS bundles, video segments",
      "Read-heavy workloads with globally distributed users",
      "Offload origin bandwidth and cut round-trip latency",
      "Cache API GETs with short TTLs at the edge",
    ],
    watchOut: [
      "Invalidation is hard — use versioned URLs / cache-busting",
      "Not for personalized responses or the write path",
      "Content is stale until the TTL expires or you purge",
    ],
    consistency: "Eventual — edges converge to the origin after TTL expiry or an explicit purge.",
    scaling: "Effectively unlimited read scale; the provider runs the PoPs and replication.",
    examples: ["CloudFront", "Cloudflare", "Fastly", "Akamai"],
  },
  {
    kind: "load_balancer",
    name: "Load Balancer",
    category: "Edge & Traffic",
    tagline: "Spreads incoming traffic across a pool of backends and routes around unhealthy ones.",
    whenToUse: [
      "Any time you run more than one instance of a service",
      "Health checks with automatic failover",
      "TLS termination; sticky sessions when unavoidable",
    ],
    watchOut: [
      "L4 (TCP) is cheap/fast; L7 (HTTP) can route by path/header but costs more",
      "It can be a single point of failure — run redundant LBs or use anycast/DNS",
      "Sticky sessions undercut even distribution",
    ],
    consistency: "Stateless by design — never store session state on the LB itself.",
    scaling: "Add backends behind it; scale the LB tier with DNS round-robin or anycast.",
    examples: ["NGINX / HAProxy", "AWS ELB / ALB / NLB", "Envoy"],
  },
  {
    kind: "api_gateway",
    name: "API Gateway",
    category: "Edge & Traffic",
    tagline: "A single front door handling auth, rate limiting, routing, and request shaping for many services.",
    whenToUse: [
      "Microservices — centralize cross-cutting concerns",
      "AuthN/Z, rate limiting, request/response transformation",
      "API versioning and aggregation (backend-for-frontend)",
    ],
    watchOut: [
      "Can become a bottleneck or god-object — keep it thin",
      "Adds a network hop",
      "Don't bury business logic in it",
    ],
    consistency: "Stateless routing layer.",
    scaling: "Horizontal, sitting behind a load balancer.",
    examples: ["Kong", "AWS API Gateway", "Apigee", "Envoy / Ambassador"],
  },
  {
    kind: "service",
    name: "Service",
    category: "Compute",
    tagline: "A stateless application server running your business logic — the default box.",
    whenToUse: [
      "Request handling and orchestration",
      "Keep it stateless so any instance can serve any request",
      "Split into microservices only when team size or scale demands it",
    ],
    watchOut: [
      "Stateless means pushing session/state to a cache or DB",
      "Premature microservices add operational complexity",
      "Chatty inter-service calls hurt tail latency",
    ],
    consistency: "Stateless — reads/writes hit backing stores, where consistency actually lives.",
    scaling: "Horizontal — add instances behind an LB; autoscale on CPU or RPS.",
    examples: ["Django / Rails / Spring apps", "Go / Node services"],
  },
  {
    kind: "worker",
    name: "Worker",
    category: "Compute",
    tagline: "A background processor doing async work off the request path — jobs, pipelines, cron.",
    whenToUse: [
      "Slow or bursty work: email, image/video processing, ETL",
      "Decouple from the request via a queue or stream",
      "Scheduled / cron tasks",
    ],
    watchOut: [
      "Make jobs idempotent — they will be retried",
      "Handle poison messages with a dead-letter queue",
      "Backpressure when producers outpace consumers",
    ],
    consistency: "At-least-once processing is the norm — design for duplicate deliveries.",
    scaling: "Horizontal — scale the consumer pool with queue depth.",
    examples: ["Celery", "Sidekiq", "AWS Lambda", "Kafka consumers"],
  },
  {
    kind: "database",
    name: "Database",
    category: "Data Stores",
    tagline: "The system of record. SQL for structure/joins/ACID; NoSQL for scale and flexible schema.",
    whenToUse: [
      "Relational: transactions, joins, strong consistency (orders, payments)",
      "Key-value / wide-column: massive scale, simple access patterns, write-heavy",
      "Document: flexible or evolving schema",
    ],
    watchOut: [
      "SQL scales up more easily than out — sharding is painful",
      "NoSQL trades joins and multi-row transactions for scale",
      "Indexes speed reads but slow writes and cost storage",
    ],
    consistency: "SQL is strong/ACID by default; NoSQL is often tunable or eventual — pick per query.",
    scaling: "Read replicas for read scale, sharding/partitioning for write scale, replication for HA.",
    examples: ["Postgres / MySQL (SQL)", "DynamoDB / Cassandra (KV / wide-column)", "MongoDB (document)"],
  },
  {
    kind: "cache",
    name: "Cache",
    category: "Data Stores",
    tagline: "In-memory store for hot data in front of a slower datastore, for sub-millisecond reads.",
    whenToUse: [
      "Read-heavy hot keys, expensive queries, session storage",
      "Rate-limit counters and leaderboards",
      "Shielding the primary DB from read load",
    ],
    watchOut: [
      "Invalidation is one of the two hard problems in CS",
      "Cache stampede on expiry — use locks or TTL jitter",
      "Choose a policy: cache-aside vs write-through, plus eviction (LRU/LFU) and TTLs",
    ],
    consistency: "Eventual relative to the source of truth — you trade freshness for speed.",
    scaling: "Horizontal via sharding / consistent hashing; replicas for HA.",
    examples: ["Redis", "Memcached"],
    lesson: {
      problem:
        "Your feed endpoint reads the same ~50 trending posts tens of thousands of times a second. Every read hits Postgres, which does real work — parse the query, check the buffer pool, maybe touch disk — to return an answer that barely changes between requests. Eventually the database spends all its time re-answering identical questions and tips over. You didn't run out of data; you ran out of the ability to *re-read* it fast enough.",
      mentalModel:
        "A cache is a small, fast cheat sheet you keep in front of the slow source of truth: RAM instead of disk, a keyed lookup instead of query planning. The deal you're striking is explicit — give up a little freshness in exchange for a lot of speed. Almost everything hard about caching flows from that single trade, because the cheat sheet can be *wrong*.",
      howItWorks:
        "The default pattern is cache-aside. On a read, check the cache first — a hit returns in well under a millisecond. On a miss, read the DB, store the value in the cache, then return it. Each entry carries a TTL so it eventually expires and gets re-fetched, and when memory fills an eviction policy (usually LRU — least recently used) decides what to drop. Writes are the subtle part: you either update the cache on write (write-through) or simply delete the key and let the next read repopulate it — deletion is the safer default because it can't leave a half-updated value behind.",
      why:
        "Why not just cache everything forever? Because the source of truth changes, and a cache entry is a copy frozen in time. The instant the underlying row changes, your cached copy is a lie until it's invalidated or expires. That's the whole reason TTLs exist — a TTL is a ceiling on how stale a value can get even if you write zero invalidation logic. It's also why 'cache invalidation' is famously one of the two hard problems in computing: the cache has no idea the DB changed unless you tell it, and telling it correctly on every write path is exactly where the bugs live.",
      pitfalls: [
        {
          title: "Cache stampede (thundering herd)",
          detail:
            "A hot key expires and thousands of concurrent requests all miss at the same instant, then hammer the DB together — the exact load you added the cache to prevent. Fix it with a short repopulation lock (one request rebuilds while the rest wait) or jittered TTLs so keys don't expire in lockstep.",
        },
        {
          title: "Stale reads after writes",
          detail:
            "If the write path updates the DB but forgets to touch the cache, users keep seeing the old value until the TTL lapses. Every write must invalidate (or update) the affected keys — or you must decide, on purpose, that a bounded staleness window is acceptable.",
        },
        {
          title: "Caching data with no skew",
          detail:
            "A cache only pays off when reads are skewed — a small hot set read a lot. Caching uniformly-random keys just burns memory: you miss almost every time and pay for two lookups instead of one.",
        },
      ],
      drills: [
        {
          scenario:
            "Your feed API reads the same 50 trending posts ~10k times/sec and the primary DB is saturating. What's the highest-leverage fix?",
          options: [
            "Add read replicas to the database",
            "Put a cache (e.g. Redis) in front of the DB for the hot posts",
            "Shard the database by post ID",
            "Move the posts to object storage",
          ],
          answerIndex: 1,
          explanation:
            "This is extreme read skew on a tiny hot set — the textbook case for a cache. Read replicas help but still do real query work per read and cost far more; sharding solves write/size scaling, not repeated identical reads; object storage isn't for queryable rows.",
        },
        {
          scenario:
            "A post gets edited. Your write path updates Postgres but nothing else. What do readers see?",
          options: [
            "The new content immediately",
            "The old content until the cache entry's TTL expires",
            "An error, because the cache and DB now disagree",
            "Nothing changes — caches are read-only",
          ],
          answerIndex: 1,
          explanation:
            "The cached copy is frozen at write time. With no invalidation, readers keep hitting the stale entry until its TTL lapses. That's why every write path must invalidate or update the affected keys.",
        },
        {
          scenario:
            "One extremely popular key expires and thousands of requests miss simultaneously, spiking the DB. This is called…",
          options: [
            "A cache miss",
            "Cache invalidation",
            "A cache stampede (thundering herd)",
            "An eviction storm",
          ],
          answerIndex: 2,
          explanation:
            "A synchronized rush of misses on a single hot key is a stampede. Mitigate with a repopulation lock (one request rebuilds, others wait) or TTL jitter so keys don't all expire at the same moment.",
        },
      ],
      tutorPrompt:
        "Teach me caching like an interviewer. Give me a realistic scenario, ask me what I'd add and where, then probe the trade-offs — staleness, invalidation, cache stampedes, write-through vs cache-aside. Correct me when I'm wrong and only move on once I can reason about it clearly.",
    },
  },
  {
    kind: "object_storage",
    name: "Object Storage",
    category: "Data Stores",
    tagline: "Cheap, durable, effectively unlimited storage for blobs — files, images, video, backups.",
    whenToUse: [
      "Large binary/static content, user uploads, backups, data-lake staging",
      "Serve via a CDN; store only the reference (URL) in your DB",
      "Write-once, read-many access patterns",
    ],
    watchOut: [
      "Not a database — no queries, no transactions, listing can lag",
      "Per-request and egress costs add up",
      "Higher latency than block or DB storage",
    ],
    consistency: "Read-after-write for new objects on major clouds; bucket listings may lag.",
    scaling: "Effectively infinite; the provider handles durability (11 nines) and replication.",
    examples: ["Amazon S3", "Google Cloud Storage", "MinIO", "HDFS"],
  },
  {
    kind: "search",
    name: "Search Index",
    category: "Data Stores",
    tagline: "An inverted-index engine for full-text search, filtering, and relevance ranking.",
    whenToUse: [
      "Full-text queries, autocomplete, faceted filtering",
      "Relevance ranking and fuzzy / typo-tolerant matching",
      "Log and analytics search",
    ],
    watchOut: [
      "A secondary index, not a source of truth — sync from the DB (CDC or dual-write)",
      "Near-real-time, not transactional",
      "RAM/CPU hungry; reindexing is expensive",
    ],
    consistency: "Eventual — documents become searchable after indexing lag.",
    scaling: "Sharded and replicated across nodes.",
    examples: ["Elasticsearch / OpenSearch", "Solr", "Algolia"],
  },
  {
    kind: "warehouse",
    name: "Data Warehouse",
    category: "Data Stores",
    tagline: "A columnar store optimized for large analytical (OLAP) queries over historical data.",
    whenToUse: [
      "Analytics, BI dashboards, reporting over big datasets",
      "Aggregations and scans across billions of rows",
      "Isolating analytics load from your serving DB",
    ],
    watchOut: [
      "Not for low-latency serving or per-row writes (OLAP, not OLTP)",
      "Loaded via batch/stream ETL — data is minutes to hours old",
      "Cost scales with the volume of data scanned",
    ],
    consistency: "Batch-loaded; reflects data as of the last ETL run.",
    scaling: "Massively parallel (MPP), typically separating storage from compute.",
    examples: ["Snowflake", "BigQuery", "Redshift", "ClickHouse"],
  },
  {
    kind: "queue",
    name: "Message Queue",
    category: "Messaging",
    tagline: "Buffers work as discrete messages; each is handled by one consumer, then removed.",
    whenToUse: [
      "Decouple producers from consumers and absorb traffic spikes",
      "Distribute tasks to a worker pool",
      "Retries and dead-lettering for failed jobs",
    ],
    watchOut: [
      "At-least-once delivery → make consumers idempotent",
      "Ordering usually isn't guaranteed across consumers",
      "Messages are consumed once — not replayable like a log",
    ],
    consistency: "At-least-once (sometimes exactly-once with dedup).",
    scaling: "Add consumers to drain faster; partition queues by key.",
    examples: ["RabbitMQ", "Amazon SQS", "Redis lists"],
  },
  {
    kind: "stream",
    name: "Event Stream",
    category: "Messaging",
    tagline: "A durable, replayable, append-only log; many consumers read independently at their own offset.",
    whenToUse: [
      "High-throughput event pipelines with fan-out to many consumers",
      "Event sourcing, change-data-capture, real-time analytics",
      "Replay history to rebuild state or bootstrap a new consumer",
    ],
    watchOut: [
      "More operationally heavy than a simple queue",
      "Ordering holds only within a partition",
      "Consumers track offsets — mind the retention window",
    ],
    consistency: "Ordered per partition; at-least-once (exactly-once with care).",
    scaling: "Partitioned for parallelism, replicated for durability.",
    examples: ["Apache Kafka", "AWS Kinesis", "Apache Pulsar"],
  },
  {
    kind: "external",
    name: "External Service",
    category: "Integration",
    tagline: "A third-party system or API you depend on but don't control — payments, email, maps.",
    whenToUse: [
      "Don't build commodity infra: auth, payments, email/SMS, maps",
      "Isolate behind an adapter / anti-corruption layer",
    ],
    watchOut: [
      "Treat as unreliable: timeouts, retries, circuit breakers",
      "Rate limits and per-call cost",
      "Vendor lock-in and data-privacy considerations",
      "Their outage becomes your outage — degrade gracefully",
    ],
    consistency: "Out of your control — assume eventual and fallible.",
    scaling: "Bounded by their limits — cache responses and batch calls.",
    examples: ["Stripe", "Twilio / SendGrid", "Auth0", "Google Maps API"],
  },
];
