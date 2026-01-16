#!/bin/bash

set -e

COMMAND=${COMMAND:-evaluation}
mkdir -p /tmp/classes

if [ "$COMMAND" = "test-before" ]; then
  mkdir -p /tmp/before_wrapper
  cat > /tmp/before_wrapper/FetchOptimization.java << 'EOF'
import java.util.ArrayList;
import java.util.List;
public class FetchOptimization {
    public static List<Object> fetchItems(List<Object> items) {
        List<Object> result = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            if (!result.contains(items.get(i))) {
                result.add(items.get(i));
            }
        }
        return result;
    }
    public static List<Object> fetchItems(List<Object> items, Integer page, Integer pageSize) {
        throw new UnsupportedOperationException("Pagination not supported in repository_before");
    }
}
EOF
  javac -cp .:junit-platform-console-standalone-1.9.3.jar \
        /tmp/before_wrapper/FetchOptimization.java \
        tests/FetchOptimizationTest.java \
        -d /tmp/classes
  java -cp /tmp/classes:junit-platform-console-standalone-1.9.3.jar \
       org.junit.platform.console.ConsoleLauncher \
       --class-path=/tmp/classes \
       --select-class=FetchOptimizationTest

elif [ "$COMMAND" = "test-after" ]; then
  javac -cp .:junit-platform-console-standalone-1.9.3.jar \
        repository_after/fetchOptimization.java \
        tests/FetchOptimizationTest.java \
        -d /tmp/classes
  java -cp /tmp/classes:junit-platform-console-standalone-1.9.3.jar \
       org.junit.platform.console.ConsoleLauncher \
       --class-path=/tmp/classes \
       --select-class=FetchOptimizationTest

else
  javac -cp .:junit-platform-console-standalone-1.9.3.jar \
        evaluation/Evaluation.java \
        -d /tmp/classes
  java -cp /tmp/classes:junit-platform-console-standalone-1.9.3.jar \
       Evaluation
fi
