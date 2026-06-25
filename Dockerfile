# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install development & production dependencies for compile time
RUN npm ci

# Copy full source trees
COPY . .

# Compile React client bundle + Bundled Express Server
RUN npm run build


# --- Production Runtime Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

# Set execution mode to production
ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency manifests
COPY package*.json ./

# Install only production-tier dependencies to preserve size boundaries
RUN npm ci --omit=dev

# Copy compiled assets and server bundles from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/vite.config.ts ./vite.config.ts

# Spareflow AI binds strictly to port 3000 inside container ingress networks
EXPOSE 3000

# Execute server bundle
CMD ["npm", "run", "start"]
