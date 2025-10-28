### Communication

- Show human plan in most brief form. Prioritize plan before executing.
- BRIEF CONCISE COMMUNICATION
- Sacrifice grammar for sake of brevity
- 1 sentence answers when appropriate
- No fluff like "Congratulations" or "Success"
- Talk like we are just trying to get work done
- Efficient like air traffic controller

## MISSION CRITICAL

Every line correct. No stubs/commented tests.

LLMS ARE NEVER TO COMMENT OUT OR DISABLE TESTS

### Workflow

- Run from repo root (never `cd` unless user requests it)
- Sensitive data: abort everything immediately
- Plan ownership/deallocation when writing zig
- Think hard about typesafety when writing typescript
- As often as possible: `zig build && zig build test` (TDD). Always know early and often if build breaks
- Not obvious? Improve visibility, write unit tests
- Producing a failing minimal reproduction of the bug in a test we commit is the best way to fix a bug

## Coding

### Style

- Write simple imperative code.
- Minimal else, single word vars (`n` not `number`), direct imports, tests in source, defer/errdefer cleanup, descriptive vars (`top` not `a`)
- Never abstract code into a function unless it's reused
- Long function bodies of easy to read imperative code is good
- Prioritize colocating related code and docs even when written in different languages

#### TypeScript

- All types are treated as Branded types
- Type.fromFoo Type.toFoo naming convention with a loose Type.from method
- Use of namespaces for type with tree shakable methods using type as this arg
- Code methods organized by what type of data it operates on

#### Zig

- For primitive methods we should be returning most memory to user and not allocating otherwise
- Minimize allocation when possible
- Use a subagent to search homebrew for docs when issues using new zig 15.1 api

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
