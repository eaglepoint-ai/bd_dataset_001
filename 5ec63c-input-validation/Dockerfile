FROM python:3.11-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app/repository_before

CMD ["pytest", "-v", "--maxfail=1", "--disable-warnings", "--tb=short", "/app/tests"]

CMD ["tail", "-f", "/dev/null"]