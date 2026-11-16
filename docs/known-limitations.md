# Known Limitations and Deferred Features

This document outlines architectural trade-offs, deliberate design constraints, and deferred roadmap features for the PathForge MVP release.

---

## 1. Architectural Design Choices & Current Limitations

### Single-Region Database
- **Current State**: Single PostgreSQL database instance with connection pooling.
- **Limitation**: Regional failover requires automated backup restoration or cross-region replica configuration.
- **Mitigation**: Automated daily backups with SHA-256 integrity verification (`scripts/db-backup.sh`).

### In-Memory Rate Limiting
- **Current State**: Sliding window counters maintained in memory (`apps/api/src/middleware/rate-limiter.js`).
- **Limitation**: Per-instance rate limiting reset on service restart; in a multi-pod cluster, limits are distributed across pods.
- **Future Upgrade**: Transition to Redis-backed distributed token bucket (`ioredis` + Redis cluster) when scaling horizontally.

### Local File Storage for Resumes
- **Current State**: Resumes stored in local filesystem storage under secure permissions.
- **Limitation**: Multi-instance deployments require shared storage volumes.
- **Future Upgrade**: S3/GCS signed URLs with direct client upload and server-side encryption.

### Hybrid Matching Engine
- **Current State**: Deterministic 70% weighted multi-factor match (skills, education, candidate evidence, repository languages) + 30% lexical Jaccard title/description similarity.
- **Limitation**: Semantic matching uses lexical tokens rather than dense neural embedding vectors (e.g. pgvector or Vertex AI Text Embeddings).
- **Rationale**: Keeps the engine fully deterministic, fast (<10ms), auditable, and independent of external embedding API costs and network latency during initial pilot.

---

## 2. Deferred Features (Post-MVP Validation)

As defined in the project roadmap, the following features are intentionally deferred until student pilot validation is completed:

- **Multi-Agent Career Assistant**: Autonomous agent chat workflows and automated job recommendations.
- **Automated Applications**: Direct one-click application submission to corporate job boards.
- **Broad Job-Board Web Scraping**: Live scraping of third-party job boards; currently using verified curated internship feeds.
- **Microservices & Event Streaming**: Decomposition into standalone microservices or Kafka event buses; current modular monorepo provides faster delivery and lower operational overhead.
- **Advanced Vector Search Infrastructure**: Vector databases (Milvus, Pinecone, or pgvector) for deep semantic embedding search.
- **Real-Time Collaboration & WebSockets**: Instant push notifications and collaborative application reviews.

