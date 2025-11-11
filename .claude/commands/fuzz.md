# Fuzz Testing

Run fuzz tests using Zig's built-in fuzzer (Linux-only, requires Docker on macOS).

## Overview

Zig has integrated fuzz testing since 0.14.0 (merged July 2024). Uses LibFuzzer under the hood with in-process fuzzing and coverage-guided test generation.

**Platform Requirements:**
- **Linux**: Native support
- **macOS**: Not supported (InvalidElfMagic error - assumes ELF format, needs MachO glue code). Use Docker.
- **Windows**: Not documented

## Quick Start

### Basic Usage (Linux)

```bash
zig build test --fuzz              # Run indefinitely
zig build test --fuzz=300s         # Run for 5 minutes
zig build test --fuzz --debug-rt   # Debug mode (compiler_rt + libfuzzer)
zig build test --fuzz --port=8080  # Custom port for web UI
```

### Docker Usage (macOS/Cross-platform)

```bash
# Run fuzzing in Linux container
docker run --rm -it -v $(pwd):/workspace -w /workspace \
  ziglang/zig:0.15.1 \
  zig build test --fuzz=300s

# With web interface (map port)
docker run --rm -it -v $(pwd):/workspace -w /workspace \
  -p 6971:6971 \
  ziglang/zig:0.15.1 \
  zig build test --fuzz --port=6971
```

Access web UI: http://localhost:6971

## Writing Fuzz Tests

### Basic Pattern

```zig
test "fuzz example" {
    const input_bytes = std.testing.fuzzInput(.{});
    // Test code that processes input_bytes
    try std.testing.expect(!std.mem.eql(u8, "canyoufindme", input_bytes));
}
```

### Real-World Example: Parser/Tokenizer

```zig
test "tokenizer fuzzing" {
    const source = std.testing.fuzzInput(.{});

    var index: usize = 0;
    while (index < source.len) {
        const token, const length = lexOne(source[index..]);
        index += length;

        // Validate token properties
        try std.testing.expect(length > 0);
        try std.testing.expect(index <= source.len);
    }
}
```

### Crypto/Security Example

```zig
test "fuzz address validation" {
    const input = std.testing.fuzzInput(.{});

    // Should never panic, only return error
    const result = Address.from(input) catch |err| {
        try std.testing.expect(err == error.InvalidLength or
                               err == error.InvalidFormat);
        return;
    };

    // If valid, verify invariants
    try std.testing.expect(result.len == 20);
}
```

## Advanced Patterns

### Memory Allocation Testing

```zig
test "fuzz with allocation limits" {
    const input = std.testing.fuzzInput(.{});

    // Custom allocator that panics on oversized allocations
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    var max_size_allocator = MaxSizeAllocator{
        .parent = arena.allocator(),
        .max_size = input.len * 10, // Reasonable multiple of input
    };

    // Parse with allocation limit
    _ = parse(max_size_allocator.allocator(), input) catch return;
}
```

### Allocation Failure Testing

```zig
test "fuzz allocation failures" {
    const input = std.testing.fuzzInput(.{});

    // Generate deterministic failure index from input
    var hash = std.hash.Wyhash.init(0);
    hash.update(input);

    // First pass: count allocations
    var counting_alloc = std.testing.allocator_instance;
    const initial_count = counting_alloc.total_requested_bytes;
    _ = parse(counting_alloc.allocator(), input) catch return;
    const alloc_count = counting_alloc.total_requested_bytes - initial_count;

    // Second pass: fail at specific allocation
    const fail_index = hash.final() % (alloc_count + 1);
    var failing_alloc = std.testing.FailingAllocator.init(
        std.testing.allocator,
        .{ .fail_index = fail_index },
    );

    _ = parse(failing_alloc.allocator(), input) catch return;
}
```

### Structured Input Fuzzing

