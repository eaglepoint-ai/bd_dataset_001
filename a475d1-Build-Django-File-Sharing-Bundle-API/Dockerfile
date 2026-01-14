FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any (none needed for sqlite/pure python usually, but maybe gcc for some libs)
# RUN apt-get update && apt-get install -y gcc

COPY repository_after/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY repository_after .

# Run database setup during the build process
RUN python manage.py migrate
RUN python init_admin.py

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
