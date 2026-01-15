cmake_minimum_required(VERSION 3.15)
project(FastBufferTests)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(test_fastbuffer test_fastbuffer.cpp)

# Enable warnings
target_compile_options(test_fastbuffer PRIVATE -Wall -Wextra -Wpedantic)
