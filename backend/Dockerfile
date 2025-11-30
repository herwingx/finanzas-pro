# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /usr/src/app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm install --production

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy prisma schema first
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /usr/src/app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm install --production

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client in production
RUN npx prisma generate

# Copy built application
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
