# 🐳 Docker-First Development Guide

*Why we use Docker for development and how to work with it*

## 🎯 **Why Docker-First Development?**

### **The Problem with Native Development**

Traditional development setups have several issues:

```
❌ Native Development Problems:
├── 🔧 Environment Setup: Different Node.js, Python versions
├── 🐛 "Works on my machine": Inconsistent environments
├── 📦 Dependency Hell: Package conflicts and version mismatches
├── 🚀 Deployment Issues: Dev vs Production differences
├── 👥 Team Onboarding: Hours of setup for new developers
└── 🔄 Context Switching: Different tools for different projects
```

### **The Docker Solution**

Docker-first development solves these problems:

```
✅ Docker Development Benefits:
├── 🐳 Consistent Environment: Same everywhere
├── 🚀 Fast Onboarding: One command setup
├── 🔒 Isolated Dependencies: No conflicts
├── 📦 Production Parity: Dev = Production
├── 👥 Team Collaboration: Everyone has same setup
└── 🔄 Easy Context Switching: Just run containers
```

## 🏗️ **Docker Architecture**

### **Multi-Stage Dockerfiles**

Each service uses multi-stage builds for optimal development and production:

```dockerfile
# Development Stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

# Production Stage  
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### **Docker Compose Structure**

```
infrastructure/docker/
├── docker-compose.yml          # Base configuration
├── docker-compose.dev.yml      # Development overrides
├── Dockerfile.web              # Frontend container
├── Dockerfile.api              # Backend container
└── Dockerfile.ml               # ML service container
```

## 🚀 **Development Workflow**

### **Starting Development**

```bash
# One command to rule them all
npm run dev

# What happens:
# 1. Builds all Docker images
# 2. Starts all services with hot reload
# 3. Sets up networking between services
# 4. Mounts source code for live editing
```

### **Services Available**

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js web application |
| **Backend API** | http://localhost:3001 | Fastify API server |
| **API Docs** | http://localhost:3001/docs | Auto-generated Swagger docs |
| **ML Service** | http://localhost:8001 | Python FastAPI ML service |
| **ML Docs** | http://localhost:8001/docs | ML service documentation |
| **Redis** | localhost:6379 | Caching and queues |
| **PostgreSQL** | localhost:5432 | Database |

### **Hot Reload & Live Editing**

All services support hot reload:

- **Frontend**: Next.js hot reload for instant UI updates
- **Backend**: tsx watch mode for TypeScript changes
- **ML Service**: uvicorn reload for Python changes

## 🔧 **Development Commands**

### **Main Commands**

```bash
# Start development environment
npm run dev

# Build production images
npm run build

# Clean up everything
npm run clean

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml logs -f

# Stop services
docker-compose -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml down
```

### **Individual Service Commands**

```bash
# Start specific service
docker-compose -f infrastructure/docker/docker-compose.yml up web
docker-compose -f infrastructure/docker/docker-compose.yml up api
docker-compose -f infrastructure/docker/docker-compose.yml up ml-service

# Rebuild specific service
docker-compose -f infrastructure/docker/docker-compose.yml build web
docker-compose -f infrastructure/docker/docker-compose.yml build api
docker-compose -f infrastructure/docker/docker-compose.yml build ml-service
```

### **Debugging Commands**

```bash
# Access container shell
docker-compose -f infrastructure/docker/docker-compose.yml exec api sh
docker-compose -f infrastructure/docker/docker-compose.yml exec ml-service bash

# View container logs
docker-compose -f infrastructure/docker/docker-compose.yml logs api
docker-compose -f infrastructure/docker/docker-compose.yml logs ml-service

# Check container status
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

## 🛠️ **Development Tools**

### **VS Code Integration**

Install the Docker extension for VS Code:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker"
  ]
}
```

### **Debugging in Containers**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}/apps/api",
      "remoteRoot": "/app"
    }
  ]
}
```

### **Container Development**

```bash
# Start development tools container
docker-compose -f infrastructure/docker/docker-compose.yml --profile tools up dev-tools

# Access development tools
docker-compose -f infrastructure/docker/docker-compose.yml exec dev-tools sh

# Run commands in development tools
docker-compose -f infrastructure/docker/docker-compose.yml exec dev-tools npm run lint
docker-compose -f infrastructure/docker/docker-compose.yml exec dev-tools npm run test
```

## 📊 **Performance & Resource Usage**

