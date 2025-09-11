# ML Service Dockerfile
FROM python:3.11-slim AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Development stage
FROM base AS development
COPY . .
RUN mkdir -p models temp logs
EXPOSE 8001
CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8001"]

# Production stage
FROM base AS production
COPY . .
RUN mkdir -p models temp logs

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
