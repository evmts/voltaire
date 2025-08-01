cmake_minimum_required(VERSION 3.14)

# Use CPM for CMake dependency management
include(cmake/CPM.cmake)

CPMAddPackage("gh:ethereum/evmone@0.9.1")

project(evmone-runner LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(evmone-runner runner.cpp)
target_link_libraries(evmone-runner PRIVATE evmone)

# Add compile options for performance
target_compile_options(evmone-runner PRIVATE -O3 -march=native)