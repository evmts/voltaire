# Use x86 Ubuntu for maximum compatibility
FROM --platform=linux/amd64 ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    cargo \
    rustc \
    python3 \
    python3-pip \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Zig 0.15.1 for x86_64 Linux (new URL format for 0.14.1+)
RUN curl -L -o /tmp/zig.tar.xz https://ziglang.org/download/0.15.1/zig-x86_64-linux-0.15.1.tar.xz \
    && tar -xJf /tmp/zig.tar.xz -C /opt \
    && ln -s /opt/zig-x86_64-linux-0.15.1/zig /usr/local/bin/zig \
    && rm /tmp/zig.tar.xz \
    && zig version

# Set working directory
WORKDIR /app

# Copy the entire project (we need all modules)
COPY ../../../ .

# Initialize git submodules for dependencies like c-kzg-4844/blst
RUN git init && git submodule update --init --recursive lib/c-kzg-4844 || echo "Submodule init attempted"

# Test that basic fuzz test compiles without full build system
RUN zig test src/evm/fuzz/root.zig --dep evm --dep primitives -Mevm=src/evm/root.zig -Mprimitives=src/primitives/root.zig || echo "Fuzz test compilation check (expected to fail without full deps)"

# Default command: Test EVM fuzz using build system (correct approach)
CMD ["sh", "-c", "echo 'Testing EVM fuzz on x86 Linux using build system...' && zig build fuzz-evm-bytecode && echo 'Regular fuzz test passed, trying with --fuzz flag...' && timeout 30 zig build fuzz-evm-bytecode -- --fuzz || echo 'Fuzz tests completed (timeout after 30s or error)'"]