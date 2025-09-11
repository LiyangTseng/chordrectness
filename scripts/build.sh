#!/bin/bash

# ChordRectness Build Script - Docker First
# This script builds the production environment using Docker

set -e

echo "🏗️ Building ChordRectness production environment with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Use docker-compose if available, otherwise use docker compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Build production images
echo "🔨 Building production images..."

# Build web application
echo "📱 Building web application..."
$COMPOSE_CMD -f infrastructure/docker/docker-compose.yml build --target runner web

# Build API
echo "🚀 Building API..."
$COMPOSE_CMD -f infrastructure/docker/docker-compose.yml build --target runner api

# Build ML service
echo "🤖 Building ML service..."
$COMPOSE_CMD -f infrastructure/docker/docker-compose.yml build --target production ml-service

echo ""
echo "✅ Production build completed!"
echo ""
echo "To start production environment:"
echo "  $COMPOSE_CMD -f infrastructure/docker/docker-compose.yml up"
echo ""
echo "To push images to registry:"
echo "  docker tag chordrectness_web your-registry/chordrectness-web:latest"
echo "  docker tag chordrectness_api your-registry/chordrectness-api:latest"
echo "  docker tag chordrectness_ml-service your-registry/chordrectness-ml:latest"
echo ""
echo "Happy deploying! 🚀"
