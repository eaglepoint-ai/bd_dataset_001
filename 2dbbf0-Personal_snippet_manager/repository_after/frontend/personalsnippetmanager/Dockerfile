# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for better caching
COPY ./repository_after/frontend/personalsnippetmanager/package.json ./repository_after/frontend/personalsnippetmanager/package-lock.json ./
RUN npm install

# Build the application
COPY ./repository_after/frontend/personalsnippetmanager .
# Set build-time variables
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build artifacts
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
