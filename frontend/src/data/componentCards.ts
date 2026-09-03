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
    lesson: {
      problem:
        "You're designing a mobile app and someone asks 'where does the request even start?' It's tempting to jump straight to servers and databases, but the client is where latency, retries, and trust actually begin. A user on a flaky train connection taps 'post' three times because the spinner didn't move — and now you have three posts. The design ignored the messiest, least controllable part of the system: the device in someone's hand.",
      mentalModel:
        "Treat the client as hostile territory you don't control. It's the origin of every request — and of every lie: it can send malformed data, replay old requests, run on a three-year-old phone, or drop the network mid-write. Your real decisions are how much work lives on the device (thick client) versus the server (thin client), knowing that anything the client does, an attacker can do too.",
      howItWorks:
        "The client renders UI, holds some local state, and talks to your backend over HTTP/WebSocket. Thick clients (mobile apps, SPAs) cache data, work offline, and do optimistic updates — showing the result before the server confirms, then reconciling. Thin clients keep logic on the server and ship HTML. Reliability comes from retries with backoff, idempotency keys so a retried 'create' doesn't duplicate, and timeouts so a dead connection doesn't hang forever.",
      why:
        "Why can't you trust the client to validate input or enforce limits? Because it runs on the user's machine — anything it enforces, the user can bypass by disabling JS, editing the request, or replaying it. So validation and authorization are a server responsibility; the client's version is a UX convenience, not a security boundary. Optimistic updates feel instant precisely because they lie about success, which is exactly why you need a reconciliation path for when the server disagrees.",
      pitfalls: [
        {
          title: "Trusting client input",
          detail:
            "Client-side validation improves UX but enforces nothing — a request can be crafted by hand. Always re-validate and re-authorize on the server; treat every field as attacker-controlled.",
        },
        {
          title: "Duplicate writes from retries",
          detail:
            "A flaky network makes clients retry. Without an idempotency key, a retried 'create payment' charges twice. Attach a client-generated key so the server can recognize and dedupe the retry.",
        },
        {
          title: "Stale local cache",
          detail:
            "On-device caches (localStorage, service workers) can serve data long after it changed server-side. Version your cache and define a refresh/invalidation strategy, or users report 'ghost' data.",
        },
      ],
      drills: [
        {
          scenario:
            "A user on a spotty connection taps 'Submit payment' twice because the UI didn't respond. How do you prevent a double charge?",
          options: [
            "Disable the button after the first tap",
            "Have the client send an idempotency key the server uses to dedupe",
            "Add a client-side 'are you sure?' dialog",
            "Retry only on the client, never the server",
          ],
          answerIndex: 1,
          explanation:
            "Button-disabling and dialogs are UX bandaids that break under retries, refreshes, or crafted requests. An idempotency key lets the server apply the charge exactly once — the only robust fix, because it doesn't rely on the client behaving.",
        },
        {
          scenario:
            "Your web client validates that an order total is positive before sending it. Is that enough?",
          options: [
            "Yes — validation on the client is sufficient",
            "No — the server must re-validate because the client can be bypassed",
            "Only if you also minify the JavaScript",
            "Only for logged-out users",
          ],
          answerIndex: 1,
          explanation:
            "Anything the client enforces, a user can bypass by editing the request. Client validation is a convenience; the server is the real boundary and must re-validate and re-authorize every request.",
        },
        {
          scenario:
            "You show a 'liked' heart instantly when tapped, before the server confirms. What must you also build?",
          options: [
            "Nothing — the tap is the source of truth",
            "A reconciliation path to roll back if the server rejects it",
            "A second confirmation tap",
            "A longer timeout",
          ],
          answerIndex: 1,
          explanation:
            "That's an optimistic update — it deliberately shows success before it's confirmed. If the server fails or rejects it, you must reconcile: roll the UI back and surface the error, or client and server silently diverge.",
        },
      ],
      tutorPrompt:
        "Quiz me on client-side design like an interviewer. Push me on the trust boundary, idempotency for retries, optimistic updates and reconciliation, and thick vs thin clients. Give scenarios, correct my reasoning, and don't let me treat client validation as security.",
    },
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
    lesson: {
      problem:
        "Your app is hosted in Virginia and doing fine — until it goes viral in Australia. Now every image, JS bundle, and video segment makes a 200ms+ trip across the Pacific, for every user, on every page load. Your origin is drowning in bandwidth for static files that never change, and users on the other side of the world think the app is broken because it's just... slow.",
      mentalModel:
        "A CDN is a fleet of caches parked near your users, all over the world. Instead of every request crossing the planet to your origin, it's served from a nearby city. The mental shift: static content shouldn't be 'fetched from your server' — it should live at the edge, and your origin should see each file at most once per edge per TTL.",
      howItWorks:
        "The CDN has points of presence (PoPs) in many cities. A request is routed — via anycast/DNS — to the nearest PoP. On a cache hit the PoP serves the file directly; on a miss it fetches from your origin once, caches it per the Cache-Control/TTL, and serves everyone else locally. You control freshness with TTLs and cache-busting: since you can't reliably reach into every PoP to purge, the standard trick is versioned URLs (app.v2.js or a content hash) so a new version is simply a new, guaranteed-miss key.",
      why:
        "Why versioned URLs instead of purging? Because invalidating one file across hundreds of edges is slow and unreliable, while changing the URL is instant and atomic — the old URL keeps serving old bytes, the new one is a guaranteed miss that fetches fresh. And why not cache personalized responses? Because the edge serves the same bytes to everyone hitting a key; if the response depends on who's asking, one user's data leaks to the next. CDNs are for content that's identical for everyone (or keyed with great care).",
      pitfalls: [
        {
          title: "Caching personalized responses",
          detail:
            "Cache a page containing the logged-in user's name and the next visitor sees it. Never cache per-user responses at a shared edge unless the cache key includes identity — and even then, tread carefully.",
        },
        {
          title: "Invalidating by purge instead of versioning",
          detail:
            "Relying on purging every PoP to ship an update is slow and racy. Use content-hashed / versioned URLs so a new version is a new key that physically cannot serve stale bytes.",
        },
        {
          title: "Long TTLs on things that change",
          detail:
            "A 1-day TTL on a file you just edited means users see the old one for a day. Match TTLs to change frequency; use short TTLs (or no-cache) for anything dynamic.",
        },
      ],
      drills: [
        {
          scenario:
            "You push a critical fix to app.js but users keep running the old code for hours — the file is on a CDN with a 24h TTL. Best fix going forward?",
          options: [
            "Lower the TTL to zero for all files",
            "Serve versioned / content-hashed filenames so each build is a new cache key",
            "Purge the CDN manually after every deploy",
            "Move app.js back to the origin only",
          ],
          answerIndex: 1,
          explanation:
            "Content-hashed filenames make every build a brand-new URL — guaranteed miss, fresh fetch, no stale bytes — without killing your hit rate. Zero TTL defeats the CDN; manual purges are slow and error-prone.",
        },
        {
          scenario: "Which of these should you NOT put behind a shared CDN cache?",
          options: [
            "Product images",
            "The minified JS bundle",
            "A page that greets the logged-in user by name",
            "Video segments",
          ],
          answerIndex: 2,
          explanation:
            "A shared edge serves identical bytes to everyone hitting that key, so a personalized page would leak one user's data to the next. Static, everyone-gets-the-same assets are the right fit.",
        },
        {
          scenario: "A CDN mainly improves your system by…",
          options: [
            "Making your database queries faster",
            "Serving cacheable content from a PoP near the user, cutting latency and origin load",
            "Encrypting traffic end to end",
            "Guaranteeing strong consistency globally",
          ],
          answerIndex: 1,
          explanation:
            "The CDN's job is edge caching: nearby PoPs serve static/cacheable content, slashing round-trip latency and offloading origin bandwidth. It doesn't touch your DB or provide strong consistency — edges are eventually consistent with the origin.",
        },
      ],
      tutorPrompt:
        "Interview me on CDNs. Probe cache invalidation (versioning vs purge), what's safe to cache vs personalized content, TTL choices, and how the edge relates to the origin. Give scenarios and correct my reasoning.",
    },
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
    lesson: {
      problem:
        "One app server was fine at launch. Now traffic has 10×'d, that box is pegged at 100% CPU, and when it crashes at 2am the whole product is down until someone reboots it. You want to run five servers instead of one — but now which server does a user's request go to, and what happens when one dies mid-request?",
      mentalModel:
        "A load balancer is the traffic cop in front of a pool of identical servers. Clients talk to one stable address; the LB decides which healthy backend actually handles each request and quietly stops routing to any box that fails its health check. The key enabler: the servers behind it must be interchangeable — any can serve any request — which is exactly why they have to be stateless.",
      howItWorks:
        "The LB accepts connections and forwards them to backends by an algorithm (round-robin, least-connections, hash-based). It continuously health-checks each backend and ejects unhealthy ones, so a dead server simply stops receiving traffic. L4 balancers route on TCP/IP (fast, protocol-agnostic); L7 balancers understand HTTP and can route by path, header, or cookie, terminate TLS, and distribute more smartly — at higher cost. To keep the LB itself from being the single point of failure, you run redundant LBs fronted by anycast or DNS.",
      why:
        "Why must the backends be stateless? Because the LB can send consecutive requests from one user to different servers. If server A holds that user's session in local memory, a request landing on server B has no idea who they are. So you push session/state to a shared store (cache or DB) and keep servers interchangeable. 'Sticky sessions' pin a user to one server as a workaround, but they skew load and lose the user's state when that server dies — which is why shared state is the cleaner answer.",
      pitfalls: [
        {
          title: "The LB as a single point of failure",
          detail:
            "If all traffic funnels through one LB and it dies, everything is down. Run redundant LBs (active-active or active-passive) fronted by anycast/DNS so there's no single choke point.",
        },
        {
          title: "Local session state behind the LB",
          detail:
            "Storing sessions in a server's memory breaks the moment the LB routes the user elsewhere. Keep servers stateless; put sessions in Redis or the DB.",
        },
        {
          title: "Sticky sessions as a crutch",
          detail:
            "Pinning users to a server restores local state but skews load and loses that state on server failure. Prefer shared state; use stickiness only when unavoidable.",
        },
      ],
      drills: [
        {
          scenario:
            "Behind your load balancer, users randomly get logged out. Sessions are stored in each server's local memory. Why?",
          options: [
            "The LB is misconfigured to drop cookies",
            "The LB routes requests to different servers, which don't share the in-memory session",
            "The database is too slow",
            "TLS is terminating in the wrong place",
          ],
          answerIndex: 1,
          explanation:
            "The LB spreads requests across interchangeable servers, but local memory isn't shared — a request landing on a different box finds no session. Move sessions to a shared store (Redis/DB) so any server can serve any user.",
        },
        {
          scenario:
            "You need to route /api/* to one service pool and /images/* to another, based on the URL path. What do you need?",
          options: [
            "An L4 (TCP) load balancer",
            "An L7 (HTTP-aware) load balancer",
            "A second database",
            "A CDN only",
          ],
          answerIndex: 1,
          explanation:
            "Routing by URL path requires understanding HTTP, which is L7. An L4 LB only sees TCP/IP and can't inspect paths or headers. L7 costs a bit more but enables path/header/cookie routing and TLS termination.",
        },
        {
          scenario: "How do you keep the load balancer itself from being a single point of failure?",
          options: [
            "Give it a bigger machine",
            "Run redundant LBs fronted by DNS round-robin or anycast",
            "Disable health checks",
            "Route all traffic through one region",
          ],
          answerIndex: 1,
          explanation:
            "Scaling up one LB doesn't remove the single failure point. Redundant LBs behind anycast/DNS mean that if one dies, traffic still has a path — the tier itself becomes fault-tolerant.",
        },
      ],
      tutorPrompt:
        "Grill me on load balancers. Cover why backends must be stateless, L4 vs L7, health checks and failover, sticky sessions vs shared state, and avoiding the LB as a single point of failure. Scenarios, then correct me.",
    },
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
    lesson: {
      problem:
        "You've split your monolith into a dozen microservices. Now every one of them re-implements auth, rate limiting, logging, and CORS — slightly differently, with slightly different bugs. Your mobile app has to know the address of all twelve and stitch their responses together. Adding a thirteenth cross-cutting concern means editing thirteen codebases. Something needs to sit in front.",
      mentalModel:
        "An API gateway is the single front door to a fleet of services. Clients talk only to the gateway, which handles the concerns every service shares — authentication, rate limiting, routing, request shaping — in one place, then forwards the real request inward. The rule that keeps it healthy: it does cross-cutting plumbing, never business logic. The moment domain rules leak in, it becomes a god-object every team fears to touch.",
      howItWorks:
        "The gateway terminates the client connection, authenticates and authorizes the request (validating a token once so downstream services can trust it), applies rate limits and quotas, then routes to the right internal service — often rewriting paths or aggregating several service calls into one response (the backend-for-frontend pattern). It's stateless, so you run several instances behind a load balancer. Everything it does is edge work: policy and shaping, not deciding what an order or a payment means.",
      why:
        "Why centralize auth and rate limiting instead of letting each service do it? Because duplicating a security-critical policy across a dozen services guarantees drift and holes — one service forgets a scope check and you have a breach. Doing it once at the gateway makes the policy consistent and auditable. But why keep business logic out? Because the gateway sits on every request's critical path; fatten it with domain rules and it becomes both a performance bottleneck and a deployment chokepoint that couples every team together.",
      pitfalls: [
        {
          title: "Business logic creeping in",
          detail:
            "It's tempting to add 'just one' domain rule at the gateway. Do it enough and it becomes a god-object on the critical path that every team must coordinate to change. Keep it to cross-cutting concerns.",
        },
        {
          title: "Gateway as an unscaled bottleneck",
          detail:
            "All traffic flows through it, so a single under-provisioned instance caps your whole system. Run it stateless behind a load balancer and scale it out.",
        },
        {
          title: "Hiding a distributed monolith",
          detail:
            "A gateway can make a tangle of chatty, tightly-coupled services look tidy from outside while the coupling festers within. It's a front door, not a fix for bad service boundaries.",
        },
      ],
      drills: [
        {
          scenario:
            "Across your 12 microservices, auth is implemented slightly differently in each and one has a bug that skips a permission check. Best structural fix?",
          options: [
            "Add more code review to each service",
            "Centralize authentication/authorization at an API gateway so it's enforced once",
            "Merge the services back into a monolith",
            "Turn off auth for internal services",
          ],
          answerIndex: 1,
          explanation:
            "Duplicated security policy drifts and develops holes. Enforcing authN/Z once at the gateway makes it consistent and auditable, and downstream services can trust an already-validated request.",
        },
        {
          scenario:
            "A team wants to put order-discount calculation into the API gateway 'because it's convenient.' Good idea?",
          options: [
            "Yes — the gateway sees every request",
            "No — business logic belongs in a service; the gateway stays cross-cutting only",
            "Yes, if it's fast",
            "Only for premium customers",
          ],
          answerIndex: 1,
          explanation:
            "Domain logic in the gateway turns it into a god-object on the critical path, coupling teams and hurting performance. The gateway handles auth/rate-limiting/routing; discount rules belong in the order service.",
        },
        {
          scenario:
            "Your mobile app needs data from 3 services for one screen and 3 round trips is slow. Which gateway pattern helps?",
          options: [
            "Sticky sessions",
            "Backend-for-frontend / request aggregation at the gateway",
            "Sharding",
            "A write-through cache",
          ],
          answerIndex: 1,
          explanation:
            "A backend-for-frontend gateway can aggregate several internal calls into a single tailored response, cutting client round trips. That's request shaping/aggregation — a classic gateway job.",
        },
      ],
      tutorPrompt:
        "Interview me on API gateways. Probe what belongs at the gateway vs a service, centralizing auth/rate-limiting, the backend-for-frontend pattern, and how the gateway avoids becoming a bottleneck or god-object. Scenarios, then correct me.",
    },
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
    lesson: {
      problem:
        "Your app does everything in one process and it's getting hard to reason about. But before splitting into microservices, there's a more fundamental question the interviewer is really asking when they draw an 'app server' box: when traffic grows, can you just add more of these boxes? If the answer is 'no, because each one remembers things,' you've already lost the ability to scale horizontally.",
      mentalModel:
        "Think of a service as a stateless function you can run a hundred copies of. Each request carries everything needed to handle it; the server holds no memory of past requests. That's what makes it disposable — you can add, remove, or restart instances freely, and a load balancer can send any request to any instance. State (sessions, data) lives in the stores behind it, not in the server.",
      howItWorks:
        "A service receives a request, runs business logic, reads/writes backing stores (DB, cache, queue), returns a response — then forgets everything. Because it's stateless, you scale it horizontally: put N identical instances behind a load balancer and autoscale N on CPU or requests-per-second. You split one service into several (microservices) only when team ownership or independent scaling demands it — not by default, because every split adds a network hop, a failure mode, and operational overhead.",
      why:
        "Why is statelessness the whole game? Because the moment a server keeps important state in local memory, its instances stop being interchangeable — you can't freely add or kill them, and a restart loses data. Pushing state to shared stores is what unlocks horizontal scaling and fault tolerance. And why resist microservices early? Because distribution trades in-process calls (fast, reliable) for network calls (slow, failable) and multiplies deployment/monitoring surface — worth it for large teams, painful for small ones.",
      pitfalls: [
        {
          title: "Hidden local state",
          detail:
            "In-memory sessions, upload buffers, or caches on the server break interchangeability — a request routed elsewhere, or a restart, loses it. Keep state in shared stores so any instance can serve any request.",
        },
        {
          title: "Premature microservices",
          detail:
            "Splitting early multiplies network hops, failure modes, and ops overhead before you have the scale or team size to justify it. Start with a well-structured service; split along real ownership seams later.",
        },
        {
          title: "Chatty service-to-service calls",
          detail:
            "A request that fans out into many synchronous inter-service calls stacks up latency and failure probability. Batch, cache, or rethink the boundaries.",
        },
      ],
      drills: [
        {
          scenario:
            "You add a second app-server instance behind a load balancer, and suddenly some users' shopping carts vanish intermittently. Likely cause?",
          options: [
            "The database is corrupt",
            "Carts are stored in one server's local memory, so requests hitting the other server don't see them",
            "The load balancer needs a bigger machine",
            "TLS is misconfigured",
          ],
          answerIndex: 1,
          explanation:
            "Local in-memory state makes instances non-interchangeable. When the LB routes a user to the other server, their cart isn't there. Move cart/session state to a shared store (cache/DB) to make services truly stateless.",
        },
        {
          scenario:
            "Traffic spikes predictably at noon. Your services are stateless behind an LB. Cheapest way to handle it?",
          options: [
            "Vertically scale one giant instance",
            "Autoscale the number of instances on CPU/RPS",
            "Add a second database",
            "Introduce sticky sessions",
          ],
          answerIndex: 1,
          explanation:
            "Stateless services scale horizontally — add instances during the spike, remove them after. Autoscaling on CPU/RPS matches capacity to demand, which is exactly what statelessness enables.",
        },
        {
          scenario:
            "A small team is about to split their app into 8 microservices to 'be scalable.' What's the main risk?",
          options: [
            "It will be too fast",
            "Distribution adds network hops, failure modes, and ops overhead they may not be ready for",
            "Microservices can't use databases",
            "Nothing — always split",
          ],
          answerIndex: 1,
          explanation:
            "Microservices trade cheap in-process calls for failable network calls and multiply deployment/monitoring surface. For a small team with no scaling pressure, that overhead usually outweighs the benefit — split later along real ownership seams.",
        },
      ],
      tutorPrompt:
        "Quiz me on designing application services. Focus on why statelessness enables horizontal scaling, where state should live, autoscaling, and when microservices are and aren't worth it. Give scenarios and correct my reasoning.",
    },
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
    lesson: {
      problem:
        "A user uploads a video and your web request tries to transcode it inline. The request takes 90 seconds, the browser times out, your web server is tied up doing CPU-heavy work instead of serving pages, and if it crashes mid-transcode the job is just... gone. Some work simply doesn't belong on the request/response path.",
      mentalModel:
        "A worker is a background chef working off a ticket rail. The web tier takes the order (accepts the request), drops a ticket on the rail (a queue), and immediately tells the user 'we're on it.' Workers pull tickets at their own pace and do the slow work — transcoding, emails, ETL — decoupled from the user's request. The core shift: hand off slow work asynchronously instead of making the user wait for it.",
      howItWorks:
        "A producer (usually your web service) enqueues a job onto a queue or stream. Workers consume jobs, do the work, and mark them done. Because delivery is typically at-least-once, a job can be delivered more than once (a worker crashed after doing the work but before acknowledging), so jobs must be idempotent — running one twice must be safe. Failed jobs retry with backoff; ones that keep failing land in a dead-letter queue for inspection. You scale throughput by adding workers, using queue depth as the signal.",
      why:
        "Why must jobs be idempotent? Because exactly-once delivery isn't cheap in a distributed system — a worker might finish a job and die before acknowledging it, so the system redelivers it. If 'send welcome email' isn't idempotent, the user gets two. Designing jobs so a repeat is harmless (check-then-act, dedupe keys) is what makes at-least-once delivery safe. And why a dead-letter queue? So a single poison message that always crashes the worker doesn't block the whole pipeline forever.",
      pitfalls: [
        {
          title: "Non-idempotent jobs",
          detail:
            "At-least-once delivery means jobs can run twice. If the work isn't idempotent (charge a card, send an email), duplicates cause real damage. Use dedupe keys or check-then-act so a repeat is a no-op.",
        },
        {
          title: "No dead-letter queue",
          detail:
            "A 'poison' message that always throws will be retried forever, blocking or thrashing your workers. Route repeatedly-failing jobs to a dead-letter queue so the pipeline keeps moving.",
        },
        {
          title: "Unbounded backpressure",
          detail:
            "If producers enqueue faster than workers drain, the queue grows without limit and latency explodes. Monitor queue depth, autoscale workers on it, and shed or throttle load when you can't keep up.",
        },
      ],
      drills: [
        {
          scenario: "Uploading a video makes the HTTP request hang for 90s and sometimes time out. Best redesign?",
          options: [
            "Increase the HTTP timeout to 5 minutes",
            "Accept the upload, enqueue a transcode job, return immediately, and process it in a worker",
            "Transcode on the client",
            "Add more web servers",
          ],
          answerIndex: 1,
          explanation:
            "Slow, CPU-heavy work shouldn't block the request. Enqueue it and return right away; a worker pool transcodes asynchronously and updates status. This decouples the user's wait from the actual work.",
        },
        {
          scenario:
            "Your 'send welcome email' worker occasionally sends two emails to the same user. Delivery is at-least-once. Fix?",
          options: [
            "Switch to a database",
            "Make the job idempotent — record that the email was sent and skip if already sent",
            "Send all emails synchronously",
            "Retry fewer times",
          ],
          answerIndex: 1,
          explanation:
            "At-least-once delivery guarantees occasional redelivery, so the job must be idempotent: check whether the email was already sent (a dedupe key/record) and no-op if so. You can't rely on 'exactly once' from the queue.",
        },
        {
          scenario:
            "One malformed message crashes your worker every time it's picked up, stalling the whole queue. What handles this?",
          options: [
            "A bigger worker instance",
            "A dead-letter queue that captures repeatedly-failing messages after N attempts",
            "Turning off retries entirely",
            "A read replica",
          ],
          answerIndex: 1,
          explanation:
            "A poison message retried forever blocks progress. After a retry threshold, route it to a dead-letter queue for inspection so the rest of the pipeline keeps flowing.",
        },
      ],
      tutorPrompt:
        "Interview me on background workers and async processing. Cover decoupling via queues, why at-least-once delivery forces idempotency, dead-letter queues, retries/backoff, and scaling on queue depth. Give scenarios and correct me.",
    },
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
    lesson: {
      problem:
        "The interviewer asks 'what database would you use?' and it's a trap if you answer with a product name. The real question is about your data's shape and access patterns. Pick a relational DB for a system that needs cross-table transactions and you'll love it — until you're at a scale where one primary can't take the write volume and sharding it becomes a nightmare. Pick NoSQL for convenience and you'll hit a wall the first time you need a join or a multi-row transaction it can't do.",
      mentalModel:
        "Databases sit on a spectrum between two priorities: rich guarantees vs raw scale. Relational (SQL) optimizes for correctness and flexible querying — ACID transactions, joins, a fixed schema. NoSQL families trade some of that for horizontal scale and flexibility: key-value and wide-column for massive write throughput on simple access patterns, document for evolving schemas. The mental model isn't 'which is better' but 'what does my data's access pattern actually demand?'",
      howItWorks:
        "A relational DB stores normalized tables and enforces ACID: transactions are atomic and consistent, which is why you use it for orders and payments. It scales reads with replicas, but write scaling means sharding — splitting data across machines by a key — which breaks cross-shard joins and transactions and is genuinely hard. NoSQL stores are built to shard from day one: they partition by key across nodes for near-linear write scaling, but push work back onto you — no joins (you denormalize), often no multi-row transactions, and tunable/eventual consistency you must reason about per query.",
      why:
        "Why does SQL scale up more easily than out? Because its power — joins and transactions across arbitrary rows — assumes the data is reachable together; spread it across shards and those operations need cross-machine coordination, which is slow and complex. NoSQL earns horizontal scale precisely by giving up those cross-row guarantees, so each node acts mostly independently. That's the core trade: easy joins/transactions or easy horizontal scale — making one cheap makes the other expensive. The right choice falls out of whether your workload is relational-and-transactional or high-volume-with-simple-access.",
      pitfalls: [
        {
          title: "Choosing by product, not access pattern",
          detail:
            "Naming 'Postgres' or 'Mongo' before analyzing reads/writes, consistency needs, and relationships is backwards. Derive the store from the data's shape and access pattern, then name a product.",
        },
        {
          title: "Assuming NoSQL 'scales' for free",
          detail:
            "NoSQL scales writes by making you denormalize, give up joins, and handle eventual consistency. If your workload is deeply relational, that's a tax, not a gift.",
        },
        {
          title: "Sharding a relational DB too casually",
          detail:
            "Once you shard, cross-shard joins and transactions largely go away and hot shards bite. Exhaust replicas, caching, and vertical scale first, and choose the shard key very carefully.",
        },
      ],
      drills: [
        {
          scenario:
            "You're designing payments: money moves between accounts and must never be lost or double-counted. Primary store?",
          options: [
            "A wide-column NoSQL store for scale",
            "A relational DB with ACID transactions",
            "Object storage",
            "A cache",
          ],
          answerIndex: 1,
          explanation:
            "Money movement needs atomic, consistent multi-row transactions — debit one account and credit another, all-or-nothing. That's exactly ACID, the relational DB's strength. Reaching for NoSQL scale here would sacrifice the guarantee that matters most.",
        },
        {
          scenario:
            "You're storing a firehose of IoT sensor readings: massive write volume, simple key-based lookups, no joins. Best fit?",
          options: [
            "A single relational primary",
            "A wide-column / key-value NoSQL store that shards writes across nodes",
            "A data warehouse for each write",
            "A search index",
          ],
          answerIndex: 1,
          explanation:
            "Huge write throughput with simple access and no relational queries is the NoSQL sweet spot — it partitions by key across nodes for near-linear write scaling. A single relational primary would become the write bottleneck.",
        },
        {
          scenario: "Why is horizontally scaling (sharding) a relational database considered hard?",
          options: [
            "Relational DBs can't run on multiple machines at all",
            "Joins and multi-row transactions need data reachable together, which sharding splits across machines",
            "SQL is an interpreted language",
            "Replicas aren't allowed",
          ],
          answerIndex: 1,
          explanation:
            "The relational strengths — joins and cross-row transactions — assume co-located data. Sharding spreads it across nodes, so those operations need cross-machine coordination, which is slow and complex. That's why SQL scales up more easily than out.",
        },
      ],
      tutorPrompt:
        "Interview me on choosing a database. Force me to reason from access patterns, not product names: ACID vs BASE, joins/transactions vs horizontal scale, when NoSQL's trade-offs pay off, and why sharding SQL is hard. Give scenarios and push back on lazy answers.",
    },
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
    lesson: {
      problem:
        "Users are uploading profile photos and videos, and you're about to store them as blobs in your Postgres database. Your DB backups balloon to hundreds of gigabytes, every replica has to copy all those bytes, and your expensive transactional store is now mostly full of... JPEGs. Large binary files and a relational database are a bad marriage.",
      mentalModel:
        "Object storage is an effectively infinite, dirt-cheap coat check for files. You hand it a blob and get back a claim ticket (a URL/key); later you present the ticket to get the blob back. It's not a database — you can't query inside files or update part of one — but it stores unlimited data durably and cheaply. The pattern: put the file in object storage, and put the little pointer (its URL) in your real database.",
      howItWorks:
        "You PUT an object under a key into a bucket and GET it back by key; the provider replicates it across machines and zones for extreme durability (S3 advertises 11 nines). Objects are effectively immutable — you replace a whole object, you don't edit it in place. It's usually fronted by a CDN for fast global reads, and clients often upload/download directly via pre-signed URLs so the bytes never pass through your servers. Your database holds only metadata and the object key, staying small and fast.",
      why:
        "Why keep blobs out of the database entirely? Because a transactional DB pays for every byte many times over — backups, replication, buffer pool, migrations — and none of that machinery helps with an opaque JPEG. Object storage is purpose-built for cheap, durable, huge, write-once/read-many data and offloads serving to a CDN. Why store only the URL in the DB? So queries and backups stay lean while the heavy bytes live where storage is cheap and unlimited. The cost you accept: no queries over file contents, and higher per-fetch latency than a local disk or DB.",
      pitfalls: [
        {
          title: "Treating it like a database",
          detail:
            "No rich queries, no transactions, and listings can lag. If you need to search or filter, index the metadata in a real DB (or search engine) and store only the blob in object storage.",
        },
        {
          title: "Proxying every byte through your servers",
          detail:
            "Streaming uploads/downloads through your app wastes bandwidth and ties up workers. Use pre-signed URLs so clients talk to object storage directly.",
        },
        {
          title: "Ignoring request and egress costs",
          detail:
            "Per-request and data-transfer-out charges add up at scale, especially for many small objects. Batch, cache at a CDN, and mind access patterns.",
        },
      ],
      drills: [
        {
          scenario: "Where should a user's uploaded 200MB video live, and what goes in your primary database?",
          options: [
            "The whole video as a blob in Postgres; nothing else needed",
            "The video in object storage; its URL/key and metadata in the database",
            "The video in a cache; nothing in the DB",
            "The video in a message queue",
          ],
          answerIndex: 1,
          explanation:
            "Large binaries belong in cheap, durable object storage; your database should hold only the pointer (key/URL) and metadata. That keeps backups and replication lean while a CDN serves the bytes.",
        },
        {
          scenario:
            "You need to let users download large files without those bytes flowing through your app servers. What do you use?",
          options: [
            "Sticky sessions",
            "Pre-signed URLs so clients fetch directly from object storage",
            "A bigger load balancer",
            "A write-through cache",
          ],
          answerIndex: 1,
          explanation:
            "Pre-signed URLs grant temporary, direct access to the object, so the client transfers bytes straight from the store (often via CDN) — your servers just issue the URL, saving bandwidth and worker time.",
        },
        {
          scenario: "Which need is object storage a POOR fit for?",
          options: [
            "Storing backups",
            "Serving static images via CDN",
            "Querying 'all files uploaded last week over 10MB' directly",
            "Holding user video uploads",
          ],
          answerIndex: 2,
          explanation:
            "Object storage isn't queryable — it's key-in, blob-out, with listings that can lag. To filter by size/date you index that metadata in a database or search engine; the store just holds the bytes.",
        },
      ],
      tutorPrompt:
        "Quiz me on object storage. Cover why blobs don't belong in the transactional DB, the store-blob/store-pointer pattern, pre-signed URLs and CDN fronting, durability, and where it's the wrong tool. Scenarios, then correct me.",
    },
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
    lesson: {
      problem:
        "Your product search runs SELECT * FROM products WHERE name LIKE '%wireless headphone%' and it's slow, can't rank by relevance, returns nothing when someone types 'headphnes', and chokes on 'show me cheap over-ear ones under $100'. A relational database is built for exact lookups and joins, not for messy human language.",
      mentalModel:
        "A search engine is a librarian with an index card for every word, pointing to everything that contains it. That inverted index — word → list of documents — is what makes full-text search fast and rankable, where a database's LIKE '%...%' has to scan everything. The catch: this librarian keeps a copy of your data organized for finding, not for truth. It's a secondary index derived from your real store, always slightly behind it.",
      howItWorks:
        "You feed documents in; the engine tokenizes and analyzes text (lowercasing, stemming 'running' → 'run', handling synonyms) and builds an inverted index. Queries are scored for relevance (TF-IDF/BM25), support fuzzy matching for typos, and faceted filters for 'under $100, over-ear'. Because it's a secondary index, you keep it in sync with your source-of-truth DB — via change-data-capture or dual writes — accepting that documents become searchable a moment after they're written. It shards and replicates across nodes to scale.",
      why:
        "Why not just search in the primary database? Because relational indexes are built for exact/range lookups, not language: LIKE '%term%' can't use an index and scans the table, with no relevance ranking, stemming, or typo tolerance. An inverted index is purpose-built for those. Why treat it as a secondary index rather than source of truth? Because it's tuned for retrieval, not transactional integrity — it's eventually consistent, rebuildable from the DB, and you don't want the thing that occasionally lags or reindexes to be where your canonical data lives.",
      pitfalls: [
        {
          title: "Making it the source of truth",
          detail:
            "It's a derived index — eventually consistent and rebuildable. Keep canonical data in your DB and sync into search, or a reindex/outage risks your real data.",
        },
        {
          title: "Forgetting the sync path",
          detail:
            "If writes to the DB don't propagate to the index (CDC or dual-write), search silently serves stale or missing results. The pipeline that keeps them in sync is part of the design, not an afterthought.",
        },
        {
          title: "Underestimating its resource appetite",
          detail:
            "Inverted indexes are RAM/CPU hungry and reindexing is expensive. Size for it, and don't treat 'add Elasticsearch' as free.",
        },
      ],
      drills: [
        {
          scenario:
            "Product search with LIKE '%term%' is slow, can't rank results, and fails on typos. Best tool to add?",
          options: [
            "A read replica of the database",
            "A search engine with an inverted index (e.g. Elasticsearch)",
            "A larger cache",
            "A data warehouse",
          ],
          answerIndex: 1,
          explanation:
            "Full-text search, relevance ranking, and typo tolerance are exactly what an inverted-index search engine provides — none of which a relational LIKE scan can do efficiently. You index product data into it and query there.",
        },
        {
          scenario: "Where should the canonical product data live, given you've added a search engine?",
          options: [
            "Only in the search engine",
            "In your primary database, synced into the search index via CDC/dual-write",
            "Only in the cache",
            "Split randomly between them",
          ],
          answerIndex: 1,
          explanation:
            "The search index is a secondary, eventually-consistent, rebuildable copy tuned for retrieval. Keep the source of truth in your transactional DB and feed the index from it, so a reindex or search outage never endangers canonical data.",
        },
        {
          scenario:
            "Right after a product's price is updated in the DB, a search for it shows the old price for a moment. Why?",
          options: [
            "The search engine is broken",
            "The index is eventually consistent — documents become searchable after indexing lag",
            "The database transaction failed",
            "Caches are disabled",
          ],
          answerIndex: 1,
          explanation:
            "A search index updates asynchronously from the source of truth, so there's a brief indexing lag before changes are searchable. That eventual consistency is expected — it's why search is a secondary index, not the system of record.",
        },
      ],
      tutorPrompt:
        "Interview me on search infrastructure. Cover the inverted index vs SQL LIKE, relevance/stemming/fuzzy matching, why search is a secondary index synced from the DB, indexing lag, and keeping the two in sync. Scenarios, then correct me.",
    },
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
    lesson: {
      problem:
        "The analytics team keeps running 'total revenue by region for the last two years' against your production database, and every time they do, the queries scan millions of rows and your live app slows for real users. Your transactional database is optimized for handling one order at a time — not for grinding through all of history to answer a business question.",
      mentalModel:
        "A data warehouse is the back office where you do the heavy number-crunching, kept separate from the shop floor. Your transactional DB (OLTP) is built for many small, fast reads/writes — one order, one user. A warehouse (OLAP) is built for the opposite: a few enormous queries scanning billions of rows to aggregate. It stores data by column instead of by row, which is what makes 'sum this one field across everything' fast. The point of separation: analytics load never touches your serving path.",
      howItWorks:
        "Data flows from your operational stores into the warehouse via ETL/ELT — batch or streaming pipelines that extract, transform, and load it, usually on a schedule. The warehouse stores columns together, so an aggregate over one column reads only that column, not whole rows, and runs it with massively parallel processing (MPP) across many nodes, often separating storage from compute so you scale them independently. Because it's loaded periodically, its data reflects the world as of the last ETL run — minutes to hours old, which is fine for reporting.",
      why:
        "Why store by column instead of by row? Because analytics touches few columns across huge numbers of rows ('average price over all orders'); a columnar layout reads just that column and skips the rest, while a row store would haul every full row off disk. Why keep it separate from the OLTP database? Because the two workloads are opposites — small fast transactions vs giant scans — and running heavy analytics on the serving DB steals resources from live users and locks the very rows they need. Separation lets each be optimized for its job, at the cost of the warehouse being minutes-to-hours stale.",
      pitfalls: [
        {
          title: "Using it for low-latency serving",
          detail:
            "A warehouse answers big analytical queries, not per-row lookups for your app. Don't put it on the user request path — it's OLAP, not OLTP.",
        },
        {
          title: "Expecting fresh data",
          detail:
            "It's loaded by batch/stream ETL, so it lags the source by minutes to hours. Fine for dashboards; wrong for anything needing this-second accuracy.",
        },
        {
          title: "Ignoring scan-based cost",
          detail:
            "Many warehouses bill by data scanned. A careless SELECT * over billions of rows is slow and expensive; prune columns, partition, and filter.",
        },
      ],
      drills: [
        {
          scenario:
            "Analysts running 2-year revenue rollups on the production DB keep slowing down the live app. Best fix?",
          options: [
            "Add a read replica and run analytics there forever",
            "Load data into a separate columnar data warehouse and run analytics there",
            "Add more indexes to the production DB",
            "Cache the analytics queries",
          ],
          answerIndex: 1,
          explanation:
            "OLTP and OLAP are opposite workloads; heavy scans belong in a purpose-built columnar warehouse fed by ETL, fully isolated from the serving path. Replicas help a little but are still row-oriented and share the OLTP design; a warehouse is built for big aggregations.",
        },
        {
          scenario: "Why do warehouses store data by column rather than by row?",
          options: [
            "It uses less disk in every case",
            "Analytical queries aggregate a few columns over many rows, and columnar layout reads only those columns",
            "Columns are easier to encrypt",
            "Row storage can't scale",
          ],
          answerIndex: 1,
          explanation:
            "Analytics scans few columns across enormous row counts. A columnar store reads just the needed column and skips the rest, making aggregates fast — whereas a row store would pull every full row off disk.",
        },
        {
          scenario: "A dashboard backed by the warehouse shows numbers 2 hours behind reality. Is that a bug?",
          options: [
            "Yes — warehouses should be real-time",
            "No — it's loaded by periodic ETL, so lag is expected and usually acceptable for reporting",
            "Yes — the ETL job failed",
            "No — but only because caching is on",
          ],
          answerIndex: 1,
          explanation:
            "Warehouses are batch/stream-loaded, so they reflect data as of the last ETL run — minutes to hours old by design. For reporting that's fine; if you need this-second accuracy you're using the wrong tool.",
        },
      ],
      tutorPrompt:
        "Quiz me on data warehouses. Cover OLAP vs OLTP, columnar storage and why it speeds aggregation, ETL/ELT and data freshness, MPP and separating storage from compute, and why analytics is isolated from the serving DB. Scenarios, then correct me.",
    },
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
    lesson: {
      problem:
        "Your checkout service calls the email service directly to send a receipt. One afternoon the email provider is down, and now checkouts fail too — a non-critical feature took out a critical one. On top of that, a flash sale sends 10× traffic and your downstream services, called synchronously, all fall over at once. Two services shouldn't have to be healthy at the same instant just to get work done.",
      mentalModel:
        "A message queue is an inbox between services. The producer drops a message in and moves on; a consumer picks it up later and does the work. Neither has to be up at the same moment, and a spike just makes the inbox deeper rather than knocking anyone over. The defining trait: each message is delivered to one consumer and then removed — it's a to-do list, and once a task is done, it's gone.",
      howItWorks:
        "A producer enqueues messages; a pool of consumers competes to pull them, each message going to exactly one consumer, which acknowledges it when done (and it's deleted). If a consumer fails to ack, the message becomes visible again and is redelivered — hence at-least-once delivery, so consumers must be idempotent. You scale by adding competing consumers to drain faster, and repeatedly-failing messages go to a dead-letter queue. Because any consumer can grab any message, strict ordering across the pool generally isn't guaranteed.",
      why:
        "Why does a queue decouple services in time? Because the producer's job ends at 'message enqueued' — it doesn't wait for the consumer, so the consumer can be slow, restarting, or briefly down without failing the producer. That's what turns a downstream outage into a backlog instead of a cascade, and a spike into a deeper queue instead of a crash. And why is a message consumed-once rather than kept? Because a queue models work to be done: once a worker handles the task, keeping the message around would just risk doing it twice. (That 'keep and replay' behavior is exactly what a stream is for — the key contrast.)",
      pitfalls: [
        {
          title: "Assuming exactly-once / ordering",
          detail:
            "Queues are at-least-once and usually unordered across competing consumers. If you need dedup, use idempotent consumers; if you need ordering, you need per-key partitioning or a different tool.",
        },
        {
          title: "No dead-letter queue",
          detail:
            "A message that always fails gets redelivered forever, wasting capacity. Route repeated failures to a DLQ so the queue keeps draining.",
        },
        {
          title: "Reaching for a queue when you need replay",
          detail:
            "A queue deletes messages once consumed, so you can't add a new consumer later and re-read history. If multiple independent consumers or replay matter, that's a stream, not a queue.",
        },
      ],
      drills: [
        {
          scenario:
            "Checkout calls the email service synchronously; when email is down, checkouts fail too. How do you decouple them?",
          options: [
            "Add retries in the checkout service",
            "Have checkout enqueue a 'send receipt' message; a consumer sends it when email is healthy",
            "Merge the two services",
            "Cache the emails",
          ],
          answerIndex: 1,
          explanation:
            "A queue decouples them in time: checkout's job ends at 'message enqueued,' so an email outage becomes a harmless backlog instead of a cascading failure. The consumer drains the queue once email recovers.",
        },
        {
          scenario:
            "A message-queue task 'charge card' occasionally runs twice. Delivery is at-least-once. Correct response?",
          options: [
            "It's impossible; queues are exactly-once",
            "Make the consumer idempotent so a repeat is a no-op",
            "Delete the queue",
            "Add more producers",
          ],
          answerIndex: 1,
          explanation:
            "Queues guarantee at-least-once, not exactly-once — a consumer can crash after working but before acking, causing redelivery. Idempotent consumers (dedupe keys / check-then-act) make the occasional repeat safe.",
        },
        {
          scenario:
            "You need three independent teams to each consume every order event, and to replay last month's events for a new consumer. Queue or stream?",
          options: [
            "A message queue — it's simpler",
            "An event stream — messages are retained and replayable, with independent consumers",
            "A cache",
            "A relational database",
          ],
          answerIndex: 1,
          explanation:
            "A queue deletes each message after one consumer handles it — no fan-out to multiple independent consumers, no replay. Retention, independent per-consumer offsets, and replay are the defining features of a stream (log), so that's the right choice.",
        },
      ],
      tutorPrompt:
        "Interview me on message queues, and make me contrast them with streams. Cover time decoupling, at-least-once delivery and idempotency, dead-letter queues, ordering, and when consumed-once (queue) vs replayable (stream) is the right model. Scenarios, then correct me.",
    },
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
    lesson: {
      problem:
        "You have a firehose of user-activity events, and three teams want them: analytics, a recommendation engine, and a fraud detector. With a plain queue, whoever consumes an event first removes it — so the others never see it. And when the recommendation team ships a new model next month, they want to replay the last 30 days of events to train it. A to-do list can't do any of that.",
      mentalModel:
        "A stream is an append-only log — like a bank statement that never erases lines. Producers append events to the end; each consumer reads through at its own bookmark (offset) and can start wherever it wants, including the beginning. Crucially, reading doesn't remove anything: the same event is available to every consumer, and to new consumers that show up later. It's a durable record of what happened, not a task queue of what to do.",
      howItWorks:
        "Events are appended to a topic, split into partitions for parallelism; ordering is guaranteed within a partition (by key) but not across them. Each consumer group tracks its own offset, so many independent groups read the same events without interfering, and a group can reset its offset to replay history. Data is retained for a configured window (days, or forever) and replicated across brokers for durability. You scale throughput by adding partitions and consumers; delivery is at-least-once (exactly-once with care).",
      why:
        "Why does a stream let many independent consumers each see every event when a queue doesn't? Because a stream doesn't delete on read — it's a log with per-consumer bookmarks, so consuming just means 'advance my own offset,' leaving the data for everyone else. That's also what makes replay possible: reset the bookmark and re-read. Why is ordering only per-partition? Because global ordering across machines needs coordination that kills throughput, so streams give strict order within a partition (pick a key so related events share one) and parallelism across partitions — the trade that lets them handle firehose volume.",
      pitfalls: [
        {
          title: "Expecting global ordering",
          detail:
            "Order holds only within a partition, not across the topic. Route events that must be ordered together (e.g. per user) to the same partition via a partition key.",
        },
        {
          title: "Forgetting retention limits",
          detail:
            "Replay only works within the retention window; past that, events are gone. Size retention for your replay/backfill needs, or archive to object storage.",
        },
        {
          title: "Using a stream where a simple queue suffices",
          detail:
            "A stream is more operationally heavy (partitions, offsets, retention). If you just need to hand tasks to a worker pool with no fan-out or replay, a queue is simpler.",
        },
      ],
      drills: [
        {
          scenario:
            "Three teams (analytics, recs, fraud) must each independently process every user-activity event. Which fits?",
          options: [
            "A message queue — first consumer wins",
            "An event stream with a consumer group per team, each reading all events at its own offset",
            "A cache",
            "Object storage",
          ],
          answerIndex: 1,
          explanation:
            "A stream doesn't delete on read, so multiple consumer groups each read every event independently at their own offset — exactly the fan-out these teams need. A queue would hand each event to only one consumer.",
        },
        {
          scenario:
            "Events for the same user must be processed in order, but you also need high throughput across all users. How?",
          options: [
            "One giant partition for strict global order",
            "Key events by user so each user's events share a partition (ordered), with many partitions for parallelism",
            "Use a queue instead",
            "Disable ordering entirely",
          ],
          answerIndex: 1,
          explanation:
            "Streams guarantee order within a partition. Using the user as the partition key keeps each user's events ordered, while many partitions give parallel throughput across users — the standard way to get 'ordered where it matters, fast overall.'",
        },
        {
          scenario:
            "A new recommendation model needs to train on the last 30 days of events. What must be true of your stream?",
          options: [
            "Nothing — streams always keep everything",
            "Retention must cover 30 days so the consumer can reset its offset and replay",
            "The events must be deleted first",
            "It must be a queue",
          ],
          answerIndex: 1,
          explanation:
            "Replay works by resetting a consumer's offset and re-reading — but only within the retention window. To backfill 30 days, retention must span at least that, or you archive older events to object storage and load from there.",
        },
      ],
      tutorPrompt:
        "Grill me on event streams (logs) and how they differ from queues. Cover append-only logs, per-consumer offsets and fan-out, replay within retention, per-partition ordering with partition keys, and when a stream is overkill vs a queue. Scenarios, then correct me.",
    },
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
    lesson: {
      problem:
        "Your app takes payments through Stripe and sends texts through Twilio. It all works in the demo. Then Stripe has a 30-second latency blip, and because your checkout calls it synchronously with no timeout, every checkout thread hangs, your connection pool fills, and your entire site goes down — because a third party you don't control had a bad minute.",
      mentalModel:
        "An external service is a part of your system that lives on someone else's infrastructure, behind an API you can't see into or fix. Treat it as permanently untrusted and unreliable: it will be slow, rate-limit you, change behavior, or go down, all on its own schedule. Your job is to wrap it so its bad days can't become your bad days — an adapter around it, and defensive timeouts/retries/fallbacks in front of it.",
      howItWorks:
        "You integrate behind an adapter (an anti-corruption layer) so the vendor's data model and quirks don't leak throughout your code and you can swap providers later. Every call gets a timeout so a hung dependency can't hang you, retries with backoff for transient errors, and a circuit breaker that stops calling a failing service for a while instead of pounding it. Flaky or slow non-critical calls become async (enqueue) and degrade gracefully — show a fallback — when the dependency is down. Where possible you cache responses to cut latency and cost.",
      why:
        "Why treat a well-known provider as unreliable when it has great uptime? Because its outage becomes your outage if you're coupled to it synchronously with no guardrails — and 'rare' failures are certain at scale. A timeout converts 'hangs forever' into 'fails fast'; a circuit breaker converts 'hammer a downed service and pile up' into 'fail fast and recover'; going async converts 'their outage blocks users' into 'their outage delays a background job.' Why an adapter? So the vendor's specifics are quarantined in one place, letting you swap providers and keeping their model from corrupting your domain.",
      pitfalls: [
        {
          title: "Synchronous calls with no timeout",
          detail:
            "A slow third party with no timeout exhausts your threads/connections and takes you down with it. Every external call needs a timeout and, ideally, a circuit breaker.",
        },
        {
          title: "No graceful degradation",
          detail:
            "If the whole feature hard-fails when the vendor is down, their outage is your outage. Provide a fallback or make the call async so core flows survive.",
        },
        {
          title: "Leaking the vendor throughout your code",
          detail:
            "Scattering a provider's SDK and data shapes everywhere makes switching agonizing and couples your domain to their quirks. Wrap it in an adapter / anti-corruption layer.",
        },
      ],
      drills: [
        {
          scenario:
            "A payment provider has a 30s latency blip and your synchronous, timeout-less checkout calls pile up until the whole site is down. First fix?",
          options: [
            "Switch payment providers",
            "Add a timeout (and circuit breaker) so a slow dependency fails fast instead of exhausting resources",
            "Retry the call more aggressively",
            "Cache the payment result",
          ],
          answerIndex: 1,
          explanation:
            "Without a timeout, a hung dependency consumes every thread/connection and cascades into a full outage. A timeout makes the call fail fast; a circuit breaker stops hammering the failing service and lets it recover. That contains the blast radius.",
        },
        {
          scenario:
            "A third-party SMS SDK and its data types are sprinkled across 20 files, so switching vendors looks like a nightmare. What pattern prevents this?",
          options: [
            "A message queue",
            "An adapter / anti-corruption layer that wraps the vendor behind your own interface",
            "A read replica",
            "A CDN",
          ],
          answerIndex: 1,
          explanation:
            "An adapter quarantines the vendor's SDK and data model behind an interface you own, so swapping providers means rewriting one adapter, not 20 files — and the vendor's quirks never corrupt your domain model.",
        },
        {
          scenario: "An email provider (non-critical) is down. How should your core signup flow behave?",
          options: [
            "Fail signup until email recovers",
            "Enqueue the welcome email and complete signup, sending it when the provider is back",
            "Retry email synchronously forever",
            "Block the request for 60 seconds",
          ],
          answerIndex: 1,
          explanation:
            "A non-critical dependency's outage shouldn't break a critical flow. Make the email async (enqueue it) so signup completes now and the email sends once the provider recovers — graceful degradation instead of a hard failure.",
        },
      ],
      tutorPrompt:
        "Interview me on integrating third-party/external services. Cover timeouts, retries with backoff, circuit breakers, graceful degradation, making non-critical calls async, and the adapter / anti-corruption layer. Give scenarios and correct my reasoning.",
    },
  },
];
