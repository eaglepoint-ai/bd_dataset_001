FROM node:20-alpine

WORKDIR /app

COPY repository_before/package*.json ./
COPY repository_before/ .

RUN npm install && npm run build

CMD ["npm", "test"]

