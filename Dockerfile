# Build stage
FROM node:lts-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache g++ gcc make python3

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:lts-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache g++ gcc make python3

# Copy package files
COPY package*.json ./

# Install git and production dependencies
RUN npm install --omit=dev --ignore-scripts && \
    npm rebuild bcrypt --build-from-source && \
    # Keep the build dependencies for bcrypt runtime
    apk add --no-cache g++ gcc make python3

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
