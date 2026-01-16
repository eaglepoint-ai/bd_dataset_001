FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . /app

CMD ["sh", "-c", "npm test && node evaluation/evaluation.js"]