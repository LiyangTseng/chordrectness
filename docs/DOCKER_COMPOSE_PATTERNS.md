# 🐳 Docker Compose Override Patterns

*Why we separate docker-compose.yml and docker-compose.dev.yml*

## 🎯 **The Problem: Single File Approach**

### **❌ What NOT to Do**

```yaml
# BAD: Single file trying to do everything
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - .:/app  # Development volume
    environment:
      - NODE_ENV=development  # Development env
    command: npm run dev      # Development command
```

**Problems:**
- 🔧 **Mixed Concerns**: Dev and prod configs mixed together
- 🚀 **Deployment Issues**: Can't deploy to production safely
- 🐛 **Debugging**: Hard to know which settings are for what
- 🔄 **Maintenance**: Changes affect both environments
- 🔒 **Security**: Development settings leak to production

## ✅ **The Solution: Override Pattern**

### **Base Configuration (Production-Ready)**

```yaml
# docker-compose.yml - Production defaults
version: '3.8'
services:
  api:
    build:
      context: ../../apps/api
      dockerfile: ../../infrastructure/docker/Dockerfile.api
      target: runner  # Production stage
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    # No volumes (production doesn't need source code)
    # Uses built images only
```

### **Development Overrides**

```yaml
# docker-compose.dev.yml - Development overrides
version: '3.8'
services:
  api:
    build:
      target: development  # Override: Use development stage
    volumes:  # Override: Add volume mounts for live editing
      - ../../apps/api:/app
      - /app/node_modules
    environment:  # Override: Development environment variables
      - NODE_ENV=development
      - LOG_LEVEL=debug
    command: npm run dev  # Override: Development command
```

## 🏗️ **How Docker Compose Overrides Work**

### **Override Mechanism**

Docker Compose merges files in this order:

1. **Base file** (`docker-compose.yml`): Production-ready defaults
2. **Override file** (`docker-compose.dev.yml`): Development-specific changes
3. **Result**: Development settings override production settings

### **Usage Commands**

```bash
# Development (uses both files)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production (uses only base file)
docker-compose -f docker-compose.yml up
```

## 🎯 **Specific Benefits for ChordRectness**

### **1. 🔒 Security Separation**

| Setting | Production | Development |
|---------|------------|-------------|
| **NODE_ENV** | `production` | `development` |
| **LOG_LEVEL** | `info` | `debug` |
| **Volumes** | None (built images) | Source code mounted |
| **Command** | `npm start` | `npm run dev` |

### **2. 🚀 Performance Optimization**

**Production:**
- ✅ **Optimized images**: Uses `runner` stage
- ✅ **No volume mounts**: Faster startup
- ✅ **Production commands**: Optimized for performance
- ✅ **Minimal logging**: Less overhead

**Development:**
- ✅ **Development images**: Uses `development` stage
- ✅ **Volume mounts**: Live editing with hot reload
- ✅ **Development commands**: With debugging and reloading
- ✅ **Verbose logging**: Better debugging

### **3. 🔧 Environment-Specific Configuration**

**Production:**
```yaml
postgres:
  environment:
    - POSTGRES_DB=chordrectness_prod
  volumes:
    - postgres-prod-data:/var/lib/postgresql/data
```

**Development:**
```yaml
postgres:
  environment:
    - POSTGRES_DB=chordrectness_dev
  volumes:
    - postgres-dev-data:/var/lib/postgresql/data
```

## 🏢 **Enterprise Best Practices**

### **Companies Using This Pattern**

- **Netflix**: Separate dev/staging/prod compose files
- **Uber**: Environment-specific overrides
- **Shopify**: Multiple compose files for different environments
- **Microsoft**: Azure services use this pattern
- **Google**: Kubernetes with environment-specific configs

### **Why Enterprises Love This**

1. **🔒 Security**: Production configs never leak to development
2. **🚀 Performance**: Optimized for each environment
3. **🔄 CI/CD**: Easy to deploy different environments
4. **👥 Team Collaboration**: Clear separation of concerns
5. **📊 Monitoring**: Environment-specific logging and metrics
6. **🛡️ Compliance**: Audit trails for different environments

