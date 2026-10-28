# 🐳 Docker Deployment Guide — Silayi Master Backend

This guide outlines how to containerize and deploy the **Silayi Master Backend** on any server (Ubuntu, Debian, AWS EC2, DigitalOcean, Hetzner, etc.) using Docker and Docker Compose.

---

## 📋 Requirements
- **Docker** Engine (v24.0+)
- **Docker Compose** (v2.0+)

To install Docker and Docker Compose on Ubuntu/Debian:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

---

## 🚀 Option 1: Quick Automated Deployment (Recommended)

A helper script [`deploy.sh`](./deploy.sh) is provided to build, run, and verify the container in one step:

```bash
cd silayi-master-backend

# Ensure your .env file is set up
cp .env.example .env
nano .env

# Run the automated deployment script
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Verify `.env` configuration.
2. Build the optimized multi-stage Docker image.
3. Start the container in detached mode.
4. Wait for the `/health` endpoint check to return healthy.
5. Display live status.

---

## 🛠️ Option 2: Docker Compose with MongoDB Atlas (Cloud)

If using **MongoDB Atlas** (cloud-hosted database):

1. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   PORT=3003
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=silayi-master
   MONGODB_DB_NAME=silayi_master
   JWT_SECRET=your_secure_random_64_character_jwt_secret
   ```

2. **Build and Launch**:
   ```bash
   docker compose up -d --build
   ```

3. **Check Container Status**:
   ```bash
   docker compose ps
   ```

4. **View Container Logs**:
   ```bash
   docker compose logs -f silayi-backend
   ```

---

## 🗄️ Option 3: Docker Compose with Self-Hosted MongoDB

If you want the server to run both the NestJS backend **AND** a containerized MongoDB instance with persistent volume storage:

```bash
docker compose -f docker-compose.local-db.yml up -d --build
```

This starts:
- `silayi-master-mongodb`: MongoDB 7.0 with persistent storage volume `silayi_mongo_data`.
- `silayi-master-backend`: The NestJS API configured to automatically wait for MongoDB to become healthy before starting.

To view logs:
```bash
docker compose -f docker-compose.local-db.yml logs -f
```

---

## 📦 Option 4: Standalone Docker (Without Compose)

1. **Build Docker Image**:
   ```bash
   docker build -t silayi-master-backend:latest .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     --name silayi-master-backend \
     --restart unless-stopped \
     -p 3003:3003 \
     --env-file .env \
     silayi-master-backend:latest
   ```

---

## 🔍 Healthcheck & Verification

The Docker container includes an automated healthcheck against the `/health` endpoint:

```bash
curl http://localhost:3003/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "silayi-master-backend",
  "timestamp": "2026-10-28T05:30:00.000Z"
}
```

Check Docker health status:
```bash
docker inspect --format='{{json .State.Health.Status}}' silayi-master-backend
# Output: "healthy"
```

---

## 🌱 Seeding Demo Tailor Account Inside Docker

To seed demo records (`master@silayimaster.com` / `password123`) inside the running container:

```bash
curl -X POST http://localhost:3003/seed
```

---

## 🔒 Production Security & Optimizations in this Image

1. **Multi-Stage Build**:
   - Compiles TypeScript in `builder` stage.
   - Runs `npm prune --omit=dev` to strip all dev dependencies.
   - Copies only compiled JavaScript (`dist/`) and production `node_modules` into final image.
   - Final image size is ~180MB (vs ~900MB unoptimized).
2. **Non-Root Execution**:
   - Container executes as non-root user `USER node` (UID 1000) for security hardening.
3. **Log Rotation**:
   - `docker-compose.yml` configures `max-size: 10m` and `max-file: 3` to prevent container logs from filling up server storage.
4. **Clean `.dockerignore`**:
   - Ensures local `node_modules`, `.env`, and test artifacts are never baked into the container image.

---

## 🌐 Nginx Reverse Proxy & SSL (Optional HTTPS Setup)

On a public VPS, put Nginx in front with SSL certbot:

```nginx
server {
    server_name api.silayimaster.com;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛑 Useful Docker Commands

```bash
# Stop backend
docker compose down

# Restart backend
docker compose restart

# Rebuild after pulling latest git changes
git pull origin main
docker compose up -d --build

# Inspect resource usage
docker stats silayi-master-backend
```
