# GEM Marketplace 💎

Sri Lanka's premium peer-to-peer (C2C) gemstone marketplace ecosystem. This project is structured as a high-fidelity monorepo containing a Fastify API backend, a Next.js web client, and an Expo-based React Native mobile application.

---

## 🚀 Technical Architecture

The platform relies on a modern, typed, and resilient service layer:

```
  ┌─────────────────────────────────────────────────────────┐
  │                        Frontend                         │
  │   Next.js (Web Client)    │    Expo (Mobile App Client) │
  └───────────────────────────┬─────────────────────────────┘
                              │ HTTP / WebSockets
  ┌───────────────────────────▼─────────────────────────────┐
  │                     Fastify API                         │
  │                  (REST & WebSockets)                    │
  └─────┬──────────────┬──────────────┬──────────────┬──────┘
        │              │              │              │
  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
  │ PostgreSQL│  │   Redis   │  │  MinIO/S3 │  │ NginxRTMP│
  │ (Data DB) │  │  (Cache)  │  │ (Storage) │  │  (Video)  │
  └───────────┘  └───────────┘  └───────────┘  └───────────┘
```

- **Monorepo Management**: Configured via **Turborepo** with shared TypeScript configurations, ESLint configs, Zod validators, and shared models.
- **Fastify API**: Core routing engine utilizing **Prisma ORM** for database mapping.
- **Next.js Web App**: Interactive client dashboard utilizing Framer Motion, Hls.js, and React Query.
- **Expo Mobile App**: Seamless Android/iOS client integrating secure token storage.
- **Live Video Streaming**: Custom HLS transcoding server powered by **Nginx-RTMP** and a provider-ready registry supporting Mux integrations.

---

## ✨ Core Features & Workflows

### 🛡️ Secure Auth & Multi-Role RBAC
JWT-based access/refresh token rotation with database session verification. Actions are strictly gated by backend middlewares:
- **`BUYER`**: Trade, place bids, make offers, upload payment proofs, and open disputes.
- **`SELLER` / `VERIFIED_SELLER`**: List gemstones, start live stream broadcasts, and control sales.
- **`ADMIN` / `SUPER_ADMIN`**: Manage listing approvals, review KYC requests, investigate disputes, audit logs, and moderate streams.

### 📝 Moderation & KYC Document Flow
- New listings are held in `PENDING_REVIEW` until approved by moderators.
- Verified seller applicants must upload KYC documents. Uploads are processed via **S3 Presigned Upload URLs** straight to private storage. Only authorized administrators can fetch temporary 1-hour download signatures to inspect them.

### 🔨 Transactional Bidding (Anti-Race Condition)
Timed and live auctions protect bids inside PostgreSQL transactions using database row-level locking (`SELECT ... FOR UPDATE`). Custom logic automatically checks auction time windows, bid increments, and updates the leading bidder.

### 📦 Escrow Order Lifecycle
Secure trade escrow pipeline:
`PENDING_PAYMENT` ➔ `PAID` ➔ `SELLER_CONFIRMED` ➔ `PACKED` ➔ `SHIPPED` ➔ `DELIVERED` ➔ `COMPLETED` / `DISPUTED` ➔ `REFUNDED`

### 💳 Webhook-First Payments
- **Stripe Integration**: High-fidelity payment intents with verification signature hooks.
- **Bank Transfer Fallback**: Supports local banks where users upload deposit slips, and administrators review and confirm them from the panel.

### 🎥 Broadcast Studio & Chat
- RTMP ingestion publishing for sellers via OBS Studio and custom HLS transcoders for network-wide low-latency playback.
- Dynamic WebSockets-backed chat rooms with automatic Zustand hydration reconnect filters and a profanity censor.

---

## 🛠️ Local Development

### 1. Prereqs
* Docker and Docker Compose
* Node.js >= 20.0.0
* PNPM >= 9.0.0

### 2. Startup Containers
Spin up PostgreSQL, Redis, MinIO, and Nginx-RTMP:
```bash
docker-compose up -d
```

### 3. Database Migration & Seed
```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

### 4. Start Development Server
```bash
pnpm dev
```
* **API Backend**: `http://localhost:4000`
* **Web Frontend**: `http://localhost:3000`
* **Metro Bundler (Mobile)**: Metro CLI starts automatically.

---

## 🧪 Testing

Run backend Vitest integration suites (Auth, Listings, Auctions, Orders, Admin):
```bash
pnpm test:api
```
