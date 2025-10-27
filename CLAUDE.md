# CLAUDE.md

## MISSION CRITICAL - Zero Error Tolerance
Crypto infrastructure. Every line correct. No stubs/commented tests.

### Workflow
- Run from repo root (never `cd` except submodule debug)
- Sensitive data: abort, explain
- Plan ownership/deallocation
- Every change: `zig build && zig build test` (TDD)
- Not obvious? Improve visibility, write unit tests

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
