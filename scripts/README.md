# Scripts

This directory contains essential scripts for the ChordRectness project.

## Available Scripts

### `dev.sh`
Main development script that starts the full development environment with Docker.
- Starts API, frontend, ML service, Redis, and PostgreSQL
- Uses ports 3002 (API) and 3003 (frontend)
- Includes hot reload for development

**Usage:**
```bash
npm run dev
# or
./scripts/dev.sh
```

### `build.sh`
Production build script that builds all Docker images for production deployment.

**Usage:**
```bash
npm run build
# or
./scripts/build.sh
```

## Quick Commands

Instead of using scripts, you can also use these direct Docker Compose commands:

```bash
# Start development environment
docker-compose -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Start only API and frontend (minimal setup)
docker-compose -f infrastructure/docker/docker-compose.yml up --build api web
```

## Removed Scripts

- `setup.sh` - Legacy script, Docker handles all setup
- `clean.sh` - Use `docker-compose down` instead
- `dev-clean.sh` - Redundant with main dev.sh
- `dev-minimal.sh` - Use Docker Compose directly for minimal setup

