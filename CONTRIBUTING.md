# Contributing to Primitives

Thank you for your interest in contributing to the Ethereum Primitives library!

We welcome contributions! This document provides guidelines and instructions for contributing to the project.

## AI-Assisted Contributions

**AI-assisted contributions are welcome with proper disclosure.** If you use AI tools (like GitHub Copilot, Claude, ChatGPT, etc.) to generate code:

1. **Disclose AI usage** at the top of your PR description
2. **Include all prompts** used to generate the changes
3. **Provide a human-written description** explaining:
   - Why the change is desired
   - What problem it solves
   - Link to any related issues
4. **Review and understand** all AI-generated code before submitting
5. **Take responsibility** for the correctness and quality of the code
6. **Run all tests** to ensure nothing breaks

Example PR description:

```
## AI Disclosure
This PR contains AI-generated code using Claude.

### Prompts used:
- "Add validation for RLP encoded data to prevent buffer overflows"
- "Write tests for the new validation logic"

### Human Description:
This change adds proper input validation for RLP decoding that was missing. Fixes #123.

### Testing:
- ✅ zig build test passes
- ✅ All primitive and crypto tests pass
- ✅ Added new test cases for edge conditions
```

If your contribution is large, please open a discussion to chat about the change before doing the work.

## Critical Safety Requirements

**⚠️ WARNING: This is mission-critical cryptographic infrastructure.** ANY bug can compromise security or cause fund loss. Please follow these requirements:

### Zero Tolerance Policy

- ❌ **NO** broken builds or failing tests
- ❌ **NO** stub implementations (`error.NotImplemented`)
- ❌ **NO** commented-out code (use Git for history)
- ❌ **NO** test failures - all tests must pass
- ❌ **NO** swallowing errors with empty catch blocks
- ❌ **NO** `std.debug.print` in library code (this is a library, not an app)
- ❌ **NO** `std.debug.assert` (use proper error handling)

**If in doubt, STOP and ask for guidance rather than stubbing or commenting out code.**

## Before You Start

1. **Read CLAUDE.md** - Contains critical development guidelines
2. **Understand the architecture** - Read src/README.md
3. **Check existing issues** - Your change may already be discussed
4. **Run tests** - Ensure everything works before making changes

## Development Workflow

### 1. Setup

```bash
git clone <repository-url>
cd primitives
git submodule update --init --recursive
zig build
zig build test
```

### 2. Make Changes

- Follow the coding standards in CLAUDE.md
- Write tests for all new functionality
- Ensure memory safety (explicit ownership, defer/errDefer)
- Use meaningful variable names
- Add inline documentation for complex logic

### 3. Test Thoroughly

```bash
# Run Zig tests
zig build test

# Verify Zig build succeeds
zig build

# If modifying TypeScript code, test that too
cd src
bun test
cd ..
```

**CRITICAL**: ALL tests must pass before submitting (both Zig and TypeScript if applicable).

### 4. Submit Pull Request

- Write a clear PR description
- Reference related issues
- Disclose AI usage if applicable
- Ensure CI passes

## Coding Standards

### Memory Management

```zig
// ✅ CORRECT - Explicit cleanup
const thing = try allocator.create(Thing);
defer allocator.destroy(thing);

// ❌ WRONG - Memory leak
const thing = try allocator.create(Thing);
// Missing defer!
```

### Error Handling

```zig
// ✅ CORRECT - Explicit error propagation
pub fn doSomething() !void {
    const result = try riskyOperation();
    if (result == null) return error.InvalidResult;
}

// ❌ WRONG - Swallowing errors
pub fn doSomething() void {
    const result = riskyOperation() catch return;  // NEVER DO THIS
}
```

### Testing

```zig
// ✅ CORRECT - Self-contained test
test "uint256 addition overflow" {
    const a = primitives.uint256.max();
    const b = primitives.uint256.fromInt(1);
    const result = a.addWithOverflow(b);
    try std.testing.expect(result.overflow);
}

// ❌ WRONG - No test for new functionality
pub fn newFeature() void {
    // ... implementation without tests
}
```

## Cryptographic Code

**Extra scrutiny required for crypto changes:**

1. **Constant-time operations** - Prevent timing attacks
2. **Input validation** - Check all inputs before processing
3. **Test vectors** - Use known test vectors from specifications
4. **Reference implementations** - Cross-validate against known-good implementations
5. **Security review** - Tag maintainers for review

Example:

