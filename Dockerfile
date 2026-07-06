# Stage 1: Build the application
FROM node:24-alpine AS builder
WORKDIR /app

# Install native dependencies required for better-sqlite3 build
RUN apk add --no-cache python3 make g++ gcc libc-dev

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies (to build Next.js)
RUN npm ci

# Copy source files
COPY . .

# Build the Next.js application (generates .next/standalone)
RUN npm run build

# Stage 2: Production image
FROM node:24-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=20000
ENV HOSTNAME="0.0.0.0"

# Cài sqlite3 CLI để deploy script có thể checkpoint WAL trước khi backup
RUN apk add --no-cache sqlite

# Copy the standalone output and assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 20000

# Start Next.js using the standalone server
CMD ["node", "server.js"]
