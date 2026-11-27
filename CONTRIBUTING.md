# Contributing to Voltaire

Thank you for your interest in contributing to Voltaire (Ethereum primitives and cryptography library)!

We welcome contributions! This document provides guidelines and instructions for contributing to the project.

## AI-Assisted Contributions

**We welcome and encourage AI-assisted contributions.** Using Claude, Copilot, ChatGPT, or other AI tools is perfectly fine - we care about quality, not how the code was written.

**⚠️ MANDATORY REQUIREMENT: You MUST include your prompts in the PR.**

PRs without prompts will be rejected - no exceptions - unless:
- The change is trivial (typo fix, single-line change)
- You are a known trusted contributor

### Required Format

1. **Include ALL prompts** used to generate the code in your PR description
2. **Provide a human-written summary** explaining the "why"
3. **Review and test** all AI-generated code before submitting

Example PR description:

```
## AI Prompts Used

### Prompt 1:
"Add validation for RLP encoded data to prevent buffer overflows"

### Prompt 2:
"Write tests for the new validation logic covering edge cases"

## Summary
Adds input validation for RLP decoding. Fixes #123.

## Testing
- ✅ zig build test passes
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

1. **Read `CLAUDE.md` and `AGENTS.md`** - Critical development guidelines and Smithers Cloud factory workflow
2. **Explore the Factory & Wiki** - Browse `https://smithers.sh/evmts/voltaire` and `.smithers/wiki/pages/start-here.md` (Obsidian-compatible engineering wiki + Mythical History)
3. **Connect Your Agent via Cloud MCP** - Point Claude Code, Codex, Antigravity, or Cursor at `https://smithers.sh/evmts/voltaire/mcp` (already declared in `.mcp.json`) to read issues, draft TODOs, inspect flows, and review diffs
4. **Run Untrusted Checks & Lighthouse Audit** - External contributors are encouraged to run CI and `node scripts/audit-report.mjs` locally or on fork PRs; untrusted runs read the shared cache at `https://build.smithers.sh` in read-only mode so they never poison shared cache results or bypass gates

## Prerequisites

Install the following dependencies:

- **Zig 0.17.1** (CI uses 0.17.1; `build.zig.zon` requires at least 0.17.1) - https://ziglang.org/download/
- **Rust** (stable) - https://rustup.rs/ - `zig build` compiles the Rust crypto wrappers through Cargo. Add the WASM target for WASM builds: `rustup target add wasm32-unknown-unknown`
- **Node.js 22** (CI version; `@tevm/voltaire` supports Node 18+ at runtime) - https://nodejs.org/
- **pnpm 10** (pinned in the root `package.json` `packageManager` field; `corepack enable` picks it up) - https://pnpm.io/
- **Bun** (optional) - https://bun.sh/ - needed for the Bun FFI backend, the TypeScript benchmark scripts, and the `zig build` TypeScript wrapper steps
- **Go 1.22+**, **Python**, **Swift** (optional) - only for the matching `packages/voltaire-*` bindings

## Development Workflow

### 1. Setup

```bash
git clone https://github.com/evmts/voltaire.git
cd voltaire
git submodule update --init --recursive   # libwally-core, execution-apis, skills (skills uses an SSH URL)
pnpm install
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
# All Zig tests (primitives, crypto, precompiles, state-manager, blockchain).
# build.zig has no test-filter option; run the full suite.
zig build test

# @tevm/voltaire tests (vitest), optionally filtered by path
pnpm --filter @tevm/voltaire test:run
pnpm --filter @tevm/voltaire test:run src/primitives/Address

# @tevm/voltaire tests with coverage, and the WASM tests
pnpm --filter @tevm/voltaire test:coverage
pnpm --filter @tevm/voltaire test:wasm

# Every TypeScript package at once
pnpm test:run
pnpm typecheck
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

`@tevm/voltaire` lives in `packages/voltaire-ts` and has three backends:

1. **Pure TypeScript** (`packages/voltaire-ts/src/primitives/`, `src/crypto/`) - the default `@tevm/voltaire` entrypoint
   - No native dependencies
   - Works in any JavaScript environment
   - Examples: ABI encoding, numeric conversions, bytecode analysis

2. **WASM** (`src/wasm/`, `src/wasm-loader/`) - the `@tevm/voltaire/wasm` entrypoint, backed by the Zig build's `.wasm` output

3. **Native FFI** (`src/native/`, `src/native-loader/`) - the `@tevm/voltaire/native` entrypoint
   - Calls the Zig C ABI through Bun FFI (`bun-ffi.ts`) or a Node-API loader (`node-api.ts`)
   - Requires the compiled native library (`zig build build-ts-native -Dwith-c-api=true`)
   - Example: `src/crypto/Keccak256/Keccak256.native.ts`

### TypeScript Development Workflow

```bash
# From the repo root (no cd needed)
pnpm install

