FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for Pygame
# RUN apt-get update && apt-get install -y \
#     libsdl2-2.0-0 \
#     && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set dummy drivers for both video and audio to prevent errors/hanging in headless
ENV SDL_VIDEODRIVER=dummy
ENV SDL_AUDIODRIVER=dummy
ENV PYTHONPATH=/app

CMD ["python3", "repository_after/game.py"]
