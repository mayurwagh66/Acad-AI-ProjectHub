FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package management files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy rest of application code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose server port
EXPOSE 5000

# Default environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Run the app
CMD ["node", "app.js"]