# Build the native library (required for FFI modules)
zig build build-ts-native -Dwith-c-api=true

# Build and stage WASM (required for WASM tests)
pnpm --filter @tevm/zig build:wasm

# Run tests, a single file, and typecheck
pnpm --filter @tevm/voltaire test:run
pnpm --filter @tevm/voltaire test:run src/crypto/Keccak256/hashString.test.ts
pnpm --filter @tevm/voltaire typecheck
```

### Adding New FFI Bindings

To expose a Zig function to the native TypeScript entrypoint:

1. **Add the C ABI export** in `packages/voltaire-zig/src/c_api.zig`, following the existing `primitives_*` functions (they return a `c_int` error code and write results through output pointers):
   ```zig
   export fn primitives_my_function(data: [*]const u8, data_len: usize, out: *PrimitivesHash) c_int {
       const input = data[0..data_len];
       out.bytes = crypto.myFunction(input);
       return PRIMITIVES_SUCCESS;
   }
   ```

2. **Regenerate the C header**: `zig build generate-header` rewrites `packages/voltaire-zig/src/primitives.h`.

3. **Declare the symbol** in `packages/voltaire-ts/src/native-loader/bun-ffi.ts` (`bunFfiSymbols`) and in the `NativeModule` interface in `src/native-loader/node-api.ts`.

4. **Write the wrapper** next to the pure-TS implementation, e.g. `src/crypto/MyFunction/MyFunction.native.ts`, using `loadNative`, `allocateOutput`, and `checkError` from `src/native-loader/index.js` (see `Keccak256.native.ts`), and export it from `src/native/index.ts`.

5. **Add tests** with known test vectors, and update the docs page under `packages/voltaire-ts/docs/`.

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
import { describe, expect, it } from 'vitest';
import { Keccak256 } from './crypto/Keccak256/index.js';
import { Hex } from './index.js';

describe('Keccak256.hashString', () => {
  it('matches the known keccak256("abc") vector', () => {
    expect(Hex.fromBytes(Keccak256.hashString('abc'))).toBe(
      '0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
    );
  });
});

// ❌ WRONG - No test vectors
it('keccak256 works', () => {
  const result = Keccak256.hashString('hello');
  expect(result.length).toBe(32);  // Too weak!
});
```

## Common Commands

Run everything from the repo root. `zig build -l` lists every Zig step. `build-ts-native`, `example-c`, `test-c-api`, `test-go`, and `build-go` only exist with `-Dwith-c-api=true`, which needs the libwally-core submodule.

### Building

```bash
zig build                                  # Zig libraries (default install step)
zig build -Doptimize=ReleaseFast           # Release build
zig build build-ts-native -Dwith-c-api=true  # Native FFI library for @tevm/voltaire/native (ReleaseFast)
zig build build-ts-wasm                    # WASM - ReleaseSmall (size-optimized)
zig build build-ts-wasm-fast               # WASM - ReleaseFast (perf-optimized)
zig build crypto-wasm                      # Individual crypto WASM modules (tree-shaking)
zig build -Dwith-c-api=true                # Also build libprimitives_c (static + shared) for C and Rust consumers
pnpm --filter @tevm/zig build:wasm         # Build all WASM and stage it in packages/voltaire-zig/wasm
pnpm --filter @tevm/voltaire build         # @tevm/voltaire dist/ + types/
```

### Testing

