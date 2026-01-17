FROM node:18-slim
WORKDIR /app

COPY package*.json ./

RUN npm install --include=dev

COPY . ./

CMD [ "echo","build successful" ]
