# ChordRectness

**Easy-to-use platform for quick music chord lookup**

ChordRectness is a musical analysis platform that listens to audio files and identifies the chords being played. It provides chord progression analysis with confidence scores, making it useful for musicians, music students, and music enthusiasts.

## **Usage**

1. **Provide Audio**: Upload audio wav file / Enter any YouTube video URL (TODO)
2. **Set Time Range**: Specify start time (and optionally end time)
3. **Analyze**: Click analyze to start chord recognition
4. **View Results**: See chord progression with confidence scores

## **Software Architecture**

Built with TypeScript, Next.js, Fastify that aim for scalability. Plan to incorporate AI/ML models for chord analysis in the future.

For more details, refer to the [architecture document](docs/ARCHITECTURE.md).

## **Quick Start**

### **Prerequisites**
- Docker & Docker Compose
- Git

### Codebase
```bash
# Clone and start development environment
git clone https://github.com/LiyangTseng/chordrectness
cd chordrectness
```

### Development

Start all services with Docker:
```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000 (Next.js)
- **Backend API**: http://localhost:3001 (Fastify)
- **Audio Processing Algo**: http://localhost:8001 (Python/FastAPI)

**Stop services:**
```bash
npm run dev:down
```

**View logs:**
```bash
npm run dev:logs
```



## Audio Processing Algorithm

The platform uses HTTP API communication between services:

### HTTP API Communication
```typescript
// TypeScript calls Python FastAPI
const response = await axios.post('http://chord-analyzer:8001/api/v1/analyze/audio', {
  audio_path: '/path/to/audio.wav',
  start_time: 0,
  end_time: 30
});
```

## Project Structure

### Applications (`apps/`)
- **`web/`**: Next.js frontend with TypeScript
- **`api/`**: Fastify backend with TypeScript

### Packages (`packages/`)
- **`shared-types/`**: Common TypeScript interfaces
- **`ui-components/`**: Reusable React components
- **`utils/`**: Shared utility functions

### Services (`services/`)
- **`chord-analyzer/`**: Python FastAPI ML service

### Infrastructure
- **`docker-compose.yml`**: Docker development environment
- **`Dockerfile.*`**: Container definitions for each service

## **Supported Chord Types**

- **Major**: C, D, E, F, G, A, B
- **Minor**: Cm, Dm, Em, Fm, Gm, Am, Bm
- **Dominant 7th**: C7, D7, E7, F7, G7, A7, B7
- **Major 7th**: Cmaj7, Dmaj7, Emaj7, Fmaj7, Gmaj7, Amaj7, Bmaj7
- **Minor 7th**: Cm7, Dm7, Em7, Fm7, Gm7, Am7, Bm7
- **Extensions**: 9th, 11th, 13th chords
- **Alterations**: Sharp/flat variations

## **Roadmap**

### **Phase 1: Core Platform**
- [x] Monorepo architecture
- [x] TypeScript throughout
- [x] ML integration patterns
- [x] Docker containerization

### **Phase 2: Enhanced ML**
- [ ] Advanced ML models
- [ ] Key signature detection
- [ ] Tempo analysis
- [ ] Real-time processing

### **Phase 3: Production Features**
- [ ] User authentication
- [ ] Analysis history
- [ ] Export functionality
- [ ] API rate limiting

### **Phase 4: Scale & Performance**
- [ ] Kubernetes deployment
- [ ] Auto-scaling
- [ ] CDN integration
- [ ] Global deployment

## **Codebase Features**

- **Monorepo**: Single repository for all services
- **TypeScript**: Full type safety across the stack
- **Microservices**: Scalable, independent services
- **Containerized**: Docker-ready deployment
- **CI/CD Ready**: GitHub Actions integration
- **Monitoring**: Health checks and logging
- **Security**: Rate limiting, CORS, validation