# Use official Zig image with Alpine Linux for minimal size
FROM ghcr.io/ziglang/zig:0.14.0-dev.2719+ae4d9cef0

# Install required dependencies
RUN apk add --no-cache \
    git \
    bash \
    build-base

# Set working directory
WORKDIR /app

# Copy the entire project (we need all modules)
COPY ../../../ .

# Change to src directory where build.zig is located
WORKDIR /app/src

# Build the project first to ensure everything compiles
RUN zig build

# Default command runs all EVM2 fuzz tests
CMD ["zig", "build", "test", "--", "--fuzz"]

# Alternative commands for specific fuzz testing:
# docker run --rm guillotine-fuzz zig build test -- --fuzz=300s
# docker run --rm guillotine-fuzz zig build test-single -- src/evm/fuzz/evm_fuzz.zig --fuzz