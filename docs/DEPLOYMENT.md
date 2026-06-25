# Spareflow AI - Deployment Guide

This guide describes how to configure, build, and deploy the **Spareflow AI** application on local environments, Docker hosts, and modern cloud hosting services.

---

## 1. Prerequisites & System Requirements

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Database**: PostgreSQL `15+` instance
- **Package Manager**: `npm` (included with Node.js)
- **Compiler tools**: `typescript`, `esbuild` (managed via devDependencies)

---

## 2. Local Setup & Running Locally

Follow these steps to spin up the application on a local workstation:

### Step A: Clone the Repository
```bash
git clone https://github.com/your-username/spareflow-ai.git
cd spareflow-ai
```

### Step B: Install Dependencies
```bash
npm install
```

### Step C: Configure Environments
Copy the sample environment file and modify values with your local configs:
```bash
cp .env.example .env
```
Ensure you provide correct connection configurations for your PostgreSQL database (`SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`).

### Step D: Compile and Build
```bash
npm run build
```
This builds both the React client assets using Vite and bundles the Node/Express backend using `esbuild` into the `dist/` directory.

### Step E: Start the Servers
- **Development Mode** (with automatic reloading for code changes):
  ```bash
  npm run dev
  ```
- **Production Mode** (runs the highly optimized bundled servers):
  ```bash
  npm run start
  ```

---

## 3. Database Migrations

Spareflow AI uses **Drizzle Kit** to handle schemas and apply changes.

### A. Generate SQL Migrations
```bash
npx drizzle-kit generate
```

### B. Push Schemas Directly (Ideal for Sandbox/Dev environments)
```bash
npx drizzle-kit push
```

---

## 4. Docker Containerization

To run Spareflow AI in isolated containers, use the provided Docker instructions.

### Create a `Dockerfile`
Create a clean `Dockerfile` in the root:
```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/vite.config.ts ./vite.config.ts

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Build and Run with Docker
```bash
docker build -t spareflow-ai .
docker run -d -p 3000:3000 --env-file .env spareflow-ai
```

### Run Multi-Container Environments with Docker Compose
We supply a pre-configured `docker-compose.yml` file to spin up both the Spareflow core monolith and a local PostgreSQL instance:
```bash
docker compose up -d --build
```
This sets up:
1. `db`: A standard PostgreSQL 16 container with persistent volumes mapped on a safe bridge.
2. `app`: The built application container running in production mode, configured to connect directly to the db after health checks pass.

To verify service logs:
```bash
docker compose logs -f app
```
To shutdown and clean up containers:
```bash
docker compose down -v
```

---

## 5. Cloud Platform Deployments

### Google Cloud Run (Recommended)
Since Spareflow AI binds strictly to host `0.0.0.0` and port `3000`, it is fully optimized for Cloud Run:
1. Build and push the image to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/your-project-id/spareflow-ai
   ```
2. Deploy the container to Cloud Run with environment variables set:
   ```bash
   gcloud run deploy spareflow-ai \
     --image gcr.io/your-project-id/spareflow-ai \
     --platform managed \
     --port 3000 \
     --allow-unauthenticated
   ```
