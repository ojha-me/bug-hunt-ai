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
