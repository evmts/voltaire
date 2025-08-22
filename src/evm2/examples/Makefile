# Makefile for EVM2 C API examples
#
# Usage:
#   make              # Build the C example
#   make clean        # Clean build artifacts
#   make run          # Build and run the example

# Detect platform
UNAME_S := $(shell uname -s)

# Library paths
LIB_DIR := ../../../.zig-cache/o
STATIC_LIB := $(shell find $(LIB_DIR) -name "libevm2_c.a" | head -1)
SHARED_LIB := $(shell find $(LIB_DIR) -name "libevm2_c.dylib" -o -name "libevm2_c.so" | head -1)

# Compiler settings
CC := gcc
CFLAGS := -Wall -Wextra -std=c99 -I..
LDFLAGS :=

# Platform-specific settings
ifeq ($(UNAME_S),Darwin)
    LDFLAGS += -Wl,-rpath,$(dir $(SHARED_LIB))
endif

# Default target
all: c_example

# Build with static library (recommended)
c_example: c_example.c
	@echo "Building C example with static library..."
	@if [ -z "$(STATIC_LIB)" ]; then \
		echo "Error: libevm2_c.a not found. Please run 'zig build evm2-c' first."; \
		exit 1; \
	fi
	$(CC) $(CFLAGS) -o $@ $< $(STATIC_LIB)

# Build with shared library (alternative)
c_example_shared: c_example.c
	@echo "Building C example with shared library..."
	@if [ -z "$(SHARED_LIB)" ]; then \
		echo "Error: libevm2_c shared library not found. Please run 'zig build evm2-c' first."; \
		exit 1; \
	fi
	$(CC) $(CFLAGS) -o $@ $< $(SHARED_LIB) $(LDFLAGS)

# Run the example
run: c_example
	@echo "Running C example..."
	./c_example

# Clean build artifacts
clean:
	rm -f c_example c_example_shared

# Show library paths (for debugging)
info:
	@echo "Static library: $(STATIC_LIB)"
	@echo "Shared library: $(SHARED_LIB)"
	@echo "Library directory: $(LIB_DIR)"

# Rebuild EVM2 C libraries
rebuild:
	cd ../../.. && zig build evm2-c

.PHONY: all clean run info rebuild