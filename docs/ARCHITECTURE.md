# Architecture Documentation

*A beginner-friendly guide to understanding our chord recognition platform*

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [How It All Works Together](#how-it-all-works-together)
4. [Getting Started](#getting-started)

## Architecture Overview
This is a **monorepo** project designed for scalability using Docker containerization. Built with modern technologies including Fastify, Next.js, and Python ML services.

```
chordrectness/
├── apps/                    # Applications
│   ├── web/                # Next.js Frontend
│   └── api/                # Fastify Backend
├── packages/               # Shared packages
│   ├── shared-types/       # TypeScript types
│   ├── ui-components/      # Reusable components
│   └── utils/              # Shared utilities
├── services/               # Microservices
│   └── chord-analyzer/     # Audio Processing service
├── docs/                   # Documentation
├── docker-compose.yml      # Docker development environment
└── Dockerfile.*           # Container definitions
```


## Key Features

- **Audio Upload**: Upload WAV, MP3, M4A audio files
- **YouTube Integration**: Extract audio from any YouTube videox
- **Time-based Analysis**: Specify exact start and end times
- **AI Chord Recognition**: ML-powered chord progression analysis
- **Confidence Scoring**: Reliability metrics for each chord
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **TypeScript**: Full type safety across the stack
- **Scalable**: Microservices architecture
- **Containerized**: Docker-ready deployment

## Project Structure

### apps/ - The Applications

The main applications that users directly interact with.

```
apps/
├── web/     # The website users see
└── api/     # The server that does the work
```

#### apps/web/ - Frontend Application
Everything the user sees and interacts with. Built with modern React and Next.js.
- **Technology:** Next.js, React, TypeScript, Tailwind CSS

```
apps/web/
├── app/             # Pages (what users see)
├── components/      # Reusable UI pieces
└── package.json     # Frontend-specific tools
```

#### apps/api/ - Backend Application
Business logic, data processing, and coordination between services.
- **Technology:** Fastify, TypeScript, Node.js
- **Performance:** Fastify provides 2-3x better performance than Express

```
apps/api/
├── src/
│   ├── routes/       # Fastify plugins (/api/analysis, /api/health)
│   ├── services/     # Business logic (analysis, audio processing)
│   ├── middleware/   # Fastify hooks (error handling, validation)
│   └── types/        # Data structures
└── package.json      # Backend-specific tools
```

### packages/ - Reusable Components

Reusable pieces that multiple applications need.

```
packages/
├── shared-types/    # TypeScript types used everywhere
├── ui-components/   # Reusable UI components
└── utils/          # Common utility functions
```

#### packages/shared-types/ - Type Definitions
**Responsibility:** Define what data looks like across all applications
**Technology:** TypeScript

**Why it's separate:**
- **Consistency**: Frontend and backend use same data structures
- **Type Safety**: Prevents mismatched data between services
- **Documentation**: Types serve as living documentation
- **Refactoring**: Change data structure in one place, updates everywhere
- **Prevents Bugs**: Catches data mismatches at compile time

**Example:**
```typescript
// shared-types/src/index.ts
export interface ChordSymbol {
  symbol: string;        // "Cmaj7"
  startTime: number;     // 2.5 (seconds)
  endTime: number;       // 4.0 (seconds)
  confidence: number;    // 0.87 (87% confident)
}
```

#### packages/ui-components/ - Reusable UI
**Responsibility:** Common UI components used across applications
**Technology:** React, TypeScript

**Why it's separate:**
- **Reusability**: Same button, form, card components everywhere
- **Consistency**: Same look and feel across all apps
- **Speed**: Don't rebuild common components
- **Testing**: Test components once, use everywhere
- **Future Apps**: Easy to create mobile app, admin panel, etc.

#### packages/utils/ - Common Functions
**Responsibility:** Helper functions used by multiple applications
**Technology:** TypeScript

**Why it's separate:**
- **DRY Principle**: Don't Repeat Yourself
- **Testing**: Test utility functions once
- **Documentation**: Central place for common functions
- **Updates**: Fix bug once, benefits all apps

### services/ - Specialized Services

These are specialized services that handle specific tasks.

```
services/
└── chord-analyzer/     # AI/ML chord recognition
```

#### services/chord-analyzer/ - Machine Learning Service
**Responsibility:** AI-powered chord recognition and music analysis
**Technology:** Python, FastAPI, librosa, music21

**Why it's separate:**
- **Python Ecosystem**: ML libraries are better in Python
- **Specialized Knowledge**: Requires ML expertise
- **Independent Scaling**: Can scale ML service separately
- **Model Updates**: Can update AI models without affecting web app
- **Experimentation**: Can try different ML approaches
- **Cost Optimization**: Can use GPU instances only for ML

**What it contains:**
```
services/chord-analyzer/
├── server.py           # FastAPI web server
├── api/               # API routes and models
├── models/            # AI models and processing
├── services/          # Business logic
└── requirements.txt   # Python dependencies
```

### Infrastructure - Deployment & Operations

These handle how the application runs in production.

```
infrastructure/
├── docker/         # Container definitions
├── kubernetes/     # Production deployment
└── terraform/      # Cloud infrastructure
```

#### Docker - Containerization
**Responsibility:** Package applications into containers
**Technology:** Docker, Docker Compose

**Why it's separate:**
- **Consistency**: Same environment everywhere (dev, staging, prod)
- **Easy Deployment**: Deploy anywhere that runs Docker
- **Dependency Management**: All dependencies included in container
- **Testing**: Test in production-like environment
- **Portability**: Run on any cloud provider

#### Kubernetes - Production Orchestration
**Responsibility:** Manage containers in production
**Technology:** Kubernetes, Helm

**Why it's separate:**
- **Auto-scaling**: Automatically scale based on demand
- **Rolling Updates**: Update without downtime
- **High Availability**: Automatic failover and recovery
- **Monitoring**: Built-in health checks and metrics
- **Cost Optimization**: Efficient resource usage

#### Terraform - Cloud Infrastructure
**Responsibility:** Define cloud resources (servers, databases, networks)
**Technology:** Terraform, AWS/GCP/Azure

**Why it's separate:**
- **Infrastructure as Code**: Version control your infrastructure
- **Reproducibility**: Create identical environments
- **Cost Management**: Track and optimize cloud costs
- **Security**: Define security policies in code
- **Compliance**: Meet regulatory requirements

### docs/ - Documentation

Keep all documentation organized and accessible.

```
docs/
├── ARCHITECTURE.md    # This file
├── API.md            # API documentation
├── DEPLOYMENT.md     # How to deploy
└── CONTRIBUTING.md   # How to contribute
```

**Why it's separate:**
- **Centralized**: All docs in one place
- **Easy to Find**: Developers know where to look
- **Version Control**: Track changes to documentation
- **Accessibility**: Can be published as website
- **Onboarding**: New developers can learn quickly

### Docker Development

Docker-based automation for consistent development.

```
docker-compose.yml    # Development environment
Dockerfile.*          # Container definitions
```

**Why it's separate:**
- **Docker-First**: Consistent environment everywhere
- **Automation**: One command to start everything
- **Consistency**: Same process every time
- **Speed**: Faster than manual setup
- **Reliability**: Less human error
- **Documentation**: Scripts document the process
- **Fast Onboarding**: New developers productive in minutes

---

## How It All Works Together

Now that you understand why each folder exists, let's see how they work together:

### Development Flow (Docker-First):
```
1. Developer: "I need to add a new feature"
2. Docker: "Let me start the development environment"
3. shared-types: "Let me define the data structure"
4. web: "Let me create the UI for this feature"
5. api: "Let me handle the business logic"
6. chord-analyzer: "Let me process the data"
7. Docker: "Everything runs in containers with hot reload"
```

### User Request Flow:
```
1. User: Clicks "Analyze" button
2. web: Sends request to api
3. api: Downloads YouTube video
4. api: Sends audio to chord-analyzer
5. chord-analyzer: Analyzes audio and returns chords
6. api: Formats response
7. web: Displays results to user
```

### Deployment Flow (Docker-First):
```
1. Docker: Build production Docker images
2. Docker: Create optimized containers
3. terraform: Create cloud infrastructure
4. kubernetes: Deploy containers
5. monitoring: Watch everything work
```

---

## Getting Started

### For Complete Beginners (Docker-First):

1. **Install Docker:**
   - Visit: https://docs.docker.com/get-docker/
   - Install Docker Desktop

2. **Start everything with one command:**
```bash
git clone <repository>
cd chordrectness
npm run dev
```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/docs
   - ML Service: http://localhost:8001

### For Developers:

1. **Docker-First Development:**
```bash
git clone <repository>
cd chordrectness
npm run dev  # Starts everything in Docker
```

2. **Or start individually:**
```bash
npm run dev --workspace=@chordrectness/web
npm run dev --workspace=@chordrectness/api
npm run dev --workspace=@chordrectness/chord-analyzer
```

---

## Key Takeaways

### Why This Structure Works:

1. **Single Responsibility**: Each folder has one clear purpose
2. **Reusability**: Shared code is in packages/
3. **Scalability**: Services can be scaled independently
4. **Team Work**: Different teams can work on different parts
5. **Testing**: Each part can be tested in isolation
6. **Maintenance**: Changes are contained and safe
7. **Learning**: Easy to understand and learn

### The Magic of Separation:

When you separate concerns properly:
- **Frontend developers** can focus on UI/UX
- **Backend developers** can focus on business logic
- **ML engineers** can focus on AI models
- **DevOps engineers** can focus on deployment
- **Everyone** can work without stepping on each other

This structure makes ChordRectness **maintainable**, **scalable**, and **easy to understand** - perfect for both beginners learning full-stack development and experienced developers building production systems.

---

*Happy coding and happy music making!*
