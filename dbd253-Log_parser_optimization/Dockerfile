FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app
COPY . /app

# Compile classes into bin directory
# We compile repository_after/LogParser.java so ComprehensiveTests can run directly
RUN mkdir -p bin && javac -d bin \
    repository_after/LogParser.java \
    tests/ComprehensiveTests.java \
    evaluation/Evaluation.java

CMD ["java", "-cp", "bin", "com.logparser.Evaluation"]
