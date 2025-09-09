.PHONY: install build clean test

# Build the Zig library and prepare Go module
install:
	@echo "Building Guillotine Zig library..."
	cd ../.. && zig build -Doptimize=ReleaseFast
	@echo "Downloading Go dependencies..."
	go mod download
	@echo "Installation complete!"

# Just build the Zig library
build:
	cd ../.. && zig build -Doptimize=ReleaseFast

# Run tests (requires built library)
test: build
	go test -v ./...

# Clean build artifacts
clean:
	cd ../.. && rm -rf zig-out zig-cache
	go clean -cache