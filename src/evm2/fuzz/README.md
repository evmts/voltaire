# EVM2 Fuzz Testing

This directory contains fuzz testing infrastructure for the EVM2 implementation. Since Zig's built-in fuzz testing doesn't work on macOS (due to ELF vs MachO binary format issues), we use Docker to run fuzz tests in a Linux environment.

## Prerequisites

- Docker installed on your system
- Docker Compose (usually comes with Docker Desktop)

## Quick Start

### Run all EVM2 fuzz tests
```bash
cd src/evm2/fuzz
docker-compose run fuzz
```

### Run with custom duration (default is 300 seconds)
```bash
FUZZ_DURATION=600 docker-compose run fuzz-all
```

### Run continuous fuzzing
```bash
docker-compose up fuzz-continuous
```

## Available Commands

### Basic Fuzzing
```bash
# Run the EVM2 fuzz test suite
docker-compose run fuzz

# Run all project fuzz tests
docker-compose run fuzz-all

# Run a specific fuzz test
FUZZ_TEST=evm2/fuzz/evm2_fuzz.zig docker-compose run fuzz-single
```

### Advanced Usage
```bash
# Interactive shell for debugging
docker-compose run fuzz-shell

# Build the Docker image
docker-compose build fuzz

# Run with custom Zig test arguments
docker-compose run fuzz zig test evm2/fuzz/evm2_fuzz.zig --fuzz=60s
```

### Direct Docker Usage (without docker-compose)
```bash
# Build the image
docker build -t evm2-fuzz -f Dockerfile ../../..

# Run fuzz tests
docker run --rm evm2-fuzz

# Run with mounted source for live updates
docker run --rm -v $(pwd)/../../..:/app evm2-fuzz
```

## Fuzz Test Coverage

The `evm2_fuzz.zig` file contains comprehensive fuzz tests for:

1. **Frame Execution**: Random bytecode execution with various inputs
2. **Stack Operations**: Push, pop, dup, swap with edge cases
3. **Memory Operations**: Load/store with random offsets and values
4. **Bytecode Validation**: Jump destination analysis with malformed code
5. **Opcode Execution**: Individual opcode testing with fuzzed inputs
6. **Arithmetic Operations**: Overflow/underflow edge cases
7. **Control Flow**: Invalid jumps and conditional branches
8. **Gas Consumption**: Edge cases in gas calculation and consumption
9. **PUSH Operations**: All PUSH variants with truncated/invalid data

## Writing New Fuzz Tests

Add new fuzz tests to `evm2_fuzz.zig` following this pattern:

```zig
test "fuzz new feature" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < required_size) return;
    
    // Set up test environment
    const allocator = std.testing.allocator;
    
    // Use fuzz input to test edge cases
    // Always handle errors gracefully
    // The goal is to find crashes, not test correctness
}
```

## Interpreting Results

- **Success**: No crashes or panics found
- **Failure**: The fuzzer found an input that causes a crash
- **Error Details**: Failed tests will show the problematic input

When a crash is found:
1. The fuzzer will output the failing input
2. Use this input to create a regression test
3. Fix the underlying issue
4. Re-run fuzzing to verify the fix

## CI Integration

To integrate into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run EVM2 Fuzz Tests
  run: |
    cd src/evm2/fuzz
    docker-compose run fuzz-all
```

## Performance Tips

1. **CPU Usage**: Fuzzing is CPU-intensive. Allocate sufficient resources
2. **Duration**: Longer runs find more edge cases (diminishing returns after 1 hour)
3. **Parallelism**: Run multiple containers for better coverage
4. **Memory**: Monitor container memory usage, especially for memory-intensive tests

## Troubleshooting

### Container fails to build
- Ensure you're in the `src/evm2/fuzz` directory
- Check Docker daemon is running
- Verify Dockerfile paths are correct

### Fuzz tests not finding issues
- Increase duration: `FUZZ_DURATION=3600`
- Check test coverage - ensure all code paths are exercised
- Add more targeted fuzz tests for specific features

### Out of memory errors
- Limit memory in docker-compose.yml
- Reduce max allocation sizes in tests
- Use smaller fuzz input limits