# Stage 1: Build & Setup
FROM eclipse-temurin:11-jdk-focal AS builder
WORKDIR /app

# Install curl only once and clean up immediately
RUN apt-get update && apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

# Download dependencies in the builder stage
RUN mkdir -p lib && \
    curl -L -o lib/junit-4.13.2.jar https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.jar && \
    curl -L -o lib/hamcrest-core-1.3.jar https://repo1.maven.org/maven2/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar

# Copy source files
COPY . .

# Set classpath for compilation
ENV CLASSPATH=/app/lib/junit-4.13.2.jar:/app/lib/hamcrest-core-1.3.jar

# Create build directories
RUN mkdir -p build/before build/after tests/build

# Compile repository_before: AdjacentSum + AdjacentSumTest
RUN javac -d build/before repository_before/src/main/java/AdjacentSum.java && \
    javac -cp build/before:$CLASSPATH -d build/before repository_before/src/test/AdjacentSumTest.java

# Compile repository_after: AdjacentSum + AdjacentSumTest
RUN javac -d build/after repository_after/src/main/java/AdjacentSum.java && \
    javac -cp build/after:$CLASSPATH -d build/after repository_after/src/test/AdjacentSumTest.java

# Compile MetaTest.java with JUnit on classpath
RUN javac -cp $CLASSPATH -d tests/build tests/MetaTest.java

# Stage 2: Final Runtime
FROM eclipse-temurin:11-jdk-focal
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tests ./tests
COPY --from=builder /app/build ./build
COPY --from=builder /app/repository_before ./repository_before
COPY --from=builder /app/repository_after ./repository_after
COPY --from=builder /app/evaluation ./evaluation

# Create reports directory with open permissions for volume mounts
RUN mkdir -p /app/evaluation/reports && chmod 777 /app/evaluation/reports

# Install Python for evaluation script (evaluation.py still needs it)
RUN apt-get update && apt-get install -y python3 && \
    rm -rf /var/lib/apt/lists/*

# Create a wrapper script to run meta-test with proper classpath
# ARG will be passed at runtime to select repository
RUN echo '#!/bin/bash\n\
REPO=$1\n\
if [ "$REPO" = "repository_before" ]; then\n\
    BUILD_DIR=/app/build/before\n\
elif [ "$REPO" = "repository_after" ]; then\n\
    BUILD_DIR=/app/build/after\n\
else\n\
    echo "Usage: $0 <repository_before|repository_after>"\n\
    exit 1\n\
fi\n\
CLASSPATH=$BUILD_DIR:/app/tests/build:/app/lib/junit-4.13.2.jar:/app/lib/hamcrest-core-1.3.jar\n\
java -cp $CLASSPATH MetaTest\n\
' > /app/run-meta-test.sh && chmod +x /app/run-meta-test.sh

# Default entrypoint runs the meta-test script
ENTRYPOINT ["/app/run-meta-test.sh"]
