#!/bin/bash

# Ensure bin directory exists
mkdir -p bin_tests

# Compile LogParser and Tests (linking together)
javac -d bin_tests repository_after/LogParser.java tests/ComprehensiveTests.java

# Run Tests
java -cp bin_tests ComprehensiveTests
