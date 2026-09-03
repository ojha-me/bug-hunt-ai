from django.core.management.base import BaseCommand
from system_design.models import SDCaseStudy
from system_design.utils.diagram_kinds import infer_kind


class Command(BaseCommand):
    help = "Seed the classic system design interview canon (frequently asked case studies)"

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
        "slug": "design-web-crawler",
        "title": "Design a Web Crawler",
        "difficulty": "hard",
        "topics": ["Distributed Systems", "Queues", "Storage", "System Design"],
        "overview": (
            "Design a web crawler like Google's that systematically downloads pages, extracts links, and "
            "stores content for a search index. The hard parts are **politeness** (don't hammer servers), "
            "**deduplication** (URLs normalized, seen-set), and **distributed frontier** (queue of URLs to crawl)."
        ),
        "functional_requirements": [
            "Given seed URLs, follow links to discover and download pages",
            "Store raw HTML and meaningful metadata (title, timestamp, links)",
            "Avoid re-crawling the same URL (dedupe by normalized URL + content hash)",
            "Respect robots.txt and per-domain crawl rate limits (politeness)",
        ],
        "non_functional_requirements": [
            "Scale to billions of pages; several thousand pages/sec crawl rate",
            "Fault tolerance: a crawler machine dying must not lose the frontier",
            "Freshness: re-visit important pages (news) more often than static ones",
            "Deduplication must be cheap (in-memory bloom filters)",
        ],
        "capacity": {
            "Pages on the web indexed": "~50B+ (Google scale)",
            "Target crawl rate": "5K pages/sec at peak",
            "New pages/day": "~10-20M",
            "Avg page size": "~500 KB raw HTML",
            "Storage for raw pages": "50B pages * ~500 KB avg \u2248 25 PB raw",
            "URL seen-set": "50B * ~100 bytes = 5 TB (bloom filter fits in sharded RAM)",
            "Link DB": "~1T (source, target) rows (column store)",
        },
        "key_components": [
            {"name": "Crawler Workers", "responsibility": "Download pages (HTTP), extract content and links"},
            {"name": "Frontier Queue (distributed)", "responsibility": "Holds URLs pending crawl, sharded by domain hash"},
            {"name": "Politeness Module", "responsibility": "Per-domain rate limiting + robots.txt cache"},
            {"name": "Dedupe Layer", "responsibility": "Sharded bloom filters for normalized URL + content fingerprints"},
            {"name": "Persistence (Raw Store + Index DB)", "responsibility": "Blob store for HTML, column DB for links/metadata"},
            {"name": "Link Extractor", "responsibility": "Parse HTML to extract and normalize outbound URLs"},
            {"name": "Scheduler", "responsibility": "Prioritizes seeds (news first), reassigns URLs on worker death"},
        ],
        "tradeoffs": [
            "Frontier as Redis+Kafka vs pure DB: queue gives replay/fault-tolerance; DB gives requeue-by-priority but higher latency",
            "Bloom filter vs exact set for dedupe: bloom is memory-cheap and never false-negative but has tiny false-positive rate (acceptable)",
            "Politeness delay per domain vs throughput: strict rate control protects source servers at the cost of crawl speed",
            "Store raw HTML vs parse-and-discard: retaining raw lets you re-index when algorithms change, at huge storage cost (~PB scale)",
            "Single global queue vs per-partition queues: per-partition (by domain hash) isolates a slow site from the rest",
        ],
        "reference_diagram": {
            "nodes": [
                _n("urls", 0, 300, "Seed URLs", "input"),
                _n("sched", 240, 300, "Scheduler"),
                _n("frontier", 240, 60, "Frontier Queue (Kafka/Redis)"),
                _n("workers", 500, 300, "Crawler Workers (5K/s)"),
                _n("polite", 500, 60, "Politeness + robots.txt"),
                _n("dedupe", 740, 60, "Dedupe (Bloom)"),
                _n("rawstore", 740, 300, "Raw HTML Store (HDFS/Blob)"),
                _n("links", 740, 470, "Link Extractor"),
                _n("indexdb", 980, 470, "Links/Metadata DB"),
            ],
            "edges": [
                _e("e1", "urls", "sched", "new URLs"),
                _e("e2", "sched", "frontier", "enqueue"),
                _e("e3", "frontier", "workers", "next batch"),
                _e("e4", "workers", "polite", "rate check"),
                _e("e5", "polite", "workers", "ok to fetch"),
                _e("e6", "workers", "dedupe", "URL seen?"),
                _e("e7", "workers", "rawstore", "save HTML"),
                _e("e8", "workers", "links", "extract links"),
                _e("e9", "links", "sched", "new links -> requeue"),
                _e("e10", "links", "indexdb", "store link rows"),
            ],
        },
    },
    {
        "slug": "design-search-autocomplete",
        "title": "Design Search Autocomplete",
        "difficulty": "medium",
        "topics": ["Tries", "Caching", "API Design"],
        "overview": (
            "Design the autocomplete (typeahead) system that suggests queries as a user types, like Google's "
            "search bar. The core is a **trie** over popular query prefixes with a **top-k per node** cache "
            "in memory — plus lightweight clients scoring locally while the server catches up."
        ),
        "functional_requirements": [
            "As the user types, return top 10 query suggestions that share the prefix",
            "Suggestions ordered by frequency/recency of past queries",
            "Assume lowercase alphanumeric input (a-z, space); minimum prefix length 1",
        ],
        "non_functional_requirements": [
            "Latency < 100ms to first keystroke; near-zero perceived latency",
            "Scale to 100M DAU, ~10 queries/user/minute typing characters",
            "Most popular queries dominate traffic (hot set is small)",
            "Serve suggestions read-mostly; updates trickle from log stream",
        ],
        "capacity": {
            "Queries typed per day": "100M DAU * 10 * (average prefix length typed ~20 chars) ~ 20B char events",
            "Distinct queries": "~1B search queries",
            "Query cache (top-10 per node)": "prefixes ~5M * 10 suggestions * ~200 bytes ~ 10 GB RAM",
            "Write throughput to trie": "~10K query-inserts/s batched every ~10s",
            "Read QPS on suggestions": "peak 100K-500K rps",
        },
        "key_components": [
            {"name": "Client", "responsibility": "Send prefixes; also serve from a local recent-queries cache"},
            {"name": "API Gateway", "responsibility": "Auth, rate-limit, aggregate feature flags"},
            {"name": "Suggestion Service", "responsibility": "In-memory trie + top-k per node; answers in O(prefix length + k)"},
            {"name": "Redis Cache", "responsibility": "Prefix -> suggestions for hot prefixes; protects the trie service"},
            {"name": "Log Collector (Kafka)", "responsibility": "Stream of all query events for frequency updates"},
            {"name": "Aggregator", "responsibility": "Aggregate query counts per time window, rebuild trie snapshot"},
            {"name": "Query Store (DB)", "responsibility": "Persist query -> count for cold restarts and analytics"},
        ],
        "tradeoffs": [
            "Trie vs prefix-hash: trie gives prefix-walk properties and memory savings; hash-of-prefix is faster to build but needs all-prefixes precomputed",
            "Store top-k in each trie node vs compute at query time: cached c in node = O(k) answer; computing costs a subtree walk",
            "Precompute on aggregation window (e.g., 10 min) vs online update: batching is simpler and the suggestions are tolerant to a few minutes of staleness",
            "One big trie vs sharded by prefix: sharding by first character enables scale-out; hot shards still fine given the small hot set",
            "Client-side cache: big latency win but risks serving stale popular suggestions — acceptable for typeahead",
        ],
        "reference_diagram": {
            "nodes": [
                _n("client", 0, 180, "Client (typing box)", "input"),
                _n("gw", 250, 180, "API Gateway"),
                _n("cache", 250, 380, "Redis (prefix->suggestions)"),
                _n("sug", 500, 180, "Suggestion Service (in-memory trie)"),
                _n("agg", 500, 380, "Aggregator (10-min snapshots)"),
                _n("kafka", 740, 380, "Query Log (Kafka)"),
                _n("store", 740, 130, "Query Store (DB)"),
            ],
            "edges": [
                _e("e1", "client", "gw", "GET /suggest?q=..."),
                _e("e2", "gw", "cache", "prefix lookup"),
                _e("e3", "cache", "sug", "miss -> trie"),
                _e("e4", "sug", "cache", "populate cache"),
                _e("e5", "sug", "store", "update counts"),
                _e("e6", "client", "kafka", "typing events"),
                _e("e7", "kafka", "agg", "stream"),
                _e("e8", "agg", "sug", "new trie snapshot"),
            ],
        },
    },
    {
        "slug": "design-instagram",
        "title": "Design Instagram",
        "difficulty": "medium",
        "topics": ["Feed Generation", "Object Storage", "Caching"],
        "overview": (
            "Design photo/video sharing like Instagram. Core challenges: **upload pipeline** (photos → object "
            "store + async thumbnail/media processing), **feed** (fan-out on read/write hybrid), and **timeline** "
            "ranked by recency. This is the classic 'Design a photo-sharing service' question."
        ),
        "functional_requirements": [
            "Users upload photos/videos, apply metadata (caption, hashtags)",
            "Users follow others; each user has a home feed of recent posts from people they follow",
            "View a user's profile posts; like/comment on posts",
            "Media is served fast worldwide with multiple resolutions",
        ],
        "non_functional_requirements": [
            "Availability 99.9%; write-heavy on media, fan-out read-heavy",
            "Upload latency < 1s to acknowledgment; feed load < 300ms",
            "Consistency: eventual is fine for likes/comments; media writes durable",
            "Scales to 500M+ users, ~10M new posts/day",
        ],
        "capacity": {
            "Users": "500M DAU",
            "Posts per day": "10M (avg ~5 MB photo + video)",
            "Media storage/day": "10M * 5 MB \u2248 50 TB/day",
            "Feed reads/day": "500M users * 5 feed loads * ~20 posts each",
            "Follow graph": "total follows ~50B edges",
            "Cache for hot feeds": "top 20% users' timelines in Redis",
        },
        "key_components": [
            {"name": "API Gateway / Load Balancer", "responsibility": "Route + auth for upload/list/like endpoints"},
            {"name": "Media Service", "responsibility": "Chunked upload, generate multiple resolutions/thumbnails"},
            {"name": "Object Store (S3-like)", "responsibility": "Immutable original + processed media, CDN origin"},
            {"name": "Post Service", "responsibility": "Insert post metadata (user_id, caption, media refs)"},
            {"name": "Feed Service", "responsibility": "Hybrid fan-out: push to active users' feed cache, pull for inactive/celebrities"},
            {"name": "Timeline Cache (Redis)", "responsibility": "List of recent post ids per user for fast feed reads"},
            {"name": "Social Graph Service", "responsibility": "Follow/unfollow edges + follower lists, stored in sharded DB"},
            {"name": "CDN", "responsibility": "Serve media from edge nodes close to viewers"},
            {"name": "Async Processors", "responsibility": "Like/comment counts, notification fan-out, feed pruning"},
        ],
        "tradeoffs": [
            "Fan-out on write (push) for normal users vs on read (pull) for celebrities: prevents stampede on huge follower lists",
            "Rank feed by time vs engagement: recency is simple and predictable; engagement needs an ML service and a heavy read path",
            "Store medata vs media in same DB: keep huge blobs out of Postgres; media in object store, small rows in DB",
            "Synchronous post insert vs async: media processing is async (ack upload fast); post metadata insert is sync so it appears immediately",
            "Cache whole feed for hot users vs only ids: ids-only cache is compact and allows lazy hydration of post metadata",
        ],
        "reference_diagram": {
            "nodes": [
                _n("user", 0, 300, "Mobile client", "input"),
                _n("gw", 250, 300, "API Gateway"),
                _n("media", 500, 120, "Media Service"),
                _n("objstore", 740, 120, "Object Store"),
                _n("post", 500, 300, "Post Service"),
                _n("feed", 740, 300, "Feed Service (fan-out)"),
                _n("timeline", 980, 300, "Timeline Cache (Redis)"),
                _n("social", 740, 460, "Social Graph Service"),
                _n("cdpn", 980, 120, "CDN / Edge"),
            ],
            "edges": [
                _e("e1", "user", "gw", "POST /post, GET /feed"),
                _e("e2", "gw", "media", "upload"),
                _e("e3", "media", "objstore", "save media"),
                _e("e4", "gw", "post", "post metadata"),
                _e("e5", "post", "feed", "fan out"),
                _e("e6", "feed", "timeline", "push timelines"),
                _e("e7", "feed", "social", "follower list"),
                _e("e8", "objstore", "cdpn", "edge cache"),
            ],
        },
    },
    {
        "slug": "design-file-storage-dropbox",
        "title": "Design File Sync / Dropbox",
        "difficulty": "hard",
        "topics": ["Object Storage", "Sync", "Conflict Resolution"],
        "overview": (
            "Design a cloud file-storage and sync service like Dropbox/Google Drive. The core challenges: "
            "**sync** (replicate local changes to server and to other devices), **deduplication via content "
            "hashing** (only upload changed chunks), **conflict resolution** (two devices edit the same file), "
            "and **large-file uploads**."
        ),
        "functional_requirements": [
            "Upload/download files, MKCOL folders, rename, move",
            "Multi-device sync: a change on one device propagates to all others",
            "Share files/folders with other users (including external links)",
            "Version history and trash/undo",
        ],
        "non_functional_requirements": [
            "Consistency: 1000 reads/sec vs writes at scale; conflict-free most of the time",
            "Sync latency: propagate changes to other devices within seconds",
            "Bandwidth efficient: only upload deltas (chunk-level dedupe)",
            "Scalability: 1M+ users, ~10 GB avg per user — ~10 PB total",
        ],
        "capacity": {
            "Users": "1M active, 10M registered",
            "Avg storage per user": "10 GB",
            "Total storage": "~10 PB (S3/object store)",
            "Upload bandwidth needed": "10M registered * 1 file/day avg 2 MB \u2248 20 TB/day \u2248 230 MB/s steady",
            "Chunk metadata rows": "each file ~100 chunks; 100M files * 100 chunks * ~150 bytes \u2248 1.5 TB in metadata DB",
            "Notifications": "~10M change events/day to fan out to devices",
        },
        "key_components": [
            {"name": "Client", "responsibility": "Watch dir, hash chunks (e.g., SHA-256), upload deltas, apply server deltas"},
            {"name": "API / Sync Service", "responsibility": "Coordinate uploads/downloads; resolve conflicts; track file versions"},
            {"name": "Metadata DB", "responsibility": "File tree per user, file id, version, chunk list (Postgres/MySQL, sharded)"},
            {"name": "Chunk/Block Store", "responsibility": "Content-addressed object store (S3/GCS) — chunk hash = key"},
            {"name": "Content-Address DB", "responsibility": "hash -> chunk location, ref-counted for dedupe"},
            {"name": "Notification / WebSocket bus", "responsibility": "Push change events to connected devices instantly"},
            {"name": "File Server (upload temp)", "responsibility": "Receive chunked uploads, assemble and verify before commit"},
        ],
        "tradeoffs": [
            "Chunk-level vs whole-file dedupe: chunking saves bandwidth on tiny edits but adds metadata complexity and false-positive hashing",
            "Client round-robin push vs server pull for sync: notifications give instant sync; server-side pull is simpler but slower",
            "Single-writer-last-write-wins vs version branching like git: LWW is simple and typical; versioning is complex but safer",
            "Store full history vs just latest: history costs many chunks but enables undo; Dropbox stores ~30 days",
            "Centralized metadata vs local-first CRDTs: centralized is much easier to keep consistent and to audit",
        ],
        "reference_diagram": {
            "nodes": [
                _n("dev1", 0, 60, "Device 1", "input"),
                _n("dev2", 0, 220, "Device 2", "input"),
                _n("gw", 250, 140, "API / Sync Service"),
                _n("meta", 500, 60, "Metadata DB (files, versions)"),
                _n("chunks", 500, 220, "Chunk Store (content-address)"),
                _n("mutable", 740, 140, "Notifications (WS bus)"),
            ],
            "edges": [
                _e("e1", "dev1", "gw", "upload chunks"),
                _e("e2", "gw", "meta", "write file version"),
                _e("e3", "gw", "chunks", "store blob"),
                _e("e4", "gw", "mutable", "notify"),
                _e("e5", "mutable", "dev2", "sync delta"),
                _e("e6", "dev2", "gw", "download chunks"),
            ],
        },
    },
    {
        "slug": "design-ride-hailing",
        "title": "Design Ride-Hailing (Uber/Lyft)",
        "difficulty": "hard",
        "topics": ["Geospatial", "Real-time", "Matching"],
        "overview": (
            "Design a ride-hailing service like Uber. The core engines: **location ingestion** (drivers stream "
            "GPS constantly), **matching** (pair rider with nearest available driver via geo-indexing), **pricing** "
            "(surge), and **trip state machine** (requested \u2192 accepted \u2192 en-route \u2192 in-trip \u2192 done)."
        ),
        "functional_requirements": [
            "Drivers continuously update their live location",
            "Riders request a ride; system returns nearest available driver",
            "Track trip lifecycle and both parties' live positions on a map",
            "Fare estimation, surge pricing, driver ratings",
        ],
        "non_functional_requirements": [
            "Latency: driver location updated < 5s; match decision < 5s; map updates < 1s",
            "Availability 99.99% — a ride-hailing outage is a safety incident",
            "Handles spikes (rush hour, events): 100x traffic peaks",
            "Guaranteed ordering per driver for location events",
        ],
        "capacity": {
            "Active vehicles (city)": "~50K (global: 1M+ drivers)",
            "Location events": "every ~4s per driver → 1M/4 \u2248 250K updates/s globally",
            "Rider requests": "peak ~10K-50K/s",
            "Geo lookup": "nearest-driver query at request rate; bounded by lateral (grid) cells",
            "Trip history storage": "~1M trips/day * a few hundred KB (route, events) → big-data store",
        },
        "key_components": [
            {"name": "Mobile Apps", "responsibility": "Emit GPS, show live maps, handle trip state"},
            {"name": "Driver Location Service", "responsibility": "Ingest+pure streaming GPS into geohash-based grid cells"},
            {"name": "Geo Index", "responsibility": "Sharded in-memory grid: cell → drivers; O(1) cell lookup, expand ring on miss"},
            {"name": "Dispatcher / Matching Service", "responsibility": "Match rider to nearest available driver, reserve driver atomically"},
            {"name": "Trip State Machine Service", "responsibility": "Rule lineage of trip states; source of truth for both parties"},
            {"name": "Fare / Surge Service", "responsibility": "Compute base+time+distance fares and surge multipliers"},
            {"name": "Time-series / Log store", "responsibility": "GPS histories, trip events for analytics and audit"},
        ],
        "tradeoffs": [
            "Geohash grid vs QuadTree / k-d tree: grids are trivially shardable and parallelizable; quadtrees adapt to density but complicate partitioning",
            "In-memory grid vs DB for driver locations: must be memory (latency); DB is only a durability sink",
            "Push-to-rider-first vs broadcast match: a reserved (locked) driver prevents double booking; broadcast leads to races",
            "Surge pricing transparent vs algorithmic: algorithmic is confiscatory in emergencies; transparency/privacy trade-off is a product decision",
            "Central matching vs local (edge) matching: an edge-based match reduces WAN latency but weakens global optimization",
        ],
        "reference_diagram": {
            "nodes": [
                _n("drivers", 0, 60, "Driver app (GPS)", "input"),
                _n("riders", 0, 300, "Rider app", "input"),
                _n("loc", 250, 60, "Location Ingestion"),
                _n("geo", 500, 60, "Geo Index (shards by geohash)"),
                _n("dispatch", 500, 300, "Dispatcher / Matching"),
                _n("state", 740, 180, "Trip State Service"),
                _n("fare", 500, 460, "Fare/Surge Service"),
                _n("hist", 980, 60, "Time-series Store"),
                _n("realtime", 740, 460, "Realtime Push (WS)"),
            ],
            "edges": [
                _e("e1", "drivers", "loc", "GPS stream"),
                _e("e2", "loc", "geo", "upsert cell"),
                _e("e3", "riders", "dispatch", "request"),
                _e("e4", "dispatch", "geo", "nearby query"),
                _e("e5", "dispatch", "state", "create trip"),
                _e("e6", "dispatch", "fare", "estimate"),
                _e("e7", "state", "realtime", "push status"),
                _e("e8", "state", "hist", "audit events"),
            ],
        },
    },
    {
        "slug": "design-video-streaming",
        "title": "Design Video Streaming (Netflix)",
        "difficulty": "hard",
        "topics": ["CDN", "Encoding", "Video"],
        "overview": (
            "Design a video-on-demand service like Netflix. The core is the **playback path**: upload/ingest → "
            "transcode into multiple renditions → origin store → CDN edge → adaptive bitrate client. This is "
            "'Design a video streaming / Netflix' — a favorite for remote senior/mid loops."
        ),
        "functional_requirements": [
            "Upload videos; transcode to multiple resolutions/bitrates",
            "Stream with adaptive bitrate (switch quality based on bandwidth)",
            "Resume playback, seek, handle unstable networks",
            "Catastrophe-proof binge-watching scale",
        ],
        "non_functional_requirements": [
            "Start playback in < 2s p90; buffer ratio < 1%",
            "99.99% availability for the streaming path",
            "Optimize total bytes served (cache hit ratio drives CDN costs)",
            "Global delivery with local edge presence",
        ],
        "capacity": {
            "Subscribers": "200M+ (Netflix scale)",
            "Peak concurrent streams": "~20% of subscribers == half at 50M streams",
            "Bits per stream": "4.7 Mbps avg (HD ~5 Mbps, UHD 15-25 Mbps)",
            "Peak bandwidth": "50M streams * 5 Mbps \u2248 40 Tbps at edge+CDN",
            "Catalog size": "~20K titles, encoded into ~5 renditions each",
            "Storage": "Videos * renditions * average film size ~ GB-scale — PB total at origin",
        },
        "key_components": [
            {"name": "Streaming Client (player)", "responsibility": "Adaptive bitrate: fetch manifest, request segments per bandwidth"},
            {"name": "CDN Edge", "responsibility": "Serve segments from edge cache; fetch from origin on miss"},
            {"name": "Origin Storage", "responsibility": "Encoded originals/renditions; replicas for CDN prefetch"},
            {"name": "Transcode Pipeline", "responsibility": "Ingest upload; HLS/DASH packaging; multiple renditions (async, queue-driven)"},
            {"name": "API / Metadata Service", "responsibility": "Auth, entitlements, watch history, recommendation calls"},
            {"name": "Catalog DB", "responsibility": "Titles, waveforms, licensing window/filters per region"},
            {"name": "Manifest/Control", "responsibility": "Per-session streaming token + segment URLs authorization"},
        ],
        "tradeoffs": [
            "CDN edge caching vs direct origin: edge reduces origin load by 20-50x but creates cache coherence (tombstones for expiry)",
            "Fragment size (2-4s HLS vs longer) vs latency: short segments speed up quality switches but increase metadata overhead",
            "Adaptive bitrate on client vs server: client-side (Apple HLS) is standard; server-computed adaptation adds intelligence but complexity",
            "Precompute all renditions vs on-demand transcode: precompute is predictable for catalog; hot new titles may need priority lanes",
            "Tiered caching (edge → regional → origin) vs flat: tiering amortizes origin cost; flat is simpler but more origin egress",
        ],
        "reference_diagram": {
            "nodes": [
                _n("studio", 0, 60, "Ingest (studio upload)", "input"),
                _n("encode", 250, 60, "Transcode Pipeline"),
                _n("origin", 500, 60, "Origin Storage"),
                _n("edge", 740, 220, "CDN Edge(s)"),
                _n("player", 980, 220, "Streaming Client", "output"),
                _n("catalog", 500, 460, "Catalog/Metadata DB"),
                _n("api", 740, 460, "API Service"),
            ],
            "edges": [
                _e("e1", "studio", "encode", "upload raw"),
                _e("e2", "encode", "origin", "renditions"),
                _e("e3", "origin", "edge", "segment fetch"),
                _e("e4", "edge", "player", "HLS segments"),
                _e("e5", "player", "api", "manifest/token"),
                _e("e6", "api", "catalog", "entitlements"),
            ],
        },
    },
    {
        "slug": "design-distributed-message-queue",
        "title": "Design a Distributed Message Queue (Kafka)",
        "difficulty": "hard",
        "topics": ["Distributed Systems", "Messaging", "Consensus"],
        "overview": (
            "Design a distributed, fault-tolerant message queue like Kafka/Amazon SQS. The core ideas: **log-based "
            "storage** (appends are cheap, ordered per partition), **partitions** (parallelism + ordering within a "
            "partition), **replication with leader election** (survive broker loss), and **consumer groups** (each "
            "message processed once, roughly, per group)."
        ),
        "functional_requirements": [
            "Producers publish messages to topics; consumers read them",
            "Ordered delivery within a partition",
            "At-least-once delivery; consumers can acknowledge/commit offsets",
            "Message retention (e.g., 7 days) independent of consumption",
        ],
        "non_functional_requirements": [
            "Durability: acks only after replication to quorum of replicas",
            "Throughput: 100K-1M msgs/s per broker cluster",
            "Version B: ordered per partition, no cross-partition ordering guarantees",
            "Availability: tolerate loss of at least one broker without losing data",
        ],
        "capacity": {
            "Messages per second": "1M+ across the cluster",
            "Message size": "assume 1 KB (write-heavy)",
            "Throughput per broker": "sustained 500 Mbps-1 Gbps of log I/O",
            "Retention": "1 TB + per broker (7 days of event stream)",
            "Consumers": "10K+ consuming concurrently in groups",
            "Offsets": "per (consumer group, partition) — cheap, kept in ZooKeeper/KRaft metadata",
        },
        "key_components": [
            {"name": "Producers", "responsibility": "Send records to a partition (key → consistent hash)"},
            {"name": "Brokers", "responsibility": "Append records to segmented logs; serve fetches; replicate to followers"},
            {"name": "Partitions", "responsibility": "The unit of ordering + parallelism; each has 1 leader, N followers"},
            {"name": "Log Segments", "responsibility": "Sequential file segments on disk (mmap-indexed), enabling zero-copy serving"},
            {"name": "Controller / Metadata (KRaft)", "responsibility": "Leadership, partition assignment, cluster metadata"},
            {"name": "Consumers / Consumer Groups", "responsibility": "Fetchers with committed offsets; rebalance on membership change"},
        ],
        "tradeoffs": [
            "Partition-per-ordering vs global ordering: per-partition ordering is what allows parallelism; global ordering would make every broker serial",
            "At-least-once vs exactly-once: at-least-once + idempotent producers (or dedupe downstream) is the pragmatic standard; true EOS needs a transaction protocol",
            "Ack after quorum vs after leader only: quorum ack trades latency for durability; leader-only risks losing acknowledged writes",
            "Zero-copy sendfile vs user-space buffering: sendfile keeps producers' records out of userspace, huge throughput win",
            "Log-as-source-of-truth vs DB-queue: log semantics (append) + broker crash tolerance make Kafka the standard; SQS is simpler, fewer guarantees, easier ops",
        ],
        "reference_diagram": {
            "nodes": [
                _n("prod", 0, 180, "Producers", "input"),
                _n("part1", 500, 60, "Partition 0 (leader)"),
                _n("part2", 500, 180, "Partition 1 (leader)"),
                _n("broker", 250, 180, "Broker Cluster"),
                _n("replicas", 740, 180, "Replicas (followers)"),
                _n("cons", 980, 180, "Consumer Groups", "output"),
            ],
            "edges": [
                _e("e1", "prod", "broker", "publish (key→partition)"),
                _e("e2", "broker", "part1", "append"),
                _e("e3", "broker", "part2", "append"),
                _e("e4", "part1", "replicas", "replication"),
                _e("e5", "part2", "replicas", "replication"),
                _e("e6", "replicas", "cons", "fetch + commit offset"),
            ],
        },
    },
    {
        "slug": "design-location-based-service",
        "title": "Design Nearby Places / Geosearch",
        "difficulty": "medium",
        "topics": ["Geospatial", "Indexing", "Caching"],
        "overview": (
            "Design a 'nearby places' service (like Google Maps / Yelp): given a lat/lon, return the nearest "
            "points of interest (restaurants, gas stations) within a radius. Also covers **route/DIRECTION is out "
            "of scope** unless asked. The classic answer: **geohash or S2 cells**, an **inverted grid index**, and "
            "result caching."
        ),
        "functional_requirements": [
            "Query: given lat/lon + radius, return nearby POIs sorted by distance",
            "Support category filters (restaurants, cafes, gas)",
            "POI dataset updates (add/edit/remove) propagates to search within minutes",
            "Optional: cluster POIs on a map view",
        ],
        "non_functional_requirements": [
            "p99 latency < 200ms for a nearby query",
            "Scale to 100M DAU users, ~500K req/s peak across regions",
            "Availability 99.9%; read-heavy workload",
            "Horizontal add — regionally sharded by geohash prefix",
        ],
        "capacity": {
            "POIs indexed": "~1B worldwide (~100M in dense cities)",
            "Query QPS": "500K peak",
            "Result size": "top 20 page of results returned at once",
            "Cache hit ratio": ">80% for repeat/social queries",
            "Index size": "1B POIs * ~500 bytes in memory ≈ 500 GB (sharded)",
        },
        "key_components": [
            {"name": "API / Gateway", "responsibility": "Validate lat/lon/radius, rate limit"},
            {"name": "Geo Query Service", "responsibility": "Map user request → geohash/S2 prefix → query the correct shard"},
            {"name": "Grid Index (shards)", "responsibility": "In-memory inverted cells: geohash → sorted POI ids by distance"},
            {"name": "Result Cache (Redis)", "responsibility": "Cache (cell, filters) → result ids for hot cells"},
            {"name": "POI Store (DB)", "responsibility": "POI metadata (name, category, rating), source of truth"},
            {"name": "Ingest / Update Pipeline", "responsibility": "Batch + CDC updates rebuild affected grid cells periodically"},
        ],
        "tradeoffs": [
            "Geohash vs S2 cells: geohash simple + widely understood; S2 has hierarchical cells better suited to variable density",
            "Precompute per-cell sorted lists vs compute on the fly: precompute keeps query O(top-k) but storage grows; compute scales cell size",
            "Static grid vs dynamic (quadtree): static grid rebalancing is rare at 200-1000 m cells; dynamic trees adapt but are harder to shard",
            "Cell cache vs query cache: cell cache has enormous hit rates near city centers; query cache (per lat/lon) is less reusable",
            "Shard by geohash prefix vs country: prefix sharding keeps regional queries in-region; country sharding is uneven",
        ],
        "reference_diagram": {
            "nodes": [
                _n("client", 0, 240, "Client (map app)", "input"),
                _n("gw", 250, 240, "Geo API Gateway"),
                _n("service", 500, 240, "Geo Query Service"),
                _n("grid", 740, 60, "Grid Index shard (geohash)"),
                _n("cache", 740, 420, "Result Cache (Redis)"),
                _n("pois", 980, 240, "POI Store (DB)"),
                _n("ingest", 500, 440, "POI Ingest Pipeline"),
            ],
            "edges": [
                _e("e1", "client", "gw", "nearby?lat&lon&r"),
                _e("e2", "gw", "service", "query"),
                _e("e3", "service", "cache", "hit? (cell,filters)"),
                _e("e4", "service", "grid", "cell scan"),
                _e("e5", "grid", "pois", "hydrate ids"),
                _e("e6", "ingest", "grid", "rebuild cells"),
                _e("e7", "grid", "pois", "poi metadata"),
            ],
        },
    },
    {
        "slug": "design-distributed-cache",
        "title": "Design a Distributed Cache (Redis-style)",
        "difficulty": "medium",
        "topics": ["Caching", "Consistent Hashing", "Replication"],
        "overview": (
            "Design a distributed cache service like Redis/Memcached: a key-value datastore with high throughput, "
            "TTL expiry, and graceful scale-out. Core ideas: **consistent hashing** for placement with minimal "
            "resharding, **replication** for fault tolerance, and **expiry strategies** (lazy + active)."
        ),
        "functional_requirements": [
            "GET/SET/EXPIRE operations on keys of a few KB and values of KB-MB",
            "TTL expiry so stale data disappears",
            "Horizontal scaling across many cache nodes, tolerating node loss",
            "Best-effort consistency (a cache is allowed to lose entries)",
        ],
        "non_functional_requirements": [
            "Throughput: 100K-1M ops/s per cluster (Memcached ~ 10-20K/s/core)",
            "Latency p99 < 1ms intra-DC",
            "Availability 99.99% with replication; loss of a shard is survivable",
            "Ops-friendly scaling with minimal key re-mapping",
        ],
        "capacity": {
            "Key space": "tens of billions of keys",
            "Total cache capacity": "multi-TB across nodes",
            "Per-node": "64-128 GB RAM",
            "Ops/s": "peak 1M ops/s cluster-wide",
            "Replication overhead": "2x memory if 1 replica per shard",
        },
        "key_components": [
            {"name": "Cache Clients (SDK)", "responsibility": "Consistent-hash directly to the right shard; local fallback"},
            {"name": "Cache Nodes", "responsibility": "In-memory dict with TTL, eviction (LRU/LFU)"},
            {"name": "Consistent Hash Ring", "responsibility": "Assign keys to nodes; virtual nodes for balance"},
            {"name": "Replication", "responsibility": "Leader-replica per shard; replica serves reads, takes over on fail"},
            {"name": "Controller / Cluster Manager", "responsibility": "Membership, rebalance, re-shard with minimal movement"},
            {"name": "Persistence (optional)", "responsibility": "AOF snapshot or WAL for crash recovery (Redis AOF)"},
        ],
        "tradeoffs": [
            "Consistent hashing vs simple modulo: modulo breaks nearly all keys on resize; consistent hashing moves ~1/n",
            "LRU vs LFU vs TTL: LRU simple and cache-friendly; LFU better for skewed workloads; TTL is what most products need for freshness",
            "Lazy + active expiry vs strict: scanning all keys is O(n); lazy-on-access + sampled active sweep is the standard Redis approach",
            "Leader-follower replication vs multi-primary: leader-replica gives strong read-your-writes with 1 replica; multi-primary adds conflict windows",
            "In-memory only vs with persistence: pure cache (Memcached) loses all entries on restart; AOF gives recovery at cost of write throughput",
        ],
        "reference_diagram": {
            "nodes": [
                _n("apps", 0, 240, "App servers", "input"),
                _n("ring", 250, 240, "Consistent Hash Ring"),
                _n("n1", 500, 60, "Shard A (leader)"),
                _n("n2", 500, 240, "Shard B (leader)"),
                _n("n3", 500, 420, "Shard C (leader)"),
                _n("rep", 740, 60, "Replica A"),
                _n("rep2", 740, 420, "Replica C"),
                _n("ctl", 980, 240, "Cluster Manager"),
            ],
            "edges": [
                _e("e1", "apps", "ring", "GET/SET"),
                _e("e2", "ring", "n1", "α"),
                _e("e3", "ring", "n2", "β"),
                _e("e4", "ring", "n3", "γ"),
                _e("e5", "n1", "rep", "sync"),
                _e("e6", "n3", "rep2", "sync"),
                _e("e7", "ctl", "n1", "rebalance"),
            ],
        },
    },
]