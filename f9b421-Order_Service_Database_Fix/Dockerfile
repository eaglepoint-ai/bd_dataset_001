FROM node:18-alpine

WORKDIR /workspace

COPY . .

RUN npm install

RUN node -c repository_before/order.service.js

CMD ["node", "-e", "console.log('Order Service syntax check passed')"]
