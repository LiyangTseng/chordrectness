# 🎵 ChordRectness

**Enterprise-grade YouTube chord recognition platform**

A modern, scalable web application that extracts chord progressions from YouTube video segments using AI-powered analysis. Built with TypeScript, Next.js, Fastify, and Python ML models.

## 🏗️ **Architecture Overview**

This is a **monorepo** following enterprise-grade patterns used by tech giants like Google, Meta, and Netflix:

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
│   ├── ml-service/         # Python ML service
│   └── audio-service/      # Audio processing
├── infrastructure/         # Infrastructure as Code
│   ├── docker/            # Container definitions
│   ├── kubernetes/        # K8s manifests
│   └── terraform/         # Cloud infrastructure
├── docs/                  # Documentation
├── scripts/               # Build & deployment
└── tools/                 # Development tools
```

## ✨ **Key Features**

- 🎬 **YouTube Integration**: Extract audio from any YouTube video
- ⏰ **Time-based Analysis**: Specify exact start and end times
- 🎼 **AI Chord Recognition**: ML-powered chord progression analysis
- 📊 **Confidence Scoring**: Reliability metrics for each chord
- 🎨 **Modern UI**: Beautiful, responsive interface
- 🔧 **TypeScript**: Full type safety across the stack
- 🚀 **Scalable**: Microservices architecture
- 🐳 **Containerized**: Docker-ready deployment

## 🚀 **Quick Start**

### **Prerequisites**
- Docker & Docker Compose
- Git

### **One-Command Setup**
```bash
# Clone and start development environment
git clone <repository-url>
cd chordrectness
npm run dev
```

### **Development (Docker-First)**
```bash
# Start all services with hot reload
npm run dev

# Services available at:
# 🌐 Frontend: http://localhost:3000
# 🚀 Backend API: http://localhost:3001
# 📚 API Docs: http://localhost:3001/docs
# 🤖 ML Service: http://localhost:8001
# 📊 ML Docs: http://localhost:8001/docs
```

### **Native Development (Optional)**
```bash
# If you prefer native development
npm run dev:native

# Or start individually
npm run dev:native --workspace=@chordrectness/web
npm run dev:native --workspace=@chordrectness/api
npm run dev:native --workspace=@chordrectness/ml-service
```

### **Production Build**
```bash
# Build production images
npm run build

# Start production environment
docker-compose -f infrastructure/docker/docker-compose.yml up
```

## 🎯 **Usage**

1. **Paste YouTube URL**: Enter any YouTube video URL
2. **Set Time Range**: Specify start time (and optionally end time)
3. **Analyze**: Click analyze to start chord recognition
4. **View Results**: See chord progression with confidence scores

### **Example**
```
YouTube URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
Start Time: 0:30
End Time: 1:00

Result:
- Cmaj7 (0:30-0:35) - Confidence: 0.87
- Am7 (0:35-0:40) - Confidence: 0.82
- Dm7 (0:40-0:45) - Confidence: 0.85
- G7 (0:45-0:50) - Confidence: 0.89
```

## 🔧 **Development**

### **Monorepo Commands**
```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Lint all code
npm run lint

# Type check
npm run type-check

# Format code
npm run format
```

### **Individual Workspace Commands**
```bash
# Frontend development
cd apps/web
npm run dev
npm run build
npm run lint

# Backend development
cd apps/api
npm run dev
npm run build
npm run test

# ML service development
cd services/ml-service
python main.py
pip install -r requirements.txt
```

## 🤖 **ML Integration**

The platform supports multiple ML integration patterns:

### **1. HTTP API (Production)**
```typescript
// TypeScript calls Python FastAPI
const response = await axios.post('http://ml-service:8001/analyze', {
  audio_path: '/path/to/audio.wav',
  start_time: 0,
  end_time: 30
});
```

### **2. Child Process (Development)**
```typescript
// Direct Python execution
const pythonProcess = spawn('python3', [
  'chord_analyzer.py',
  '--audio-path', audioPath
]);
```

### **3. gRPC (High Performance)**
```typescript
// gRPC communication
const client = new ChordAnalysisClient('localhost:50051');
const response = await client.analyzeChord(request);
```

## 📁 **Project Structure**

### **Applications (`apps/`)**
- **`web/`**: Next.js frontend with TypeScript
- **`api/`**: Express.js backend with TypeScript

### **Packages (`packages/`)**
- **`shared-types/`**: Common TypeScript interfaces
- **`ui-components/`**: Reusable React components
- **`utils/`**: Shared utility functions

### **Services (`services/`)**
- **`ml-service/`**: Python FastAPI ML service
- **`audio-service/`**: Audio processing service

### **Infrastructure (`infrastructure/`)**
- **`docker/`**: Container definitions
- **`kubernetes/`**: K8s deployment manifests
- **`terraform/`**: Cloud infrastructure code

## 🎼 **Supported Chord Types**

- **Major**: C, D, E, F, G, A, B
- **Minor**: Cm, Dm, Em, Fm, Gm, Am, Bm
- **Dominant 7th**: C7, D7, E7, F7, G7, A7, B7
- **Major 7th**: Cmaj7, Dmaj7, Emaj7, Fmaj7, Gmaj7, Amaj7, Bmaj7
- **Minor 7th**: Cm7, Dm7, Em7, Fm7, Gm7, Am7, Bm7
- **Extensions**: 9th, 11th, 13th chords
- **Alterations**: Sharp/flat variations

## 🔮 **Roadmap**

### **Phase 1: Core Platform** ✅
- [x] Monorepo architecture
- [x] TypeScript throughout
- [x] ML integration patterns
- [x] Docker containerization

### **Phase 2: Enhanced ML** 🚧
- [ ] Advanced ML models
- [ ] Key signature detection
- [ ] Tempo analysis
- [ ] Real-time processing

### **Phase 3: Production Features** 📋
- [ ] User authentication
- [ ] Analysis history
- [ ] Export functionality
- [ ] API rate limiting

### **Phase 4: Scale & Performance** 🔮
- [ ] Kubernetes deployment
- [ ] Auto-scaling
- [ ] CDN integration
- [ ] Global deployment

## 🏢 **Enterprise Features**

- **Monorepo**: Single repository for all services
- **TypeScript**: Full type safety across the stack
- **Microservices**: Scalable, independent services
- **Containerized**: Docker-ready deployment
- **CI/CD Ready**: GitHub Actions integration
- **Monitoring**: Health checks and logging
- **Security**: Rate limiting, CORS, validation

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- [librosa](https://librosa.org/) - Audio analysis library
- [music21](https://web.mit.edu/music21/) - Music theory toolkit
- [Next.js](https://nextjs.org/) - React framework
- [Express.js](https://expressjs.com/) - Node.js framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework

## 📞 **Support**

- 📧 Email: support@chordrectness.com
- 💬 Discord: [Join our community](https://discord.gg/chordrectness)
- 📖 Documentation: [docs.chordrectness.com](https://docs.chordrectness.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/chordrectness/issues)

---

**Built with ❤️ for the music community**