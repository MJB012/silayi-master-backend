#!/usr/bin/env bash
# ==========================================================
# Automated Docker Deployment Script for Silayi Master Backend
# ==========================================================

set -e

# Change to script directory
cd "$(dirname "$0")"

echo "=========================================================="
echo " Starting Silayi Master Backend Docker Deployment..."
echo "=========================================================="

# 1. Check for .env file
if [ ! -f .env ]; then
  echo "⚠️  .env file not found!"
  if [ -f .env.example ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo " Please edit .env with your MongoDB and JWT credentials, then re-run ./deploy.sh"
    exit 1
  else
    echo "❌ No .env or .env.example found. Aborting."
    exit 1
  fi
fi

# 2. Check Docker availability
if ! command -v docker &> /dev/null; then
  echo "❌ Error: Docker is not installed on this machine."
  echo "Please install Docker and Docker Compose before running this script."
  exit 1
fi

# 3. Determine docker compose command (v2 plugin or v1 standalone)
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "❌ Error: Docker Compose is not available."
  exit 1
fi

echo " Using: $DOCKER_COMPOSE"

# 4. Build fresh Docker image
echo " Building Docker image..."
$DOCKER_COMPOSE build --no-cache

# 5. Start / Restart container in background
echo " Starting container in background..."
$DOCKER_COMPOSE up -d --remove-orphans

# 6. Wait for container healthcheck
echo " Waiting for application to initialize..."
ATTEMPTS=0
MAX_ATTEMPTS=20
HEALTHY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  sleep 2
  ATTEMPTS=$((ATTEMPTS+1))
  
  CONTAINER_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' silayi-master-backend 2>/dev/null || echo "\"unknown\"")
  
  if [ "$CONTAINER_STATUS" = "\"healthy\"" ]; then
    HEALTHY=true
    break
  elif [ "$CONTAINER_STATUS" = "\"unhealthy\"" ]; then
    echo "❌ Container reported unhealthy status."
    break
  fi
  echo -n "."
done

echo ""

if [ "$HEALTHY" = true ]; then
  echo "=========================================================="
  echo " Deployment Successful!"
  echo " Backend running at: http://localhost:3003"
  echo " Health check:       http://localhost:3003/health"
  echo "=========================================================="
  $DOCKER_COMPOSE ps
else
  echo "⚠️  Container is taking longer to respond. Showing recent logs:"
  $DOCKER_COMPOSE logs --tail 30
fi
