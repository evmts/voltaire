# CLAUDE.md - AI Assistant Context

## MISSION CRITICAL SOFTWARE

**⚠️ WARNING: This is mission-critical financial infrastructure where bugs are NOT tolerated.**

Unlike typical software where bugs are acceptable and can be patched later, ANY bug in this EVM implementation can result in **catastrophic loss of funds**. Every line of code must be correct. There is no room for error.

## Core Protocols

### Security

- If sensitive data detected (API keys/passwords/tokens): 1) Abort immediately 2) Explain concern 3) Request sanitized prompt
- Memory safety is paramount and any allocation should be taken seriously with a plan of who owns the data and who should free it.
- **ZERO BUGS TOLERANCE**: Any bug can lead to fund loss. Every change must be thoroughly tested and verified.
- **Instruction Safety**: Use SafetyCounter to prevent infinite loops (300M instruction limit)

### Mandatory Build Verification

**EVERY code change**: `zig build && zig build test-opcodes` - NO EXCEPTIONS
**Exception**: Changes to .md (markdown) files do not require running build or test commands

Follow TDD to add any features or fix any bugs

### Debugging

- If the bug is not obvious that means we don't have enough visibility. Improve visibility before attempting to fix the bug
- Utilize differential tests with revm in test/differential to help debug

### Zero Tolerance

- ❌ Broken builds/tests
- ❌ Stub implementations (`error.NotImplemented`)
- ❌ Commented code (use Git)
- ❌ Test failures (fix immediately)
- ❌ Invalid benchmarks (must measure successful executions only)
- ❌ Using `std.debug.print` in modules — always use `log.zig` instead
- ❌ Using `std.debug.assert` — use `tracer.assert()` with descriptive messages
- ❌ Skipping tests or commenting out problematic code - STOP and ask for help instead!
- ❌ Fallback/stub implementations of ANY kind - NO stub functions, NO placeholder types, NO `error.NotAvailable` returns - STOP and ask for help!

ANY STUB IMPLEMENTATION WILL RESULT IN IMMEDIATE TERMINATION! Stop and ask for help rather than stubbing.

## Coding Standards

### Principles

- Minimal else statements
- Single word variables (`n` not `number`)
- Direct imports (`address.Address` not aliases)
- Tests in source files
- Defer patterns for cleanup
- Always follow any allocation with a defer or errDefer
- Descriptive variable names (NOT `a`, `b` - use `top`, `value1`, `operand`, etc.)
- Logging: never call `std.debug.print`; import `log.zig` and use `log.debug`, `log.warn`, etc.
- Assertions: use `tracer.assert(condition, "message")` for runtime validation with context
- Stack semantics: LIFO order - first pop gets top of stack (critical for binary operations)

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

- **NO abstractions** - Copy/paste setup code
- **NO helpers** - Self-contained tests
- **Test failures = YOUR regression** - Fix immediately
- Evidence-based debugging only (no speculation)
- **IMPORTANT**: Zig tests output NOTHING when passing - DO NOT grep for test names/results in successful runs

### Debug Logging in Tests

To enable debug logging in tests, add this at the top level of your test file:
```zig
test {
    std.testing.log_level = .debug;
}
```
This enables all log.debug(), log.warn(), log.err() calls during test execution.

## Project Architecture

### Guillotine: Zig EVM Implementation

High-performance EVM focused on correctness, minimal allocations, strong typing.

### Module System

Guillotine utilizes modules which means that you must go through the build system zig build test rather than zig test.
The most common error you might see is related to "primitives" package. You must use module system build to import it.

### Key EVM Components

