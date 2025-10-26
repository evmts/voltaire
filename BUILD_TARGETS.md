# Build Targets Reference

**build.zig as an Overpowered Makefile**

All npm/bun scripts are now wrapped by `zig build` for a unified build interface.

## Quick Reference

```bash
# Most common commands
zig build                    # Build everything (Zig + C API)
zig build test               # Run Zig tests
zig build check              # Quick validation (format + lint + typecheck)
zig build ci                 # Full CI pipeline
zig build clean              # Clean build artifacts
```

---

## Complete Build Targets

### Building

| Command | Description | Wraps |
|---------|-------------|-------|
| `zig build` | Build Zig libraries + C API (default) | N/A |
| `zig build build-ts` | Compile TypeScript to JavaScript | `bun run tsc` |
| `zig build build-ts-native` | Build native FFI bindings | Direct Zig build |
| `zig build build-ts-wasm` | Build WASM bindings | Direct Zig build |
| `zig build build-ts-full` | Complete TS build (TS + native + WASM) | Multiple steps |

### Testing

| Command | Description | Wraps |
|---------|-------------|-------|
| `zig build test` | Run Zig tests | Direct Zig test |
| `zig build test-ts` | Run all TypeScript tests | `bun run test` |
| `zig build test-ts-native` | Run native FFI tests | `bun run test:native` |
| `zig build test-ts-wasm` | Run WASM tests | `bun run test:wasm` |
| `zig build test-integration` | Run integration tests | `bun run test:integration` |
| `zig build test-security` | Run security tests | `bun run test:security` |
| `zig build test-all` | Run ALL tests (Zig + TS + Go) | Multiple steps |
| `zig build test-go` | Run Go tests | `go test ./src/...` |

### Code Quality

| Command | Description | Wraps |
|---------|-------------|-------|
| `zig build format` | Format all code (Zig + TS) | `zig fmt` + `bun run format` |
| `zig build format-check` | Check formatting | `zig fmt --check` + `bun run format:check` |
| `zig build lint` | Lint TypeScript (auto-fix) | `bun run lint` |
| `zig build lint-check` | Check linting | `bun run lint:check` |
| `zig build lint-deps` | Check unused dependencies | `bun run lint:deps` |
| `zig build lint-pkg` | Validate package.json | `bun run lint:package` |
| `zig build tsc` | TypeScript type-check only | `tsc --noEmit` |

### Utilities

| Command | Description | Wraps |
|---------|-------------|-------|
| `zig build clean` | Clean build artifacts | `rm -rf zig-out dist types target` |
| `zig build clean-all` | Deep clean + node_modules | `bun run clean` |
| `zig build deps` | Install/update dependencies | `bun install` + `cargo fetch` |
| `zig build check` | Quick validation | `format-check` + `lint-check` + `tsc` |

### CI/CD

| Command | Description | Wraps |
|---------|-------------|-------|
| `zig build ci` | Complete CI pipeline | All quality checks + tests |
| `zig build pre-commit` | Fast pre-commit check | `format` + `lint` + `tsc` |

### Examples

| Command | Description |
|---------|-------------|
| `zig build example-keccak256` | Run Keccak-256 example |
| `zig build example-abi` | Run ABI encoding example |
| `zig build example-secp256k1` | Run secp256k1 example |
| `zig build example-address` | Run Address example |
| `zig build example-hex` | Run Hex utilities example |
| `zig build example-rlp` | Run RLP example |
| `zig build example-eip712` | Run EIP-712 example |
| `zig build example-transaction` | Run transaction example |
| `zig build example-eip4844` | Run EIP-4844 blob example |
| `zig build example-eip7702` | Run EIP-7702 auth example |
| `zig build example-abi-workflow` | Run ABI workflow example |
| `zig build example-signature-recovery` | Run signature recovery example |
| `zig build example-bls` | Run BLS12-381 example |
| `zig build example-c` | Run C API example |

### Benchmarking

| Command | Description |
|---------|-------------|
| `zig build -Dwith-benches` | Build + install Zig benchmarks |
| `zig build -Dwith-ts-bench bench-ts` | Run TypeScript benchmarks |

### Advanced Options

```bash
# Build options
zig build -Doptimize=ReleaseFast    # Optimized for speed
zig build -Doptimize=ReleaseSmall   # Optimized for size
zig build -Doptimize=ReleaseSafe    # Optimized with safety checks

# Target different platforms
zig build -Dtarget=x86_64-linux
zig build -Dtarget=aarch64-macos
zig build -Dtarget=wasm32-wasi

# TypeScript options
zig build -Dwith-tsc=true           # Enable TypeScript type-checking
zig build -Dwith-benches=true       # Build benchmark executables
zig build -Dwith-ts-bench=true      # Enable TS benchmark runner

# Verbose output
zig build --verbose                  # Show all commands
```

---

## Common Workflows

### Development

```bash
# Start fresh
zig build clean
zig build deps

# Build everything
zig build
zig build build-ts-full

# Run tests
zig build test-all

# Pre-commit
zig build pre-commit
```

### CI/CD

```bash
# Full CI pipeline (what GitHub Actions runs)
zig build ci
```

This single command runs:
1. Format check (Zig + TypeScript)
2. Lint check (TypeScript)
3. TypeScript compilation
4. All tests (Zig + TypeScript + Go)
5. Dependency validation
6. Package validation

### Quick Validation

```bash
# Fast check before commit
zig build check
```

This runs:
- Format check
- Lint check
- TypeScript type-check

### Clean Rebuild

```bash
# Clean everything except node_modules
zig build clean

# Deep clean including node_modules
zig build clean-all
zig build deps
```

---

## Integration with package.json

**package.json scripts still work!** They're just wrapped by build.zig:

```bash
# These are equivalent:
bun run test           ←→   zig build test-ts
bun run format         ←→   zig build format
bun run lint           ←→   zig build lint
bun run clean          ←→   zig build clean-all
```

**Recommendation:** Use `zig build` for consistency, but package.json scripts remain available for editor integrations and npm ecosystem compatibility.

---

## Benefits of Using build.zig

1. **Single Command Interface**
   - One tool to rule them all
   - No need to remember npm vs zig commands

2. **Cross-Platform**
   - Works identically on macOS, Linux, Windows
   - No bash script dependencies

3. **Dependency Management**
   - Parallel execution where possible
   - Proper build caching
   - Clear dependency graph

4. **CI/CD Ready**
   - `zig build ci` - one command for complete validation
   - Reproducible builds
   - Clear pass/fail status

5. **Developer Experience**
   - `zig build --list-steps` - see all available commands
   - `zig build --help` - comprehensive help
   - `zig build --verbose` - debug build issues

---

## List All Available Steps

```bash
zig build --list-steps
```

## Get Help

```bash
zig build --help
zig build <step> --help
```

---

*Generated for @tevm/primitives - Overpowered Makefile Edition*