```zig
test "fuzz structured data" {
    const raw_input = std.testing.fuzzInput(.{});
    if (raw_input.len < 4) return; // Need minimum bytes

    // Extract structured fields from raw bytes
    const field_a = raw_input[0];
    const field_b = std.mem.readInt(u16, raw_input[1..3], .little);
    const field_c = raw_input[3..];

    // Test with structured data
    const result = processStructured(field_a, field_b, field_c);
    try std.testing.expect(result.isValid());
}
```

## Corpus Management

### Corpus Location

```
.zig-cache/f/{test_name}/{index}
```

- `{test_name}`: Name of the fuzz test
- `{index}`: Incrementing integer for each interesting input

### Corpus Structure

- **Coverage DB**: `.zig-cache/v/{coverage_id}` (hex-encoded 64-bit ID)
- **Input Files**: Numbered sequentially (0, 1, 2, ...)
- **Shared Input**: Single file `in` used during fuzzing

### Seeding Corpus (Planned Feature)

Not yet implemented. Track: https://github.com/ziglang/zig/issues/20814

```zig
// Future API (not available yet)
test "fuzz with seeds" {
    const input = std.testing.fuzzInput(.{
        .corpus = &[_][]const u8{
            "seed1",
            "seed2",
            &[_]u8{0xFF, 0xFE, 0xFD}, // Binary seed
        },
    });
}
```

## Web Interface

When `--fuzz` is passed, build runner starts HTTP server on port 6971 (configurable with `--port`).

### Features

- **Live Coverage Map**: Red/green dots inline with source code
- **Real-time Updates**: WebSocket for live fuzzing stats
- **PC Tracking**: Shows which program counter addresses have coverage
- **Progress Stats**: Runs, crashes, hangs, corpus size

### Access

```bash
# Default port
zig build test --fuzz
# Visit: http://localhost:6971

# Custom port
zig build test --fuzz --port=8080
# Visit: http://localhost:8080
```

## Compiler Flags

### Fuzz-Specific Flags

- `-ffuzz`: Enable fuzzing instrumentation
- `-fno-fuzz`: Disable fuzzing (default)

**Implementation**: Passes `-fsanitize=fuzzer-no-link` to Clang for C/C++ files

### Related Flags

```bash
--debug-rt              # Debug mode for compiler_rt and libfuzzer
--port <port>           # Web interface port (default: 6971)
-Dtest-filter=<name>    # Run only matching fuzz tests
```

## build.zig Integration

### Add Fuzz Test Step

```zig
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Main build
    const lib = b.addStaticLibrary(.{
        .name = "mylib",
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });

    // Tests (includes fuzz tests)
    const tests = b.addTest(.{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });

    const test_step = b.step("test", "Run tests");
    test_step.dependOn(&b.addRunArtifact(tests).step);

    // Fuzz step (Linux-only warning)
    const fuzz_step = b.step("fuzz", "Run fuzz tests (Linux only, use Docker on macOS)");
    fuzz_step.dependOn(test_step);
}
```

### Conditional Docker Execution

```zig
pub fn build(b: *std.Build) void {
    // ... standard build setup ...

    const fuzz_step = b.step("fuzz", "Run fuzz tests");

    // Detect platform
    const target_info = @import("builtin").os.tag;
    const is_linux = target_info == .linux;

    if (!is_linux) {
        // Provide Docker command for non-Linux
        const docker_cmd = b.addSystemCommand(&[_][]const u8{
            "docker", "run", "--rm", "-it",
            "-v", "$(pwd):/workspace",
            "-w", "/workspace",
            "-p", "6971:6971",
            "ziglang/zig:0.15.1",
            "zig", "build", "test", "--fuzz=300s",
        });
        fuzz_step.dependOn(&docker_cmd.step);
    } else {
        fuzz_step.dependOn(test_step);
    }
}
```

## Best Practices

### 1. Keep Tests Simple

