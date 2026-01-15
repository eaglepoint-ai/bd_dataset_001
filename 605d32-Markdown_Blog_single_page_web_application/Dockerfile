FROM node:20-slim AS builder
WORKDIR /build
COPY repository_after/package.json repository_after/package-lock.json repository_after/tsconfig.json ./
RUN npm install
COPY repository_after/src ./src
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*
ENV CHROME_BIN=/usr/bin/chromium
COPY --from=builder /build/dist ./repository_after/dist
COPY repository_after ./repository_after
COPY repository_before ./repository_before
COPY tests ./tests
COPY evaluation ./evaluation
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
WORKDIR /app/repository_after
EXPOSE 8000
CMD ["python3", "server.py"]
