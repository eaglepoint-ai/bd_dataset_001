FROM gcc:13
WORKDIR /app
COPY . /app
RUN apt-get update && apt-get install -y make && rm -rf /var/lib/apt/lists/*
CMD ["make", "-C", "tests", "run"]
