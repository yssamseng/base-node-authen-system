# Development Stage
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies based on package manager
RUN if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install; \
    elif [ -f package-lock.json ]; then \
    npm ci; \
    elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install; \
    else \
    npm install; \
    fi

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Development command
CMD ["npm", "run", "dev"]

# Production Stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install production dependencies only
RUN if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --prod --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
    npm ci --only=production; \
    elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --production; \
    else \
    npm install --production; \
    fi

# Copy source code and transpile if needed
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Production command
CMD ["node", "src/server.js"]
