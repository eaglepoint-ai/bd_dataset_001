FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any (none needed for sqlite/pure python usually, but maybe gcc for some libs)
# RUN apt-get update && apt-get install -y gcc

COPY repository_after/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY repository_after .

# Run migrations (attempt) and server
# A wrapper script would be better, but CMD is fine for simple setup
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
