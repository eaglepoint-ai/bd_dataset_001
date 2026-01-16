FROM node:18-alpine

WORKDIR /app

# Copy repository_after
COPY repository_after/package*.json ./
RUN npm install

COPY repository_after/ ./

# Copy evaluation script
COPY evaluation/ /evaluation/

# Build the Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Default command runs the app
CMD ["npm", "start"]