```bash
zig build test                                         # All Zig tests
pnpm --filter @tevm/voltaire test:run                  # @tevm/voltaire tests (vitest)
pnpm --filter @tevm/voltaire test:wasm                 # WASM tests
```

### Quality

```bash
zig fmt build.zig packages/voltaire-zig/src packages/voltaire-zig/lib packages/voltaire-zig/examples  # Format Zig
pnpm --filter @tevm/voltaire format       # Format @tevm/voltaire (biome)
pnpm -r run format:check                   # Check formatting (CI)
pnpm -r run lint:check                     # Check linting (CI)
pnpm --filter @tevm/voltaire lint          # Lint @tevm/voltaire with auto-fix
pnpm typecheck                             # Typecheck every TypeScript package
pnpm --filter @tevm/voltaire lint:package  # Validate package.json (publint)
```

Use the pnpm commands above, not the `zig build` TypeScript wrappers. `zig build format-check`, `lint-check`, `lint-deps`, `lint-pkg`, `check`, `ci`, `test-ts-native`, `test-ts-wasm`, `test-integration`, `test-security`, `build-ts`, and `build-ts-full` call root `bun run` scripts that do not exist. `zig build format`, `pre-commit`, root `pnpm format`, and `pnpm -r format` loop, because `@tevm/zig`'s `format` script calls `zig build format` again.

### Benchmarks

```bash
zig build bench -Dwith-benches=true        # zbench Zig benchmarks (*.bench.zig)
cd packages/voltaire-ts && bun run src/crypto/keccak256.bench.ts   # One colocated mitata *.bench.ts suite
```

### Examples

```bash
zig build example-keccak256
zig build example-abi
zig build example-secp256k1
zig build example-address
zig build example-eip712
zig build example-transaction
```

`zig build -l` lists the rest (`example-hex`, `example-rlp`, `example-eip4844`, `example-eip7702`, `example-abi-workflow`, `example-signature-recovery`, `example-bls`).

### Documentation

The `@tevm/voltaire` docs are a Mintlify site in `packages/voltaire-ts/docs` (`docs.json`), and C FFI recipes for other languages live in `docs/C_FFI_RECIPES.md`.

```bash
cd packages/voltaire-ts/docs && npx mint dev   # Mintlify dev server (localhost:3000)
```

### Cleaning

```bash
zig build clean              # Remove zig-out, .zig-cache, and target (keeps node_modules)
pnpm clean                   # Same, plus each package's clean script (dist/, types/, .vibe)
```

## Fuzz Testing

Fuzz tests use Zig's built-in fuzzer, which only runs on Linux (it assumes ELF binaries). On macOS, run it inside a Linux VM or container that has Zig 0.17.1, Rust stable, and the submodules checked out. There is no official `ziglang/zig` Docker image.

### Running Fuzz Tests

```bash
zig build test --fuzz                                # Run until interrupted (prints the web UI URL)
timeout 300 zig build test --fuzz                    # Stop after 5 minutes
zig build test --fuzz --webui=127.0.0.1:6971         # Live coverage web UI at http://127.0.0.1:6971
```

`zig build -h` lists the supported fuzz options.

### Fuzz Test Organization

Fuzz tests are colocated with implementations using `.fuzz.zig` extension:

```
packages/voltaire-zig/src/crypto/hash.fuzz.zig
packages/voltaire-zig/src/crypto/secp256k1.fuzz.zig
packages/voltaire-zig/src/precompiles/modexp.fuzz.zig
```

See `.claude/commands/fuzz.md` for comprehensive fuzzing documentation.

## MCP Evaluation Tests

`tests/mcp-evals` holds an Advent-of-Code style suite that tests Claude's ability to use the Voltaire MCP server for solving Ethereum challenges. No package script runs it today, and `vitest.mcp.config.ts` points at a root `vitest.setup.ts` that does not exist. See [tests/mcp-evals/README.md](./tests/mcp-evals/README.md) for the challenges.

## Areas Looking for Contributors

We especially welcome contributions in:

- **Test Coverage** - More comprehensive unit tests (both Zig and TypeScript)
- **Fuzz Testing** - Additional fuzz test coverage
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

Thank you for helping make Voltaire more robust and secure! 🙏
