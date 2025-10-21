# CLAUDE.md

## MISSION CRITICAL SOFTWARE

**⚠️ WARNING: Mission-critical cryptographic infrastructure - bugs compromise security.**

Every line of code must be correct. Zero error tolerance.

## Core Protocols

### Working Directory

**ALWAYS run commands from the repository root directory.** Never use `cd` except when debugging a submodule. All commands, builds, and tests are designed to run from root.

### Security

- Sensitive data detected (API keys/passwords/tokens): abort, explain, request sanitized prompt
- Memory safety: plan ownership/deallocation for every allocation
- Every change must be tested and verified
- **CRITICAL: Cryptographic operations must NEVER crash** - All crypto functions must return errors gracefully, never panic

### Build Verification

**EVERY code change**: `zig build && zig build test`
**Exception**: .md files only

Follow TDD

### Debugging

- Bug not obvious = improve visibility first
- Write targeted unit tests to isolate issues

### Zero Tolerance

❌ Broken builds/tests
❌ Stub implementations (`error.NotImplemented`)
❌ Commented code (use Git)
❌ Test failures
❌ `std.debug.print` in library code
❌ `std.debug.assert` (use proper error handling)
❌ Skipping/commenting tests
❌ Any stub/fallback implementations
❌ **Swallowing errors with `catch` (e.g., `catch {}`, `catch &.{}`, `catch null`)**

**STOP and ask for help rather than stubbing.**

**WHY PLACEHOLDERS ARE BANNED**: Placeholder implementations create ambiguity - the human cannot tell if "Coming soon!" or simplified output means:
1. The AI couldn't solve it and gave up
2. The AI is planning to implement it later
3. The feature genuinely isn't ready yet
4. There's a technical blocker

This uncertainty wastes debugging time and erodes trust. Either implement it fully, explain why it can't be done, or ask for help. Never leave placeholders that pretend to work.

**NEVER swallow errors! Every error must be explicitly handled or propagated. Using `catch` to ignore errors can cause silent failures.**

## Coding Standards

### Principles

- Minimal else statements
- Single word variables (`n` not `number`)
- Direct imports (`address.Address` not aliases)
- Tests in source files
- Defer patterns for cleanup
- Always follow allocations with defer/errDefer
- Descriptive variables (`top`, `value1`, `operand` not `a`, `b`)
- No logging in library code (this is a library, not an application)

### Memory Management

```zig
// Pattern 1: Same scope
const thing = try allocator.create(Thing);
defer allocator.destroy(thing);

// Pattern 2: Ownership transfer
const thing = try allocator.create(Thing);
errdefer allocator.destroy(thing);
thing.* = try Thing.init(allocator);
return thing;
```

### ArrayList API (Zig 0.15.1)

**CRITICAL**: In Zig 0.15.1, `std.ArrayList(T)` returns an UNMANAGED type that requires allocator for all operations!

```zig
// CORRECT: std.ArrayList is UNMANAGED (no internal allocator)
var list = std.ArrayList(T){};  // Default initialization
// OR
const list = std.ArrayList(T).empty;  // Empty constant
// OR with capacity
var list = try std.ArrayList(T).initCapacity(allocator, 100);

// All operations REQUIRE allocator:
defer list.deinit(allocator);  // ✅ allocator REQUIRED
try list.append(allocator, item);  // ✅ allocator REQUIRED
try list.ensureCapacity(allocator, 100);  // ✅ allocator REQUIRED
_ = list.pop();  // No allocator needed for pop

// Direct access (no allocator needed):
list.items[0] = value;
list.items.len = 0;

// WRONG - This does NOT work in Zig 0.15.1:
var list = std.ArrayList(T).init(allocator);  // ❌ No init() method!
list.deinit();  // ❌ Missing required allocator
try list.append(item);  // ❌ Missing required allocator

// For managed ArrayList with internal allocator, use array_list module directly:
const array_list = @import("std").array_list;
var list = array_list.AlignedManaged(T, null).init(allocator);
defer list.deinit();  // No allocator needed for managed version
```

## Testing Philosophy

- NO abstractions - copy/paste setup
- NO helpers - self-contained tests
- Test failures = fix immediately
- Evidence-based debugging only
- **CRITICAL**: Zig tests output NOTHING when passing (no output = success)
- If tests produce no output, they PASSED successfully
- Only failed tests produce output

### Debug Logging in Tests

Enable with:
```zig
test {
    std.testing.log_level = .debug;
}
```

**IMPORTANT**: Even with `std.testing.log_level = .debug`, if the test passes, you will see NO OUTPUT. This is normal Zig behavior. No output means the test passed.

## Project Architecture

### Primitives Library

This repository contains ONLY Ethereum primitives and cryptographic operations. No EVM execution engine.

### Module System

Use `zig build test` not `zig test`. Common error: "primitives" package requires module system.

### Key Components

**Primitives**: uint256, Address, Hex, RLP, ABI, Transactions, Logs
**Crypto**: Keccak-256, secp256k1, BLS12-381, BN254, KZG, SHA256, RIPEMD160, Blake2
**External C Libraries**: blst (BLS12-381), c-kzg-4844 (KZG), ark (BN254)

### Import Rules

```zig
// Good
const primitives = @import("primitives");
const crypto = @import("crypto");

// Bad - no parent imports
const Address = @import("../primitives/address.zig");
```

## Commands

### Basic Commands
- `zig build` - Build the project
- `zig build test` - Run all tests (primitives + crypto)

### Test Organization

- Tests are embedded in source files
- All module tests run via `zig build test`
- Each module (primitives, crypto) has comprehensive unit tests

## Cryptographic Security

### CRITICAL: Constant-Time Operations

All cryptographic operations must be constant-time to prevent timing attacks:

```zig
// ✅ CORRECT - Constant time comparison
pub fn constant_time_compare(a: []const u8, b: []const u8) bool {
    if (a.len != b.len) return false;
    var result: u8 = 0;
    for (a, b) |byte_a, byte_b| {
        result |= byte_a ^ byte_b;
    }
    return result == 0;
}

// ❌ WRONG - Early return leaks timing information
pub fn timing_unsafe_compare(a: []const u8, b: []const u8) bool {
    for (a, b) |byte_a, byte_b| {
        if (byte_a != byte_b) return false;  // Leaks position of mismatch
    }
    return true;
}
```

### Input Validation

All crypto functions must validate inputs:
- Signature components (r, s, v) must be validated
- Elliptic curve points must be on the curve
- Hash inputs must not exceed maximum lengths
- Memory must be securely cleared after use

### Testing Requirements

Cryptographic code requires:
- Known test vectors from specifications
- Edge case testing (zero values, maximum values)
- Malformed input testing
- Cross-validation against reference implementations

## References

- Zig docs: https://ziglang.org/documentation/0.15.1/
- Yellow Paper: Ethereum specification
- EIPs: Ethereum Improvement Proposals

## Collaboration

- Present proposals, wait for approval
- Plan fails: STOP, explain, wait for guidance

## GitHub Issue Management

Always disclose Claude AI assistant actions:
"*Note: This action was performed by Claude AI assistant, not @roninjin10 or @fucory*"

Required for: creating, commenting, closing, updating issues and all GitHub API operations.

## Build System

Usage: `zig build [options]`

Key Steps:
  test                         Run all tests (primitives + crypto)

Options:
  --release[=mode]             Release mode: fast, safe, small
  -Doptimize=[enum]            Debug, ReleaseSafe, ReleaseFast, ReleaseSmall
  -Dtest-filter=[string]       Filter tests by pattern
