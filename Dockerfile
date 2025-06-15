# Use Node.js image with pnpm pre-installed for development
FROM node:23.6.1-alpine

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl openssl-dev

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.4.0

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies)
RUN pnpm install

# Copy source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application in development mode with live reload
CMD ["/usr/local/bin/pnpm", "dev"]
