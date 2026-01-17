FROM gcc:latest
WORKDIR /app
COPY . .
RUN chmod +x /app/evaluation/evaluation.cpp || true
# Keep container running and output report to stdout as well
CMD ["sh", "-c", "g++ -std=c++17 -o evaluation ./evaluation/evaluation.cpp && ./evaluation --output report.json && cat report.json"]
