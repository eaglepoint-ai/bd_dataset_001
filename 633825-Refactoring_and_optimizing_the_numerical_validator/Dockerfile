FROM gcc:latest
WORKDIR /app
COPY . .
RUN g++ -o numerical_validator repository_before/main.cpp
CMD ["./numerical_validator"]