```zig
// ✅ CORRECT - Constant time comparison
pub fn constantTimeCompare(a: []const u8, b: []const u8) bool {
    if (a.len != b.len) return false;
    var result: u8 = 0;
    for (a, b) |byte_a, byte_b| {
        result |= byte_a ^ byte_b;
    }
    return result == 0;
}

// ❌ WRONG - Leaks timing information
pub fn timingUnsafeCompare(a: []const u8, b: []const u8) bool {
    for (a, b) |byte_a, byte_b| {
        if (byte_a != byte_b) return false;  // Early exit leaks info!
    }
    return true;
}
```

## TypeScript/JavaScript Contributions

This library provides TypeScript bindings for JavaScript environments. When contributing TypeScript code:

### Pure TypeScript vs FFI

The TypeScript layer has two types of implementations:

1. **Pure TypeScript** (`src/primitives/`, `ts/src/primitives/`)
   - No native dependencies
   - Works in any JavaScript environment
   - Examples: ABI encoding, numeric conversions, bytecode analysis

2. **FFI Wrappers** (`src/crypto/`)
   - Uses Bun FFI to call native Zig library
   - Requires compiled native library
   - Examples: Keccak-256, EIP-191

### TypeScript Development Workflow

```bash
# Build Zig library first (required for FFI modules)
zig build

# Install TypeScript dependencies
cd src
bun install

# Run TypeScript tests
bun test

# Run specific test file
bun test crypto/keccak.test.ts
```

### Adding New FFI Bindings

To add a new FFI wrapper for a Zig crypto function:

1. **Add C API binding** in `src/c_api.zig`:
   ```zig
   export fn primitives_my_function(input: [*]const u8, len: usize, output: [*]u8) callconv(.C) void {
       const data = input[0..len];
       const result = crypto.myFunction(data);
       @memcpy(output, &result);
   }
   ```

2. **Create TypeScript wrapper** in `src/crypto/my-function.ts`:
   ```typescript
   import { getCApiPath } from './utils';
   import { dlopen, FFIType } from 'bun:ffi';

   const lib = dlopen(getCApiPath(), {
     primitives_my_function: {
       args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
       returns: FFIType.void
     }
   });

   export function myFunction(data: Uint8Array): Uint8Array {
     const output = new Uint8Array(32);
     lib.symbols.primitives_my_function(data, data.length, output);
     return output;
   }
   ```

3. **Add tests** in `src/crypto/my-function.test.ts` using known test vectors

4. **Update documentation** in [TYPESCRIPT_API.md](./docs/TYPESCRIPT_API.md) and [README.md](./README.md)

### TypeScript Code Standards

- Use TypeScript strict mode (enabled in tsconfig.json)
- Prefer `Uint8Array` for byte data
- Use `bigint` for large integers
- Write comprehensive tests with known test vectors
- Document all public APIs with JSDoc comments
- Handle errors gracefully (throw descriptive errors)

### Testing TypeScript Code

```typescript
// ✅ CORRECT - Use known test vectors
import { describe, test, expect } from 'bun:test';

describe('keccak256', () => {
  test('matches NIST test vector', () => {
    const input = 'abc';
    const expected = new Uint8Array([/* known hash */]);
    const result = keccak256(input);
    expect(result).toEqual(expected);
  });
});

// ❌ WRONG - No test vectors
test('keccak256 works', () => {
  const result = keccak256('hello');
  expect(result.length).toBe(32);  // Too weak!
});
```

## Areas Looking for Contributors

We especially welcome contributions in:

- **Test Coverage** - More comprehensive unit tests (both Zig and TypeScript)
- **Documentation** - Improving code documentation
- **Performance** - Optimization opportunities (with benchmarks)
- **Bug Fixes** - Addressing any issues
- **Platform Support** - Testing on different platforms
- **TypeScript FFI Bindings** - Adding C API wrappers for remaining crypto functions (EIP-712, secp256k1, hash algorithms)
- **TypeScript Primitives** - Pure TypeScript implementations of additional Ethereum primitives

## Questions?

- Open a discussion for architecture questions
- Comment on relevant issues for feature discussions
- Tag maintainers for security-sensitive changes

## Code Review Process

1. **Automated checks** - CI must pass
2. **Manual review** - Maintainer review required
3. **Testing verification** - Confirm tests are comprehensive
4. **Security review** - Extra scrutiny for crypto code
5. **Merge** - Squash and merge with clear commit message

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for helping make Ethereum primitives more robust and secure! 🙏
