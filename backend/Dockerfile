# 1. Dependencies
FROM node:20.18-alpine3.21 AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN npm ci || yarn install --frozen-lockfile

# 2. Builder
FROM node:20.18-alpine3.21 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Build
RUN npx prisma generate
RUN npm run build

# 3. Runner
FROM node:20.18-alpine3.21 AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install ffmpeg for HLS video conversion
RUN apk add --no-cache ffmpeg

# Copy package files and install only production dependencies
COPY package.json yarn.lock* package-lock.json* ./
RUN npm ci --omit=dev || yarn install --production --frozen-lockfile

# Copy generated Prisma Client from builder layer
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application and Prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Create temp directory for HLS processing and ensure correct ownership
RUN mkdir -p tmp/hls uploads/videos uploads/images uploads/files \
    && chown -R appuser:nodejs tmp/hls uploads

# Switch to non-root user
USER appuser

EXPOSE 4000

# Run versioned migrations then start app. Never use db push in production.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
