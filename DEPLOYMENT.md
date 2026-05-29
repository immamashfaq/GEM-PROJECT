# GEM Marketplace: Production Deployment & Observability Guide

This document describes the logging, observability, backup procedures, and deployment strategies required for hosting the GEM Marketplace project in a production-ready environment.

---

## 1. Observability & Logging

### Structured API Logs
The API server uses **Pino** for structured JSON logging. By default:
- In production (`NODE_ENV=production`), logs are outputted as structured JSON string streams to stdout for ingestion by cloud watch groups, Datadog agents, or Loki.
- Sensitive values like authorization headers, user passwords, and tokens are automatically redacted via the Pino configurations inside `apps/api/src/server.ts`.

### Telemetry Error Monitoring
A standard, vendor-agnostic Sentry config wrapper is loaded to catch runtime exceptions.
Configure `SENTRY_DSN` in your environment variables:
```bash
# In your .env variables:
SENTRY_DSN="https://your-sentry-dns-key@sentry.io/project-id"
```
Uncaught Fastify handlers are automatically intercepted, printing the stack trace alongside structured crash telemetry.

### Analytics Event Tracking
To monitor user engagement, events are sent to a cloud metrics handler:
- **Listing Views**: Dispatched on `GET /listings/:id`.
- **Checkout Starts**: Dispatched on `POST /payments/intent`.
- **Successful Purchases**: Dispatched via backend webhook on verified `PAID` state.
- **Bids**: Logged on high-frequency auction bid submissions.

---

## 2. Backup Strategy

### PostgreSQL Database Backups
Automated cron tasks execute daily database dumps utilizing `pg_dump`:
```bash
# Dump the postgres db to a compressed archive
pg_dump -h localhost -p 5433 -U postgres -d gem_db -F c -b -v -f "/backups/db/gem_db_$(date +%F).dump"
```
To restore a dump file:
```bash
pg_restore -h localhost -p 5433 -U postgres -d gem_db -v "/backups/db/gem_db_2026-05-24.dump"
```

### Media Storage Backups
Since gem certificates and seller KYC documents are sensitive, mirror the S3/MinIO bucket daily:
```bash
# Using AWS CLI
aws s3 sync s3://gem-project s3://gem-project-backup --endpoint-url https://s3.us-east-1.amazonaws.com

# Using MinIO client (mc)
mc mirror local/gem-project remote-backup/gem-project-backup
```

### Migration Backups
Prisma database migration files located under `./prisma/migrations` are tracked in version control, making schema restoration fully reproducible via:
```bash
pnpm exec prisma migrate deploy
```

---

## 3. Production Deployment

### API Backend Setup
The Fastify server should run under **PM2** (Process Manager) or inside a Docker container (ECS/Kubernetes) to ensure auto-restart capabilities:
1. **Prerequisites**: Ensure Redis and PostgreSQL containers are healthy.
2. **Build**: Build compilation:
   ```bash
   pnpm install
   pnpm db:generate
   pnpm build
   ```
3. **Execution**: Start the PM2 runner:
   ```bash
   pm2 start dist/index.js --name "gem-api" -i max
   ```

### Web Frontend Setup
Host the Next.js frontend on Vercel, AWS Amplify, or a custom VPS:
1. **Build**: Compile Next.js production bundles:
   ```bash
   pnpm build
   ```
2. **Run**: Spin up the Next server:
   ```bash
   next start
   ```

### Mobile App Deployment (Expo EAS)
1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Login & Configure**:
   ```bash
   eas login
   eas project:init
   ```
3. **Build Android (AAB)**:
   ```bash
   eas build --platform android --profile production
   ```
4. **Build iOS (IPA)**:
   ```bash
   eas build --platform ios --profile production
   ```
5. **Submit to Play Store / App Store**:
   ```bash
   eas submit --platform all
   ```
