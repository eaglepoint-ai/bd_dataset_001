FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements.txt

# Default: run tests
CMD ["pytest", "-q", "tests"]

# To run evaluation, override the CMD:
# docker build -t async-pipeline .
# docker run --rm async-pipeline python evaluation/evaluation.py --trials 3 --items 5 --buffer 3
