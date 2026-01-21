# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies (including build tools for better-sqlite3)
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production

# Stage 3: Production image
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy backend node_modules and source
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY backend/package*.json ./
COPY backend/src ./src

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Start the server
CMD ["node", "src/index.js"]
