FROM node:20-alpine

WORKDIR /app

# Install Python for evaluation script
RUN apk add --no-cache python3 py3-pip

# Copy and install Python dependencies first (for better caching)
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copy package files for repository_after to enable dependency caching
COPY repository_after/package*.json ./repository_after/

# Install dependencies for repository_after (Next.js) - done in build for faster subsequent runs
WORKDIR /app/repository_after
RUN if [ -f "package.json" ]; then npm ci --only=production=false; fi

# Copy everything else
WORKDIR /app
COPY . .

# Return to root
WORKDIR /app

CMD ["python3", "--version"]
