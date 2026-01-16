FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any (none needed for sqlite/pure python usually, but maybe gcc for some libs)
# RUN apt-get update && apt-get install -y gcc

COPY requirements.txt /tmp/requirements-test.txt
RUN pip install --no-cache-dir -r /tmp/requirements-test.txt

COPY repository_after/requirements.txt /tmp/requirements-app.txt
RUN pip install --no-cache-dir -r /tmp/requirements-app.txt

COPY repository_after .

# Run database setup during the build process
# Explicitly create migrations for the 'api' app since the migrations folder is missing
RUN python manage.py makemigrations api
RUN python manage.py migrate
RUN python init_admin.py

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
