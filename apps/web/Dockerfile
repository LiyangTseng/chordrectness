FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY app/ ./app/
COPY components/ ./components/

# Expose port
EXPOSE 3000

# Run in development mode
CMD ["npm", "run", "dev"]
