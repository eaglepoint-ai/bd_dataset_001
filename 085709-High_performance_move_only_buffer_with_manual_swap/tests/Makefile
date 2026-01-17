CXX = g++
CXXFLAGS = -std=c++20 -Wall -Wextra -Wpedantic -O2
TARGET = test_fastbuffer
SOURCE = test_fastbuffer.cpp
HEADER = ../repository_after/FastBuffer.hpp

$(TARGET): $(SOURCE) $(HEADER)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SOURCE)

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET)

.PHONY: run clean
