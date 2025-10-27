# CLAUDE.md

## MISSION CRITICAL - Zero Error Tolerance
Crypto infrastructure. Every line correct. No stubs/commented tests.

LLMS ARE NEVER TO COMMENT OUT TESTS

### Workflow
- Run from repo root (never `cd` except submodule debug)
- Sensitive data: abort everything immediately
- Plan ownership/deallocation
- As often as possible: `zig build && zig build test` (TDD). Always know early and often if build breaks
- Not obvious? Improve visibility, write unit tests
- Producing a failing minimal reproduction of the bug in a test we commit is the best way to fix a bug

### LLM communication protocol

- Show human your plan in most brief form possible. Always prioritize coming up with a plan before executing.
- BE EXCEEDINGLY BRIEF AND CONCISE WITH COMMUNICATION
- Sacrifice grammar for sake of brevity 
- Give 1 word answers or 1 sentence answers when appropriate
- Never add fluff or filler like "Congratulations" or "Success"
- Talk like we are just trying to get work done 
- Think air traffic controller. You should never be wasting time
- Be as efficient with communication as possible

### NEVER
❌ Broken builds/tests ❌ Stubs ❌ Commented code ❌ `std.debug.{print,assert}` in lib ❌ Skip tests ❌ Swallow errors (`catch {}`)

Crypto ops: graceful errors, never panic. Handle/propagate all errors. Ask vs stubbing.

## Coding

### Naming
**TitleCase**: types, fns returning `type` | **camelCase**: regular fns | **snake_case**: vars/consts/params/fields

### Style
Minimal else, single word vars (`n` not `number`), direct imports, tests in source, defer/errdefer cleanup, descriptive vars (`top` not `a`)

### Memory
Same scope: `defer allocator.destroy(thing)` | Transfer: `errdefer allocator.destroy(thing); return thing`

### ArrayList (0.15.1 UNMANAGED)
```zig
var list = std.ArrayList(T){}; defer list.deinit(allocator); try list.append(allocator, item);
```
❌ `.init(allocator)`, `list.deinit()`, `list.append(item)` don't exist

## Testing
Self-contained, fix failures immediately, evidence-based debug. **No output = passed**. Debug: `std.testing.log_level = .debug;`

## Architecture
Ethereum primitives + crypto. No EVM. Use `zig build test` not `zig test`.

**Primitives**: uint256, Address, Hex, RLP, ABI, Transactions, Logs
**Crypto**: Keccak-256, secp256k1, BLS12-381, BN254, KZG, SHA256, RIPEMD160, Blake2
**C libs**: blst, c-kzg-4844, ark

✅ `@import("primitives")` ❌ `@import("../primitives/address.zig")`

Typescript files and zig files are colocated as much as possible for example address.ts is in same folder as address.zig.

All code in primitives is Data based. All methods are unopinionated methods that operate on the data. The data is a typescript interface and the methods you can call on said data are namespaced on the interface.

- const bar = Bar.fromFoo.apply(foo) - this pattern is for initializing a Bar from a Foo interface
- const foo = Bar.toFoo (bar) - this pattern is opposite and turns a Bar into a foo
- Bar.

## Commands
`zig build` | `zig build test` | `-Dtest-filter=[pattern]` | `--release=fast/safe/small`

## Crypto Security
**Constant-time**: `var result: u8 = 0; for (a,b) |x,y| result |= x^y;` ❌ Early returns leak timing
**Validate**: sig (r,s,v), curve points, hash lengths. Clear memory after.
**Test**: known vectors, edge cases (zero/max), malformed inputs, cross-validate refs

## Refs
Zig: https://ziglang.org/documentation/0.15.1/ | Yellow Paper | EIPs

## Collab
Propose→wait. Blocked: stop, explain, wait.

## GitHub
"_Note: Claude AI assistant, not @roninjin10 or @fucory_" (all issue/API ops)