## 🎯 **Real-World Example: ChordRectness**

### **Production Configuration**

```yaml
# docker-compose.yml
services:
  web:
    build:
      target: runner  # Optimized production image
    environment:
      - NODE_ENV=production
    # No volumes - uses built image

  api:
    build:
      target: runner  # Optimized production image
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    # No volumes - uses built image

  ml-service:
    build:
      target: production  # Optimized production image
    # No volumes - uses built image
```

### **Development Overrides**

```yaml
# docker-compose.dev.yml
services:
  web:
    build:
      target: development  # Development image with dev tools
    volumes:
      - ../../apps/web:/app  # Live editing
    environment:
      - NODE_ENV=development
    command: npm run dev  # Hot reload

  api:
    build:
      target: development  # Development image with dev tools
    volumes:
      - ../../apps/api:/app  # Live editing
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    command: npm run dev  # Hot reload

  ml-service:
    build:
      target: development  # Development image with dev tools
    volumes:
      - ../../services/ml-service:/app  # Live editing
    command: uvicorn main:app --reload  # Hot reload
```

## 🚀 **Usage Examples**

### **Development Workflow**

```bash
# Start development environment
npm run dev
# Equivalent to:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# What happens:
# 1. Loads base production config
# 2. Applies development overrides
# 3. Starts services with hot reload
# 4. Mounts source code for live editing
```

### **Production Deployment**

```bash
# Deploy to production
docker-compose -f docker-compose.yml up

# What happens:
# 1. Loads only production config
# 2. Uses optimized production images
# 3. No source code mounted
# 4. Production-optimized settings
```

### **CI/CD Pipeline**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          docker-compose -f docker-compose.yml -f docker-compose.staging.yml up
          
  deploy-production:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.yml up
```

## 🎯 **Advanced Patterns**

### **Multiple Environment Overrides**

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.yml up
```

### **Environment-Specific Files**

```
infrastructure/docker/
├── docker-compose.yml          # Base (production)
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.staging.yml  # Staging overrides
├── docker-compose.test.yml     # Testing overrides
└── docker-compose.prod.yml     # Production overrides
```

### **Profile-Based Services**

```yaml
# docker-compose.yml
services:
  api:
    # ... base config

  dev-tools:
    image: node:18-alpine
    profiles:
      - tools  # Only starts with --profile tools

# Usage:
docker-compose --profile tools up  # Includes dev-tools
docker-compose up                   # Excludes dev-tools
```

## 🎓 **Best Practices**

### **File Organization**

1. **Base file**: Production-ready defaults
2. **Override files**: Environment-specific changes only
3. **Clear naming**: `.dev.yml`, `.staging.yml`, `.prod.yml`
4. **Documentation**: Comment what each override does

### **Security Considerations**

1. **Never put secrets in override files**
2. **Use environment variables for sensitive data**
3. **Separate volumes for different environments**
4. **Different database names per environment**

### **Performance Optimization**

1. **Production**: Optimized images, no volumes
2. **Development**: Development images, volume mounts
3. **Staging**: Production-like but with debugging
4. **Testing**: Minimal services for fast tests

## 🎯 **Key Takeaways**

### **Why This Pattern Works**

1. **🔒 Security**: Production configs never leak to development
2. **🚀 Performance**: Optimized for each environment
3. **🔄 Maintainability**: Clear separation of concerns
4. **👥 Team Collaboration**: Everyone understands the structure
5. **📊 Monitoring**: Environment-specific logging and metrics
6. **🛡️ Compliance**: Audit trails for different environments

### **For Developers**

- **Faster development** with hot reload and live editing
- **Better debugging** with development-specific settings
- **Easier testing** with environment-specific configurations
- **Clearer understanding** of what runs where

### **For Operations**

- **Safer deployments** with production-only configs
- **Better monitoring** with environment-specific logging
- **Easier troubleshooting** with clear environment separation
- **Compliance** with audit trails for different environments

This pattern makes ChordRectness **production-ready** while maintaining an excellent development experience. It's exactly what you'd see at companies like Netflix, Uber, and Google! 🎵

---

*Happy containerized development! 🐳*

