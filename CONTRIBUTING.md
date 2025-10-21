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
- ❌ **NO** `std.debug.print` in library code (use `log.zig`)
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
# Run all tests
zig build test

# Verify build succeeds
zig build
```

**CRITICAL**: ALL tests must pass before submitting.

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

## Areas Looking for Contributors

We especially welcome contributions in:

- **Test Coverage** - More comprehensive unit tests
- **Documentation** - Improving code documentation
- **Performance** - Optimization opportunities (with benchmarks)
- **Bug Fixes** - Addressing any issues
- **Platform Support** - Testing on different platforms

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