**Core**: evm.zig, frame.zig, stack.zig, memory.zig, dispatch.zig
**Handlers**: handlers\_\*.zig (arithmetic, bitwise, comparison, context, jump, keccak, log, memory, stack, storage, system)
**Synthetic Handlers**: handlers\_\*\_synthetic.zig (fused operations for performance)
**State**: database.zig, journal.zig, access_list.zig, memory_database.zig
**External**: precompiles.zig, call_params.zig, call_result.zig
**Bytecode**: bytecode.zig, bytecode_analyze.zig, bytecode_stats.zig
**Infrastructure**: tracer.zig, hardfork.zig, eips.zig
**Tracer Components**: MinimalEvm.zig (65KB standalone EVM), pc_tracker.zig (execution flow), MinimalEvm_c.zig (WASM FFI)

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
zig build test-opcodes      # Test opcode implementations
zig build test              # Run all tests (may hang - use test-opcodes instead)
zig build                   # Build project
zig build build-evm-runner  # Build benchmarks
zig build test-snailtracer  # Run differential test against MinimalEvm
zig build wasm              # Build WASM libraries including MinimalEvm
zig build test-synthetic    # Test synthetic (fused) opcodes
```

## EVM Architecture

### Design Patterns

1. **Strong error types** per component
2. **Unsafe ops** for performance (pre-validated)
3. **Cache-conscious** struct layout
4. **Handler tables** for O(1) dispatch
5. **Bytecode optimization** via Planner

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

## EVM Opcode Navigation

Opcodes are now organized in separate handler files:

```bash
# Arithmetic operations
grep -n "pub fn add" src/evm/handlers_arithmetic.zig
# Stack operations
grep -n "pub fn push" src/evm/handlers_stack.zig
# Memory operations
grep -n "pub fn mstore" src/evm/handlers_memory.zig
# System operations
grep -n "pub fn call" src/evm/handlers_system.zig
```

## Recent Major Updates (2024)

### Tracer System Overhaul
- Replaced `std.debug.assert` with `tracer.assert()` for better debugging
- Added comprehensive bytecode analysis lifecycle tracking
- Implemented cursor-aware dispatch synchronization
- Fixed MinimalEvm stack semantics (LIFO order critical for binary ops)

### WASM Integration
- Added C FFI wrapper for MinimalEvm (MinimalEvm_c.zig)
- Opaque handle pattern for safe cross-language memory management
- Complete EVM lifecycle support in WASM environments

### Dispatch Optimization
- Static jump resolution without binary search
- Dispatch cache for frequently executed bytecode
- Fusion detection and optimization tracking
- Instruction execution safety limits (300M instructions)

### Memory Management Improvements
- Checkpoint system for nested execution contexts
- Lazy allocation with word-aligned expansion
- Cached gas cost calculations
- Borrowed vs owned memory distinction

## References

- Zig docs: https://ziglang.org/documentation/0.15.1/
- revm/: Reference Rust implementation
- Yellow Paper: Ethereum specification
- EIPs: Ethereum Improvement Proposals

## Collaboration

- Present proposals, wait for approval
- If plan fails: STOP, explain, wait for guidance
- Interactive partnership required

## GitHub Issue Management

When interacting with GitHub issues (creating, commenting, closing):
- **ALWAYS** disclose that the action is performed by Claude AI assistant
- Include a note like: "*Note: This action was performed by Claude AI assistant, not @roninjin10 or @fucory*"
- This transparency is required for ALL GitHub interactions including:
  - Creating new issues
  - Commenting on existing issues
  - Closing issues
  - Updating issue status
  - Any other GitHub API operations

## Zig Build Command Reference

---

_Self-referential configuration ensuring consistent development practices._
Usage: /opt/homebrew/Cellar/zig/0.15.1/bin/zig build [steps] [options]

Steps:
  install (default)            Copy build artifacts to prefix path
  uninstall                    Remove build artifacts from prefix path
  run                          Run the app
  devtool                      Build and run the Ethereum devtool
  build-devtool                Build the Ethereum devtool (without running)
  macos-app                    Create macOS app bundle
  macos-dmg                    Create macOS DMG installer
  docs                         Generate and install documentation
  build-pattern-analyzer       Build JSON fixture pattern analyzer
  build-bytecode-patterns      Build bytecode pattern analyzer
  shared                       Build shared library for FFI
  static                       Build static library for FFI
  test-compiler                Run compiler tests
  test                         Run all tests
  bench-bn254                  Run zbench BN254 benchmarks
  bench-evm                    Run zbench EVM benchmarks
  test-erc20-gas               Test ERC20 deployment gas issue
  test-jump-table              Test jump table JUMPDEST recognition
  test-erc20-deployment        Test ERC20 deployment issue
  test-fixtures-differential   Run differential tests for benchmark fixtures (ERC20, snailtracer, etc.)
  test-snailtracer             Run snailtracer differential test
  test-gt-bug                  Test GT opcode bug
  test-opcodes                 Run all per-opcode differential tests
  test-opcodes-0x55            Test opcode 0x55
  test-opcodes-0x54            Test opcode 0x54
  test-opcodes-0x16            Test opcode 0x16
  test-opcodes-0x17            Test opcode 0x17
  test-opcodes-0x84            Test opcode 0x84
  test-opcodes-0x85            Test opcode 0x85
  test-opcodes-0x6d            Test opcode 0x6d
  test-opcodes-0x6e            Test opcode 0x6e
  test-opcodes-0x1c            Test opcode 0x1c
  test-opcodes-0x1b            Test opcode 0x1b
  test-opcodes-0x8a            Test opcode 0x8a
  test-opcodes-0x61            Test opcode 0x61
  test-opcodes-0x60            Test opcode 0x60
  test-opcodes-0x99            Test opcode 0x99
  test-opcodes-0x98            Test opcode 0x98
  test-opcodes-0xf6            Test opcode 0xf6
  test-opcodes-0xf7            Test opcode 0xf7
  test-opcodes-0x35            Test opcode 0x35
  test-opcodes-0x34            Test opcode 0x34
  test-opcodes-0xa1            Test opcode 0xa1
  test-opcodes-0xa0            Test opcode 0xa0
  test-opcodes-0x49            Test opcode 0x49
  test-opcodes-0x7c            Test opcode 0x7c
  test-opcodes-0x7b            Test opcode 0x7b
  test-opcodes-0x93            Test opcode 0x93
  test-opcodes-0x92            Test opcode 0x92
  test-opcodes-0x01            Test opcode 0x01
  test-opcodes-0x00            Test opcode 0x00
  test-opcodes-0x76            Test opcode 0x76
  test-opcodes-0x77            Test opcode 0x77
  test-opcodes-0x9f            Test opcode 0x9f
  test-opcodes-0x44            Test opcode 0x44
  test-opcodes-0xf1            Test opcode 0xf1
  test-opcodes-0xf0            Test opcode 0xf0
  test-opcodes-0x32            Test opcode 0x32
  test-opcodes-0x33            Test opcode 0x33
  test-opcodes-0xfd            Test opcode 0xfd
  test-opcodes-0xfe            Test opcode 0xfe
  test-opcodes-0x7d            Test opcode 0x7d
  test-opcodes-0x7e            Test opcode 0x7e
  test-opcodes-0x06            Test opcode 0x06
  test-opcodes-0x07            Test opcode 0x07
  test-opcodes-0x94            Test opcode 0x94
  test-opcodes-0x95            Test opcode 0x95
  test-opcodes-0x71            Test opcode 0x71
  test-opcodes-0x70            Test opcode 0x70
  test-opcodes-0x38            Test opcode 0x38
  test-opcodes-0x39            Test opcode 0x39
  test-opcodes-0x0b            Test opcode 0x0b
  test-opcodes-0x9a            Test opcode 0x9a
  test-opcodes-0x52            Test opcode 0x52
  test-opcodes-0x53            Test opcode 0x53
  test-opcodes-0x89            Test opcode 0x89
  test-opcodes-0x88            Test opcode 0x88
  test-opcodes-0x5f            Test opcode 0x5f
  test-opcodes-0x83            Test opcode 0x83
  test-opcodes-0x82            Test opcode 0x82
  test-opcodes-0x11            Test opcode 0x11
  test-opcodes-0x10            Test opcode 0x10
  test-opcodes-0x58            Test opcode 0x58
  test-opcodes-0x59            Test opcode 0x59
  test-opcodes-0x6c            Test opcode 0x6c
  test-opcodes-0x6b            Test opcode 0x6b
  test-opcodes-0x8f            Test opcode 0x8f
  test-opcodes-0x1d            Test opcode 0x1d
  test-opcodes-0x66            Test opcode 0x66
  test-opcodes-0x67            Test opcode 0x67
  test-opcodes-0x7a            Test opcode 0x7a
  test-opcodes-0x90            Test opcode 0x90
  test-opcodes-0x91            Test opcode 0x91
  test-opcodes-0x02            Test opcode 0x02
  test-opcodes-0x03            Test opcode 0x03
  test-opcodes-0x75            Test opcode 0x75
  test-opcodes-0x74            Test opcode 0x74
  test-opcodes-0x9e            Test opcode 0x9e
  test-opcodes-0x9d            Test opcode 0x9d
  test-opcodes-0x08            Test opcode 0x08
  test-opcodes-0x09            Test opcode 0x09
  test-opcodes-0x41            Test opcode 0x41
  test-opcodes-0x40            Test opcode 0x40
  test-opcodes-0xf5            Test opcode 0xf5
  test-opcodes-0xf4            Test opcode 0xf4
  test-opcodes-0x36            Test opcode 0x36
  test-opcodes-0x37            Test opcode 0x37
  test-opcodes-0xa2            Test opcode 0xa2
  test-opcodes-0xa3            Test opcode 0xa3
  test-opcodes-0xfa            Test opcode 0xfa
  test-opcodes-0x15            Test opcode 0x15
  test-opcodes-0x14            Test opcode 0x14
  test-opcodes-0x87            Test opcode 0x87
  test-opcodes-0x86            Test opcode 0x86
  test-opcodes-0x6f            Test opcode 0x6f
  test-opcodes-0x1a            Test opcode 0x1a
  test-opcodes-0x8b            Test opcode 0x8b
  test-opcodes-0x8c            Test opcode 0x8c
  test-opcodes-0x62            Test opcode 0x62
  test-opcodes-0x63            Test opcode 0x63
  test-opcodes-0x56            Test opcode 0x56
  test-opcodes-0x5c            Test opcode 0x5c
  test-opcodes-0x5b            Test opcode 0x5b
  test-opcodes-0x68            Test opcode 0x68
  test-opcodes-0x69            Test opcode 0x69
  test-opcodes-0x20            Test opcode 0x20
  test-opcodes-0x80            Test opcode 0x80
  test-opcodes-0x81            Test opcode 0x81
  test-opcodes-0x12            Test opcode 0x12
  test-opcodes-0x13            Test opcode 0x13
  test-opcodes-0x6a            Test opcode 0x6a
  test-opcodes-0x8e            Test opcode 0x8e
  test-opcodes-0x8d            Test opcode 0x8d
  test-opcodes-0x65            Test opcode 0x65
  test-opcodes-0x64            Test opcode 0x64
  test-opcodes-0x51            Test opcode 0x51
  test-opcodes-0x50            Test opcode 0x50
  test-opcodes-0x18            Test opcode 0x18
  test-opcodes-0x19            Test opcode 0x19
  test-opcodes-0x5d            Test opcode 0x5d
  test-opcodes-0x5e            Test opcode 0x5e
  test-opcodes-0x7f            Test opcode 0x7f
  test-opcodes-0x05            Test opcode 0x05
  test-opcodes-0x04            Test opcode 0x04
  test-opcodes-0x97            Test opcode 0x97
  test-opcodes-0x96            Test opcode 0x96
  test-opcodes-0x72            Test opcode 0x72
  test-opcodes-0x73            Test opcode 0x73
  test-opcodes-0x0a            Test opcode 0x0a
  test-opcodes-0x9b            Test opcode 0x9b
  test-opcodes-0x9c            Test opcode 0x9c
  test-opcodes-0x3d            Test opcode 0x3d
  test-opcodes-0x3e            Test opcode 0x3e
  test-opcodes-0x46            Test opcode 0x46
  test-opcodes-0xf2            Test opcode 0xf2
  test-opcodes-0xf3            Test opcode 0xf3
  test-opcodes-0xa4            Test opcode 0xa4
  test-opcodes-0xff            Test opcode 0xff
  test-opcodes-0x78            Test opcode 0x78
  test-opcodes-0x79            Test opcode 0x79
  test-erc20-mint              Run ERC20 mint differential test
  test-erc20-transfer          Run ERC20 transfer test
  test-codecopy-return         Test CODECOPY and RETURN opcodes
  test-official                Run execution-spec state fixture smoke test (non-strict)
  test-official-strict         Run execution-spec state fixture smoke test (strict)
  test-official-blockchain     Run execution-spec blockchain fixture smoke test (non-strict)
  test-official-blockchain-strict Run execution-spec blockchain fixture smoke test (strict)
  test-synthetic               Test synthetic opcodes
  wasm                         Build all WASM libraries and show bundle sizes
  wasm-primitives              Build primitives-only WASM library
  wasm-debug                   Build debug WASM for analysis
  python                       Build Python bindings
  python-dev                   Build and install Python bindings in development mode
  python-test                  Run Python binding tests
  python-examples              Run Python binding examples
  swift                        Build Swift bindings
  swift-test                   Run Swift binding tests
  swift-validate               Validate Swift package
  go                           Build Go bindings
  go-test                      Run Go binding tests
  go-vet                       Run Go code analysis
  go-fmt-check                 Check Go code formatting
  go-fmt                       Format Go code
  ts                           Build TypeScript bindings
  ts-test                      Run TypeScript binding tests
  ts-lint                      Run TypeScript linting
  ts-format-check              Check TypeScript code formatting
  ts-format                    Format TypeScript code
  ts-typecheck                 Run TypeScript type checking
  ts-dev                       Run TypeScript in development/watch mode
  ts-clean                     Clean TypeScript build artifacts
  test-fusions                 Run focused fusion tests (unit + dispatch + differential)

General Options:
  -p, --prefix [path]          Where to install files (default: zig-out)
  --prefix-lib-dir [path]      Where to install libraries
  --prefix-exe-dir [path]      Where to install executables
  --prefix-include-dir [path]  Where to install C header files

  --release[=mode]             Request release mode, optionally specifying a
                               preferred optimization mode: fast, safe, small

  -fdarling,  -fno-darling     Integration with system-installed Darling to
                               execute macOS programs on Linux hosts
                               (default: no)
  -fqemu,     -fno-qemu        Integration with system-installed QEMU to execute
                               foreign-architecture programs on Linux hosts
                               (default: no)
  --libc-runtimes [path]       Enhances QEMU integration by providing dynamic libc
                               (e.g. glibc or musl) built for multiple foreign
                               architectures, allowing execution of non-native
                               programs that link with libc.
  -frosetta,  -fno-rosetta     Rely on Rosetta to execute x86_64 programs on
                               ARM64 macOS hosts. (default: no)
  -fwasmtime, -fno-wasmtime    Integration with system-installed wasmtime to
                               execute WASI binaries. (default: no)
  -fwine,     -fno-wine        Integration with system-installed Wine to execute
                               Windows programs on Linux hosts. (default: no)

  -h, --help                   Print this help and exit
  -l, --list-steps             Print available steps
  --verbose                    Print commands before executing them
  --color [auto|off|on]        Enable or disable colored error messages
  --prominent-compile-errors   Buffer compile errors and display at end
  --summary [mode]             Control the printing of the build summary
    all                        Print the build summary in its entirety
    new                        Omit cached steps
    failures                   (Default) Only print failed steps
    none                       Do not print the build summary
  -j<N>                        Limit concurrent jobs (default is to use all CPU cores)
  --maxrss <bytes>             Limit memory usage (default is to use available memory)
  --skip-oom-steps             Instead of failing, skip steps that would exceed --maxrss
  --fetch[=mode]               Fetch dependency tree (optionally choose laziness) and exit
    needed                     (Default) Lazy dependencies are fetched as needed
    all                        Lazy dependencies are always fetched
  --watch                      Continuously rebuild when source files are modified
  --debounce <ms>              Delay before rebuilding after changed file detected
  --webui[=ip]                 Enable the web interface on the given IP address
  --fuzz                       Continuously search for unit test failures (implies '--webui')
  --time-report                Force full rebuild and provide detailed information on
                               compilation time of Zig source code (implies '--webui')
     -fincremental             Enable incremental compilation
  -fno-incremental             Disable incremental compilation

Project-Specific Options:
  -Dtarget=[string]            The CPU architecture, OS, and ABI to build for
  -Dcpu=[string]               Target CPU features to add or subtract
  -Dofmt=[string]              Target object format
  -Ddynamic-linker=[string]    Path to interpreter on the target system
  -Doptimize=[enum]            Prioritize performance, safety, or binary size
                                 Supported Values:
                                   Debug
                                   ReleaseSafe
                                   ReleaseFast
                                   ReleaseSmall
  -Dno_precompiles=[bool]      Disable all EVM precompiles for minimal build
  -Dforce_bn254=[bool]         Force BN254 even on Ubuntu
  -Denable-tracing=[bool]      Enable EVM instruction tracing (compile-time)
  -Ddisable-tailcall-dispatch=[bool] Disable tailcall-based interpreter dispatch (use switch instead)
  -Devm-optimize=[string]      EVM optimization strategy: fast, small, or safe (default: safe)
  -Devm-max-call-depth=[int]   Maximum EVM call depth (default: 1024)
  -Devm-stack-size=[int]       EVM stack size (default: 1024)
  -Devm-max-bytecode=[int]     Maximum bytecode size in bytes (default: 24576)
  -Devm-max-initcode=[int]     Maximum initcode size in bytes (default: 49152)
  -Devm-block-gas-limit=[int]  Block gas limit (default: 30000000)
  -Devm-memory-init=[int]      Initial memory capacity in bytes (default: 4096)
  -Devm-memory-limit=[int]     Memory limit in bytes (default: 16777215)
  -Devm-arena-capacity=[int]   Arena allocator capacity in bytes (default: 67108864)
  -Devm-enable-fusion=[bool]   Enable bytecode fusion optimizations (default: true)
  -Devm-hardfork=[string]      EVM hardfork: FRONTIER, HOMESTEAD, BYZANTIUM, BERLIN, LONDON, SHANGHAI, CANCUN (default: CANCUN)
  -Devm-disable-gas=[bool]     Disable gas checks for testing (WARNING: Never use in production)
  -Devm-disable-balance=[bool] Disable balance checks for testing (WARNING: Never use in production)
  -Devm-disable-fusion=[bool]  Disable bytecode fusion optimizations for debugging

System Integration Options:
  --search-prefix [path]       Add a path to look for binaries, libraries, headers
  --sysroot [path]             Set the system root directory (usually /)
  --libc [file]                Provide a file which specifies libc paths

  --system [pkgdir]            Disable package fetching; enable all integrations
  -fsys=[name]                 Enable a system integration
  -fno-sys=[name]              Disable a system integration

  Available System Integrations:                Enabled:
  (none)                                        -

Advanced Options:
  -freference-trace[=num]      How many lines of reference trace should be shown per compile error
  -fno-reference-trace         Disable reference trace
  -fallow-so-scripts           Allows .so files to be GNU ld scripts
  -fno-allow-so-scripts        (default) .so files must be ELF files
  --build-file [file]          Override path to build.zig
  --cache-dir [path]           Override path to local Zig cache directory
  --global-cache-dir [path]    Override path to global Zig cache directory
  --zig-lib-dir [arg]          Override path to Zig lib directory
  --build-runner [file]        Override path to build runner
  --seed [integer]             For shuffling dependency traversal order (default: random)
  --build-id[=style]           At a minor link-time expense, embeds a build ID in binaries
      fast                     8-byte non-cryptographic hash (COFF, ELF, WASM)
      sha1, tree               20-byte cryptographic hash (ELF, WASM)
      md5                      16-byte cryptographic hash (ELF)
      uuid                     16-byte random UUID (ELF, WASM)
      0x[hexstring]            Constant ID, maximum 32 bytes (ELF, WASM)
      none                     (default) No build ID
  --debug-log [scope]          Enable debugging the compiler
  --debug-pkg-config           Fail if unknown pkg-config flags encountered
  --debug-rt                   Debug compiler runtime libraries
  --verbose-link               Enable compiler debug output for linking
  --verbose-air                Enable compiler debug output for Zig AIR
  --verbose-llvm-ir[=file]     Enable compiler debug output for LLVM IR
  --verbose-llvm-bc=[file]     Enable compiler debug output for LLVM BC
  --verbose-cimport            Enable compiler debug output for C imports
  --verbose-cc                 Enable compiler debug output for C compilation
  --verbose-llvm-cpu-features  Enable compiler debug output for LLVM CPU features
