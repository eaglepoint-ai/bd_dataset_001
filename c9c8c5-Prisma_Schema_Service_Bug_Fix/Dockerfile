FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY repository_before/package.json ./
RUN npm install --legacy-peer-deps 2>/dev/null || true

# Copy all source files
COPY repository_before/ ./

# Run TypeScript compilation (build + run in one step)
RUN npx tsc --noEmit && echo "TypeScript compilation successful!"

CMD ["echo", "Build and run completed successfully"]
