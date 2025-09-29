# Custom Zig Test Runner for Guillotine

A Vitest-like test runner for Zig that provides enhanced test output, timing metrics, and better developer experience.

## Features

- 🎨 **Colored Output**: Green for pass, red for fail, yellow for skip/leak
- ⏱️ **Timing Metrics**: Shows execution time for each test and tracks slowest tests
- 🔍 **Test Filtering**: Run specific tests matching a pattern
- 💾 **Memory Leak Detection**: Automatically detects and reports memory leaks
- 📊 **Progress Indicators**: Verbose mode or dot progress for quick feedback
- 🎯 **Fail-Fast Mode**: Stop on first failure for rapid debugging
- 🏗️ **Setup/Teardown**: Support for global setup and teardown tests

## Usage

The custom test runner is automatically integrated with the build system. Use it with any test command:

```bash
# Run unit tests
zig build test-unit

# Run integration tests
zig build test-integration

# Run with filter
zig build test-unit -Dtest-filter="stack"

# Run with verbose output
zig build test-unit -Dtest-verbose=true

# Stop on first failure
zig build test-unit -Dtest-fail-fast=true

# Disable colors (automatically disabled for non-TTY)
zig build test-unit -Dtest-no-color=true

# Quiet mode (minimal output)
zig build test-unit -Dtest-quiet=true
```

## Configuration Options

Options can be passed via build flags or environment variables:

### Build Flags
- `-Dtest-filter=<pattern>` - Filter tests by pattern
- `-Dtest-verbose=<bool>` - Enable verbose output (default: false)
- `-Dtest-fail-fast=<bool>` - Stop on first failure (default: false)
- `-Dtest-no-color=<bool>` - Disable colored output (default: false)
- `-Dtest-quiet=<bool>` - Minimal output, dots only (default: false)

### Environment Variables
- `TEST_FILTER` - Filter tests by pattern
- `TEST_VERBOSE` - Set to "1" or "true" for verbose output
- `TEST_FAIL_FAST` - Set to "1" or "true" to stop on first failure
- `TEST_NO_COLOR` - Set to "1" or "true" to disable colors
- `TEST_QUIET` - Set to "1" or "true" for minimal output
- `TEST_LOG_LEVEL` - Control EVM log level: "debug", "info", "warn", "err" (default: warn)

## Output Modes

### Default Mode
Shows dots for passing tests, detailed output for failures:
```
Running 45 tests...

.....F....S......

[FAIL] test_name (125.3 ms)
  Error: TestExpectedEqual

Test Summary
────────────
  ✓ 43 passed
  ✗ 1 failed
  ○ 1 skipped

  Total: 45 tests in 2.34 s
```

### Verbose Mode (`-Dtest-verbose=true`)
Shows each test as it runs:
```
Running 45 tests...

[RUN] arithmetic.test_add
[PASS] arithmetic.test_add (12.5 ms)
[RUN] arithmetic.test_subtract
[PASS] arithmetic.test_subtract (8.3 ms)
[RUN] memory.test_allocation
[LEAK] memory.test_allocation (45.2 ms)
```

### Quiet Mode (`-Dtest-quiet=true`)
Minimal output, just dots and final summary:
```
.....F....S......

✗ 1 test(s) failed
```

## Test Summary

After all tests run, you'll see:
- Number of passed, failed, and skipped tests
- Memory leak detection results
- Total execution time
- List of slowest tests (helps identify performance bottlenecks)

## Special Test Names

Tests with special suffixes have special behavior:

- `tests:beforeAll` - Run before all other tests (global setup)
- `tests:afterAll` - Run after all other tests (global teardown)

Example:
```zig
test "database tests:beforeAll" {
    // Setup database connection
}

test "database query test" {
    // Regular test using the database
}

test "database tests:afterAll" {
    // Clean up database connection
}
```

## Memory Leak Detection

The runner automatically uses Zig's test allocator to detect memory leaks:

```zig
test "memory test" {
    const allocator = std.testing.allocator;
    const data = try allocator.alloc(u8, 100);
    // Missing: defer allocator.free(data);
}
```

Output:
```
[LEAK] memory test (12.5 ms)
  ⚠ 1 leaked memory
```

## Controlling EVM Debug Logs

The EVM produces extensive debug logs that are now **disabled by default** for a cleaner test output. 

To enable debug logs when troubleshooting:

```bash
# Enable debug logs
GUILLOTINE_DEBUG=1 zig build test-integration

# Or export for the session
export GUILLOTINE_DEBUG=1
zig build test-integration

# Disable explicitly (default)
GUILLOTINE_DEBUG=0 zig build test-integration
```

Note: The log level in test/root.zig and src/root.zig is set to .err by default to suppress most logs. Debug logs from the EVM tracer and execution are controlled separately via the GUILLOTINE_DEBUG environment variable.

## Implementation Details

The custom test runner is implemented in `test_runner.zig` and:

1. Uses Zig's `builtin.test_functions` to enumerate all tests
2. Wraps each test execution with timing and memory tracking
3. Provides colored output using ANSI escape codes
4. Tracks test statistics and generates a summary
5. Supports environment variables for runtime configuration
6. Integrates with Zig 0.15.1's new I/O system using buffered writers

## Compatibility

- Requires Zig 0.15.1 or later
- Works with all test types: unit, integration, library
- Automatically disables colors when output is not a TTY
- Compatible with CI/CD environments

## Troubleshooting

### Tests Take Too Long
The Guillotine tests can take 2-5 minutes to run, especially the comprehensive differential tests. Be patient or use filters to run specific tests.

### Too Much Debug Output
Set `TEST_LOG_LEVEL=warn` or `TEST_LOG_LEVEL=err` to reduce EVM debug output.

### Colors Not Working
- Check if output is a TTY: `tty`
- Force colors off: `-Dtest-no-color=true`
- Some terminals may not support ANSI colors

### Memory Leak False Positives
Some tests may intentionally leak memory for testing purposes. Check the test implementation to verify if the leak is expected.