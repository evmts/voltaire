# CLAUDE.md

## MISSION CRITICAL SOFTWARE

**⚠️ WARNING: Mission-critical financial infrastructure - bugs cause fund loss.**

Every line of code must be correct. Zero error tolerance.

## Core Protocols

### Security

- Sensitive data detected (API keys/passwords/tokens): abort, explain, request sanitized prompt
- Memory safety: plan ownership/deallocation for every allocation
- Every change must be tested and verified
- Use SafetyCounter for infinite loop prevention (300M instruction limit)

### Build Verification

**EVERY code change**: `zig build && zig build test-opcodes`
**Exception**: .md files only

Follow TDD

### Debugging

- Bug not obvious = improve visibility first
- Use differential tests with revm in test/differential

### Zero Tolerance

❌ Broken builds/tests
❌ Stub implementations (`error.NotImplemented`)
❌ Commented code (use Git)
❌ Test failures
❌ Invalid benchmarks
❌ `std.debug.print` in modules (use `log.zig`)
❌ `std.debug.assert` (use `tracer.assert()`)
❌ Skipping/commenting tests
❌ Any stub/fallback implementations

**STOP and ask for help rather than stubbing.**

## Coding Standards

### Principles

- Minimal else statements
- Single word variables (`n` not `number`)
- Direct imports (`address.Address` not aliases)
- Tests in source files
- Defer patterns for cleanup
- Always follow allocations with defer/errDefer
- Descriptive variables (`top`, `value1`, `operand` not `a`, `b`)
- Logging: use `log.zig` (`log.debug`, `log.warn`)
- Assertions: `tracer.assert(condition, "message")`
- Stack semantics: LIFO order (first pop = top)

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

## Testing Philosophy

- NO abstractions - copy/paste setup
- NO helpers - self-contained tests
- Test failures = fix immediately
- Evidence-based debugging only
- Zig tests output NOTHING when passing

### Debug Logging in Tests

Enable with:
```zig
test {
    std.testing.log_level = .debug;
}
```

## Project Architecture

### Guillotine EVM

High-performance EVM: correctness, minimal allocations, strong typing.

### Module System

Use `zig build test` not `zig test`. Common error: "primitives" package requires module system.

### Key Components

**Core**: evm.zig, frame.zig, stack.zig, memory.zig, dispatch.zig
**Handlers**: handlers_*.zig (arithmetic, bitwise, comparison, context, jump, keccak, log, memory, stack, storage, system)
**Synthetic**: handlers_*_synthetic.zig (fused ops)
**State**: database.zig, journal.zig, access_list.zig, memory_database.zig
**External**: precompiles.zig, call_params.zig, call_result.zig
**Bytecode**: bytecode.zig, bytecode_analyze.zig, bytecode_stats.zig
**Infrastructure**: tracer.zig, hardfork.zig, eips.zig
**Tracer**: MinimalEvm.zig (65KB standalone), pc_tracker.zig, MinimalEvm_c.zig (WASM FFI)

### Import Rules

```zig
// Good
const Evm = @import("evm");
const memory = @import("memory.zig");

// Bad - no parent imports
const Contract = @import("../frame/contract.zig");
```

## Commands

```bash
zig build test-opcodes      # Test opcodes
zig build                   # Build
zig build test-snailtracer  # Differential test
zig build wasm              # WASM build
zig build test-synthetic    # Synthetic opcodes
```

## EVM Architecture

### Design Patterns

1. Strong error types per component
2. Unsafe ops for performance (pre-validated)
3. Cache-conscious struct layout
4. Handler tables for O(1) dispatch
5. Bytecode optimization via Planner

### Key Separations

- **Frame**: Executes opcodes
- **Plan**: Manages PC/jumps
- **Host**: External operations

### Opcode Pattern

```zig
pub fn add(self: *Self, cursor: [*]const Dispatch.Item) Error!noreturn {
    self.beforeInstruction(.ADD, cursor);
    self.getTracer().assert(self.stack.size() >= 2, "ADD requires 2 stack items");
    const b = self.stack.pop_unsafe();  // Top of stack
    const a = self.stack.peek_unsafe(); // Second item
    self.stack.set_top_unsafe(a +% b);
    const op_data = dispatch.getOpData(.ADD);
    self.afterInstruction(.ADD, op_data.next_handler, op_data.next_cursor.cursor);
    return @call(Self.getTailCallModifier(), op_data.next_handler, .{ self, op_data.next_cursor.cursor });
}
```

## Opcode Navigation

Handlers organized by type:
- Arithmetic: `handlers_arithmetic.zig`
- Stack: `handlers_stack.zig`
- Memory: `handlers_memory.zig`
- System: `handlers_system.zig`

## Recent Updates

### Tracer System
- Replaced `std.debug.assert` with `tracer.assert()`
- Bytecode analysis lifecycle tracking
- Cursor-aware dispatch sync
- Fixed MinimalEvm stack semantics (LIFO)

### WASM Integration
- C FFI wrapper (MinimalEvm_c.zig)
- Opaque handle pattern
- Complete EVM lifecycle in WASM

### Dispatch Optimization
- Static jump resolution
- Dispatch cache
- Fusion detection
- 300M instruction safety limit

### Memory Management
- Checkpoint system
- Lazy word-aligned allocation
- Cached gas calculations
- Borrowed vs owned memory

## References

- Zig docs: https://ziglang.org/documentation/0.15.1/
- revm/: Reference Rust implementation
- Yellow Paper: Ethereum spec
- EIPs: Ethereum Improvement Proposals

## Collaboration

- Present proposals, wait for approval
- Plan fails: STOP, explain, wait for guidance

## GitHub Issue Management

Always disclose Claude AI assistant actions:
"*Note: This action was performed by Claude AI assistant, not @roninjin10 or @fucory*"

Required for: creating, commenting, closing, updating issues and all GitHub API operations.

## Build Commands

Usage: `zig build [steps] [options]`

Key Steps:
  test-opcodes                 Run all per-opcode differential tests
  test-snailtracer             Run snailtracer differential test
  test-synthetic               Test synthetic opcodes
  test-fixtures-differential   Run differential tests
  wasm                         Build WASM library and show bundle size
  wasm-minimal-evm             Build MinimalEvm WASM and show bundle size
  wasm-debug                   Build debug WASM for analysis
  test-fusions                 Run focused fusion tests (unit + dispatch + differential)
  devtool                      Build and run the Ethereum devtool
  python                       Build Python bindings
  swift                        Build Swift bindings
  go                           Build Go bindings
  ts                           Build TypeScript bindings

Options:
  --release[=mode]             Release mode: fast, safe, small
  -Doptimize=[enum]            Debug, ReleaseSafe, ReleaseFast, ReleaseSmall
  -Devm-hardfork=[string]      FRONTIER, HOMESTEAD, BYZANTIUM, BERLIN, LONDON, SHANGHAI, CANCUN (default: CANCUN)
  -Devm-disable-gas=[bool]     Disable gas checks (testing only)
  -Devm-enable-fusion=[bool]   Enable bytecode fusion (default: true)
  -Devm-optimize=[string]      EVM optimization strategy: fast, small, or safe (default: safe)
  -Dno_precompiles=[bool]      Disable all EVM precompiles for minimal build
