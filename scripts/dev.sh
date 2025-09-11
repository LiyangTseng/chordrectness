#!/bin/bash

# ChordRectness Development Script - Docker First
# This script sets up the development environment using Docker

set -e

echo "🐳 Setting up ChordRectness development environment with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker daemon is running"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p temp/audio logs

# Build and start development environment
echo "🔨 Building and starting development environment..."

# Use docker-compose if available, otherwise use docker compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Start development environment
$COMPOSE_CMD -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml up --build

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "Services available at:"
echo "  🌐 Frontend: http://localhost:3003"
echo "  🚀 Backend API: http://localhost:3002"
echo "  📚 API Docs: http://localhost:3002/docs"
echo "  🤖 ML Service: http://localhost:8001"
echo "  📊 ML Docs: http://localhost:8001/docs"
echo "  🔴 Redis: localhost:6379"
echo "  🐘 PostgreSQL: localhost:5432"
echo ""
echo "To stop the environment:"
echo "  $COMPOSE_CMD -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml down"
echo ""
echo "To view logs:"
echo "  $COMPOSE_CMD -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml logs -f"
echo ""
echo "Happy coding! 🎵"