```zig
// ✅ Good: Single entry point
test "fuzz parse" {
    const input = std.testing.fuzzInput(.{});
    _ = parse(input) catch return;
}

// ❌ Bad: Multiple code paths
test "fuzz everything" {
    const input = std.testing.fuzzInput(.{});
    if (input.len > 100) parseA(input) else parseB(input);
}
```

### 2. Validate Invariants, Not Implementation

```zig
// ✅ Good: Property-based
test "fuzz serialization roundtrip" {
    const input = std.testing.fuzzInput(.{});
    const parsed = parse(input) catch return;
    const serialized = serialize(parsed);
    const reparsed = parse(serialized) catch unreachable;
    try std.testing.expectEqual(parsed, reparsed);
}

// ❌ Bad: Specific expected output
test "fuzz parse" {
    const input = std.testing.fuzzInput(.{});
    const result = parse(input) catch return;
    try std.testing.expectEqual(42, result.value); // Too specific
}
```

### 3. Handle Expected Errors Gracefully

```zig
// ✅ Good: Differentiate expected errors
test "fuzz decode" {
    const input = std.testing.fuzzInput(.{});

    const result = decode(input) catch |err| switch (err) {
        // Expected errors - not bugs
        error.InvalidFormat,
        error.InvalidLength,
        error.InvalidChecksum => return,

        // Unexpected errors - let fuzzer catch them
        else => return err,
    };

    // Validate successful decode
    try std.testing.expect(result.isValid());
}
```

### 4. Use Deterministic Operations

```zig
// ✅ Good: No randomness/time dependencies
test "fuzz hash" {
    const input = std.testing.fuzzInput(.{});
    const hash1 = computeHash(input);
    const hash2 = computeHash(input);
    try std.testing.expectEqual(hash1, hash2);
}

// ❌ Bad: Non-deterministic
test "fuzz timestamp" {
    const input = std.testing.fuzzInput(.{});
    const result = processWithTimestamp(input, std.time.timestamp());
    // Results vary between runs
}
```

### 5. Scope errdefer Properly

```zig
// ✅ Good: errdefer scoped to ownership
test "fuzz allocations" {
    const input = std.testing.fuzzInput(.{});
    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();

    const data = try arena.allocator().dupe(u8, input);
    // No errdefer needed - arena owns cleanup

    try process(data);
}

// ❌ Bad: errdefer after ownership transfer
const value = try alloc.dupe(u8, input);
errdefer alloc.free(value); // Might double-free if list owns it
try list.append(alloc, value); // Transfers ownership
```

## Performance Tips

### 1. Use AFL_HANG_TMOUT for Timeouts

```bash
# Detect hangs after 10ms
AFL_HANG_TMOUT=10 zig build test --fuzz
```

### 2. Limit Input Size

```zig
test "fuzz bounded" {
    const input = std.testing.fuzzInput(.{});
    if (input.len > 1024) return; // Skip oversized

    try process(input);
}
```

### 3. Early Exit on Invalid Input

```zig
test "fuzz validate early" {
    const input = std.testing.fuzzInput(.{});

    // Quick checks first
    if (input.len < 4) return;
    if (input[0] != 0x89) return; // Magic byte

    // Expensive parsing only for valid-looking input
    _ = parseExpensive(input) catch return;
}
```

## Common Issues

### 1. macOS "InvalidElfMagic" Error

**Problem**: `zig build test --fuzz` fails on macOS with ELF format error.

**Solution**: Use Docker (see Docker Usage above).

**Root Cause**: Fuzzer assumes ELF debug format, macOS uses MachO. Fix requires glue code in `lib/std/debug/Info.zig`.

### 2. Out of Memory

**Problem**: Fuzzer consumes excessive memory with large inputs.

**Solution**: Limit input size or use custom allocators.

```zig
test "fuzz memory limited" {
    const input = std.testing.fuzzInput(.{});
    if (input.len > 4096) return; // Skip large inputs

    var buffer: [4096]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&buffer);
    _ = parse(fba.allocator(), input) catch return;
}
```

