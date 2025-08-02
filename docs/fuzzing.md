# Fuzzing Guide for Guillotine

This guide explains how to use Zig's built-in fuzzing capabilities to test the BN254 cryptographic implementation and precompiles.

## Overview

Zig (as of 0.14.0) includes integrated fuzzing support that allows you to write fuzz tests directly in your test code. The fuzzer automatically generates inputs to explore different code paths and find bugs.

## Available Fuzz Tests

### BN254 Cryptographic Operations
- **Location**: `src/crypto/bn254/fuzz.zig`
- **Tests**: Field arithmetic, point operations, pairing bilinearity
- **Run**: `zig build fuzz-bn254 --fuzz`

### ECMUL Precompile
- **Location**: `src/evm/precompiles/ecmul_fuzz.zig`
- **Tests**: Input parsing, scalar edge cases, invalid points, gas limits
- **Run**: `zig build fuzz-ecmul --fuzz`

### ECPAIRING Precompile
- **Location**: `src/evm/precompiles/ecpairing_fuzz.zig`
- **Tests**: Input validation, multiple pairs, gas consumption, field bounds
- **Run**: `zig build fuzz-ecpairing --fuzz`

## Running Fuzz Tests

### Individual Fuzz Tests
```bash
# Fuzz BN254 cryptographic operations
zig build fuzz-bn254 -- --fuzz

# Fuzz ECMUL precompile
zig build fuzz-ecmul -- --fuzz

# Fuzz ECPAIRING precompile
zig build fuzz-ecpairing -- --fuzz

# Fuzz comparison between Rust and Zig implementations
zig build fuzz-compare -- --fuzz
```

### Run All Fuzz Tests
```bash
# Run all fuzz tests
zig build fuzz -- --fuzz
```

### Run with Timeout
```bash
# Run with 60 second timeout
zig build fuzz-compare -- --fuzz -ffuzz-timeout=60

# Run with 5 minute timeout
zig build fuzz -- --fuzz -ffuzz-timeout=300
```

### Direct Test Execution
You can also run fuzz tests directly:
```bash
# Run BN254 fuzz tests directly
zig test src/crypto/bn254/fuzz.zig --fuzz

# Run with specific timeout (in seconds)
zig test src/crypto/bn254/fuzz.zig --fuzz -ffuzz-timeout=60
```

## Writing Fuzz Tests

To write a fuzz test in Zig:

1. Request fuzz input in your test:
```zig
test "fuzz example" {
    const input = std.testing.fuzzInput(.{});
    // Use input bytes for testing
}
```

2. Handle variable input sizes:
```zig
test "fuzz with minimum size" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 32) return; // Skip if input too small
    
    // Process input...
}
```

3. Parse structured data from fuzz input:
```zig
test "fuzz structured data" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;
    
    const a = std.mem.readInt(u256, input[0..32], .big);
    const b = std.mem.readInt(u256, input[32..64], .big);
    
    // Test with parsed values...
}
```

## Debugging Fuzz Test Failures

When the fuzzer finds a crash:

1. The failing input will be saved to a file
2. You can reproduce the crash with:
```bash
zig test src/crypto/bn254/fuzz.zig --test-filter "test name" < crash-input-file
```

3. Use print debugging or a debugger to investigate:
```zig
test "fuzz debug example" {
    const input = std.testing.fuzzInput(.{});
    std.debug.print("Input: {x}\n", .{std.fmt.fmtSliceHexLower(input)});
    // Your test code...
}
```

## Best Practices

1. **Start with small inputs**: Begin fuzzing with reasonable input sizes to find shallow bugs quickly
2. **Add assertions liberally**: The more assertions, the more the fuzzer can detect wrong behavior
3. **Test invariants**: Focus on properties that should always hold (e.g., commutativity, associativity)
4. **Handle edge cases**: Ensure your code handles zero values, maximum values, and invalid inputs
5. **Limit scope**: Each fuzz test should focus on a specific component or property

## Continuous Fuzzing

For long-running fuzzing sessions:

```bash
# Run with longer timeout (1 hour)
zig build fuzz-bn254 --fuzz -ffuzz-timeout=3600

# Run overnight
zig build fuzz --fuzz -ffuzz-timeout=28800  # 8 hours
```

## Integration with CI

You can add fuzzing to your CI pipeline with a reasonable timeout:

```yaml
- name: Run fuzz tests
  run: zig build fuzz --fuzz -ffuzz-timeout=300  # 5 minutes
```

## Limitations

- Windows support is not yet available for Zig's built-in fuzzer
- The fuzzing algorithm is still being improved to match AFL++ capabilities
- No corpus management or coverage visualization yet

For production fuzzing with advanced features, consider using AFL++ with Zig as described in the Zig documentation.