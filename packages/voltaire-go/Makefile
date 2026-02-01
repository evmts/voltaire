.PHONY: build test build-native clean

VOLTAIRE_ROOT := $(shell cd ../.. && pwd)
LIB_PATH := $(VOLTAIRE_ROOT)/zig-out/native

# Build the native library first
build-native:
	cd ../.. && zig build build-ts-native

# Build Go package (requires native lib)
build: build-native
	CGO_ENABLED=1 go build ./...

# Run all tests
test: build-native
	CGO_ENABLED=1 DYLD_LIBRARY_PATH=$(LIB_PATH) LD_LIBRARY_PATH=$(LIB_PATH) go test -v ./...

# Run tests without rebuilding native lib (faster iteration)
test-quick:
	CGO_ENABLED=1 DYLD_LIBRARY_PATH=$(LIB_PATH) LD_LIBRARY_PATH=$(LIB_PATH) go test -v ./...

# Clean build artifacts
clean:
	go clean ./...

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	go vet ./...

# Run benchmarks
bench: build-native
	CGO_ENABLED=1 go test -bench=. -benchmem ./...
