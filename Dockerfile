# Build stage
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with specific version
RUN npm ci --ignore-scripts && \
    npm install @scalar/hono-api-reference@0.7.2 --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:lts-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install git and production dependencies with specific version
RUN npm install --omit=dev --ignore-scripts && \
    npm install @scalar/hono-api-reference@0.7.2 --ignore-scripts

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
