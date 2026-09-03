"""
Infer a semantic diagram node `kind` from its human label.

The frontend renders each architecture node with an icon + shape + colour keyed
off `kind` (see frontend/src/components/SystemDesignNodes.tsx). Seed reference
diagrams only carry descriptive labels, so this maps a label like
"Query Log (Kafka)" -> "stream" without hand-tagging every node.

Keep the vocabulary in sync with the NodeKind union on the frontend and the
prompt legends in system_design_ai.py / sd_prompts.py.
"""
import re

VALID_KINDS = {
    "client", "load_balancer", "api_gateway", "service", "worker",
    "database", "cache", "object_storage", "search", "warehouse",
    "queue", "stream", "cdn", "external",
}

DEFAULT_KIND = "service"


def infer_kind(label: str, override: str = None) -> str:
    """Best-effort map a node label to a kind. `override` wins if valid."""
    if override in VALID_KINDS:
        return override

    t = (label or "").lower()

    def has(*keywords):
        return any(k in t for k in keywords)

    # Edge / traffic (most specific first)
    if has("cdn", "edge cache", "edge server") or "/ edge" in t:
        return "cdn"
    if has("load balancer", "load-balancer") or re.search(r"\blb\b", t):
        return "load_balancer"
    if has("gateway", "api gw"):
        return "api_gateway"

    # Messaging — checked before cache so "Queue (Kafka/Redis)" resolves correctly
    if has("queue"):
        return "queue"
    if has("kafka", "kinesis", "pulsar", "event log", "event stream", "stream", "pub/sub", "pubsub"):
        return "stream"

    # Caches
    if has("cache", "redis", "memcached"):
        return "cache"

    # Storage & analytics
    if has("object store", "object storage", "blob", "s3", "hdfs", "bucket", "file store", "media store"):
        return "object_storage"
    if has("warehouse", "snowflake", "bigquery", "redshift", "olap", "analytics"):
        return "warehouse"
    if has("elasticsearch", "inverted index", "search"):
        return "search"

    # Databases
    if has("database", "postgres", "mysql", "cassandra", "mongo", "dynamo", "bigtable", "metadata", "sql") \
            or re.search(r"\bdb\b", t) or "store" in t:
        return "database"

    # Compute
    if has("worker", "crawler", "consumer", "processor", "pipeline", "indexer", "extractor", "scheduler", "cron", "job"):
        return "worker"
    if has("client", "user", "device", "mobile", "browser", "frontend"):
        return "client"
    if has("third-party", "external", "3rd party"):
        return "external"

    return DEFAULT_KIND