### **Resource Requirements**

| Service | CPU | Memory | Disk |
|---------|-----|--------|------|
| **Frontend** | 0.1 cores | 256MB | 100MB |
| **Backend** | 0.2 cores | 512MB | 200MB |
| **ML Service** | 0.5 cores | 1GB | 500MB |
| **Redis** | 0.1 cores | 128MB | 50MB |
| **PostgreSQL** | 0.2 cores | 256MB | 1GB |

**Total**: ~2GB RAM, 1 core CPU

### **Optimization Tips**

```bash
# Limit resource usage
docker-compose -f infrastructure/docker/docker-compose.yml up --scale ml-service=0

# Use development overrides
docker-compose -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml up

# Clean up unused resources
docker system prune -f
docker volume prune -f
```

## 🔒 **Security Considerations**

### **Development Security**

```yaml
# docker-compose.dev.yml
services:
  api:
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug  # More verbose logging
    volumes:
      - ../../apps/api:/app  # Source code mounted
```

### **Production Security**

```yaml
# docker-compose.yml
services:
  api:
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info  # Less verbose logging
    # No source code mounted
    # Uses built images only
```

## 🚀 **Deployment Pipeline**

### **Development → Production**

```bash
# 1. Development
npm run dev

# 2. Testing
npm run test

# 3. Build production images
npm run build

# 4. Deploy to staging
docker-compose -f infrastructure/docker/docker-compose.yml up

# 5. Deploy to production
docker-compose -f infrastructure/docker/docker-compose.yml -f infrastructure/docker/docker-compose.prod.yml up
```

### **CI/CD Integration**

```yaml
# .github/workflows/docker.yml
name: Docker Build
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: npm run build
      - name: Run tests
        run: docker-compose -f infrastructure/docker/docker-compose.yml run --rm api npm test
```

## 🎯 **Best Practices**

### **Development**

1. **Use Docker for everything** - Don't mix native and containerized development
2. **Mount source code** - For hot reload and live editing
3. **Use development overrides** - Separate dev and prod configurations
4. **Clean up regularly** - Remove unused images and volumes
5. **Monitor resources** - Keep an eye on CPU and memory usage

### **File Organization**

```
chordrectness/
├── infrastructure/docker/     # All Docker configuration
│   ├── docker-compose.yml    # Base configuration
│   ├── docker-compose.dev.yml # Development overrides
│   └── Dockerfile.*          # Service-specific Dockerfiles
├── scripts/                  # Docker-based scripts
│   ├── dev.sh               # Development setup
│   ├── build.sh             # Production build
│   └── clean.sh             # Cleanup
└── .dockerignore            # Docker ignore patterns
```

### **Environment Variables**

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
REDIS_URL=redis://redis:6379
ML_SERVICE_URL=http://ml-service:8001

# .env.production
NODE_ENV=production
LOG_LEVEL=info
REDIS_URL=redis://production-redis:6379
ML_SERVICE_URL=http://production-ml:8001
```

## 🎓 **Learning Resources**

### **Docker Fundamentals**
- [Docker Official Tutorial](https://docs.docker.com/get-started/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/)

### **Development Best Practices**
- [Docker Development Workflow](https://docs.docker.com/develop/dev-best-practices/)
- [Container Security](https://docs.docker.com/develop/security-best-practices/)
- [Performance Optimization](https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/)

## 🎯 **Key Takeaways**

### **Why Docker-First Development Works**

1. **🚀 Fast Onboarding**: New developers productive in minutes
2. **🔒 Consistent Environment**: Same setup everywhere
3. **📦 Isolated Dependencies**: No version conflicts
4. **🔄 Easy Context Switching**: Just run containers
5. **🚀 Production Parity**: Dev environment matches production
6. **👥 Team Collaboration**: Everyone has identical setup

### **For Developers**

- **Faster setup** - No more "works on my machine" issues
- **Better debugging** - Consistent environment for troubleshooting
- **Easier testing** - Same environment for all tests
- **Simpler deployment** - Containers work the same everywhere

### **For Teams**

- **Faster onboarding** - New developers productive immediately
- **Better collaboration** - Everyone has same environment
- **Easier maintenance** - Consistent tooling across team
- **Reduced support** - Fewer environment-related issues

This Docker-first approach makes ChordRectness **easy to develop, test, and deploy** while maintaining the highest standards of consistency and reliability.

---

*Happy containerized coding! 🐳*