### 3. Timeouts

**Problem**: Fuzzer hangs on certain inputs.

**Solution**: Set timeout with `--fuzz=<duration>` or use `AFL_HANG_TMOUT`.

```bash
zig build test --fuzz=60s  # Exit after 60 seconds
```

### 4. False Positives

**Problem**: Fuzzer finds "bugs" in intentionally unsafe code.

**Solution**: Wrap unsafe operations with error handling.

```zig
test "fuzz unsafe ops" {
    const input = std.testing.fuzzInput(.{});

    // Validate before unsafe operation
    if (!isValidForUnsafeOp(input)) return;

    unsafeOperation(input);
}
```

## CI Integration

### GitHub Actions

```yaml
name: Fuzz Tests

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  fuzz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Zig
        uses: goto-bus-stop/setup-zig@v2
        with:
          version: 0.15.1

      - name: Run Fuzz Tests (5 minutes each)
        run: zig build test --fuzz=300s

      - name: Upload Crash Corpus
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: fuzz-corpus-crash
          path: .zig-cache/f/
```

### Docker CI

```dockerfile
FROM ziglang/zig:0.15.1

WORKDIR /workspace
COPY . .

# Run fuzzing for 10 minutes
RUN zig build test --fuzz=600s

# Preserve corpus
RUN cp -r .zig-cache/f /corpus-output
```

## Limitations

### Current (Zig 0.15.1)

- **No corpus seeding**: Can't provide initial test cases
- **No length range**: Can't constrain input size declaratively
- **macOS unsupported**: Requires Docker/Linux
- **Basic algorithms**: Simple mutation strategies
- **No parallel fuzzing**: Single-threaded only
- **No persistent mode**: Restarts process for each run

### Future Enhancements (Planned)

- Corpus support (Issue #20814)
- Shared memory for inputs (PR #22862)
- Length range options
- Enhanced mutation algorithms
- Parallel fuzzing
- Time limits per test
- Crash minimization
- Dictionary support

## Resources

### Documentation

- **Zig PR #20773**: Initial integration https://github.com/ziglang/zig/pull/20773
- **Zig PR #20958**: Web interface https://github.com/ziglang/zig/pull/20958
- **macOS Support**: Issue #20986 https://github.com/ziglang/zig/issues/20986
- **Corpus Support**: Issue #20814 https://github.com/ziglang/zig/issues/20814

### Blog Posts

- **Ryan Liptak - Improving Fuzz Testing**: https://www.ryanliptak.com/blog/improving-fuzz-testing-with-zig-allocators/
- **Ryan Liptak - AFL++ Integration**: https://www.ryanliptak.com/blog/fuzzing-zig-code/
- **Phoenix K - Using Zig's Fuzzer**: https://phoenixk.net/zig-fuzz
- **Garrett Squire - Start Fuzzing**: https://gsquire.github.io/static/post/start-fuzzing-with-zig/

### Examples

- **Zig Std Lib Fuzzing**: https://github.com/squeek502/zig-std-lib-fuzzing
- **Fuzzi Utility Library**: https://github.com/steelcake/fuzzi

## API Status

⚠️ **Alpha Quality**: Fuzzing API is experimental and subject to change.

Current API (`std.testing.fuzzInput`) is stable in 0.15.1 but may evolve in future releases.

## Summary

Zig's built-in fuzzer provides coverage-guided testing with minimal boilerplate. Best used for:

- **Parsers/Decoders**: Find edge cases in input processing
- **Crypto**: Validate constant-time operations, no panics
- **Serialization**: Roundtrip property testing
- **Allocators**: Memory leak/corruption detection
- **Security**: Boundary validation, overflow checks

**On macOS**: Use Docker for Linux target. On Linux: Native support works well.

**Fuzzing mindset**: Properties, not examples. Invariants, not implementations. Crashes, not coverage.
