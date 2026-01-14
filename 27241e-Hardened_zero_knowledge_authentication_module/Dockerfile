FROM nikolaik/python-nodejs:python3.11-nodejs18-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements.txt
CMD ["node", "repository_before/AuthModule.js"]
