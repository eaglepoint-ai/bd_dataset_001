# Multi-stage Dockerfile for testing

# Backend build stage
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/ .
RUN go mod tidy && go build -o main .

# Frontend build stage
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Final stage
FROM alpine:latest
WORKDIR /app
COPY --from=backend-builder /app/backend/main ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

EXPOSE 8080 3000

CMD ["./backend/main"]
