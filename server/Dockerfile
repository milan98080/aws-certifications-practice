FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files and install dependencies as root
COPY package*.json ./
RUN npm install

# Copy source code (excluding node_modules via .dockerignore)
COPY . .

# Change ownership and switch to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"]