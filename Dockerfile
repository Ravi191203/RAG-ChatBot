# Dockerfile

# 1. Builder Stage
FROM node:20-alpine AS builder
LABEL stage=builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# 2. Runner Stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy the standalone output from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static


# Expose the port the app runs on
EXPOSE 3000

# Set the user to run the app
USER nextjs

# Start the application
CMD ["node", "server.js"]
