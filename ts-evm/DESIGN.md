# Guillotine TS EVM (Prototype) — Design

Mission: build a fast, tailcall-style TypeScript EVM prototype for rapid prototyping that mirrors the Zig architecture one-for-one where practical, using Bun and TDD.

## Goals

- Architectural parity with Zig EVM: same modules, naming, and data separation.
- Tailcall execution model with dispatch preprocessor (trampoline in TS).
- Stack-only milestone: implement the stack and stack-dependent opcodes first.
- Errors-as-values: strongly-typed error classes returned in unions.
- TDD with Bun: tests first; clean separation of data and functions.

## Non-Goals (Milestone 1)

- Memory, storage, state database, host system calls, precompiles.
- Gas accounting, access lists, hardfork options (beyond minimal toggles).
- Synthetic/fused opcodes (will come after baseline handlers are green).

## High-Level Parity Mapping (Zig → TypeScript)

- `src/evm.zig` → `src/evm.ts`
- `src/frame/frame.zig` → `src/frame/frame.ts`
- `src/stack/stack.zig` → `src/stack/stack.ts`
- `src/instructions/handlers_*.zig` → `src/instructions/handlers_*.ts`
- `src/preprocessor/dispatch.zig` → `src/preprocessor/dispatch.ts`
- `src/bytecode/bytecode.zig` → `src/bytecode/bytecode.ts`
- `src/opcodes/opcode_synthetic.zig` → `src/opcodes/opcode_synthetic.ts` (later)
- `src/frame/call_result.zig` → `src/frame/call_result.ts`
- `apps/cli/internal/app/call_parameters.go` → `src/call_params.ts`

Project root for TS EVM: `ts-evm/` (isolated from Zig build). All TS code lives under `ts-evm/src/`.

## Execution Model (Tailcall via Trampoline)

Zig uses true tailcalls between opcode handlers. TS engines don’t guarantee TCO; we emulate with an explicit trampoline while keeping handlers and dispatch identical in shape.

- Handler signature:
  ```ts
  type Handler = (f: Frame, cursor: number) => Tail;
  type Tail = Next | ReturnData | ErrorUnion;
  type Next = { next: Handler; cursor: number };
  ```
- Trampoline:
  ```ts
  function interpret(f: Frame, entry: { handler: Handler; cursor: number }): ReturnData | ErrorUnion {
    let h = entry.handler;
    let c = entry.cursor;
    let steps = f.safetyLimit; // SafetyCounter (default: 300_000_000)
    while (true) {
      if (--steps < 0) return new SafetyCounterExceededError();
      const r = h(f, c);
      if ((r as any).next) { ({ next: h, cursor: c } = r as any); continue; }
      return r as ReturnData | ErrorUnion;
    }
  }
  ```
- Each handler must always either tailcall to next (by returning `{ next, cursor }`) or return a terminal value (`ReturnData`) or an error (`ErrorUnion`).

## Data Separation & Factories (Zig-style)

We keep data and functions separate (tree-shakeable), mirroring Zig’s struct + free-function style.

- The interface represents data only; no methods on the data objects.
- Provide free functions operating on interfaces, always taking the instance as the first parameter.
- Provide a `createFoo()` factory that constructs the data object (maps the Zig `init`).

Example pattern:
```ts
export interface Stack { items: Word[]; limit: number; }
export function createStack(limit: number = 1024): Stack { return { items: [], limit }; }
export function stackPush(s: Stack, v: Word): void | StackOverflowError { /* ... */ }
export function stackPop(s: Stack): Word | StackUnderflowError { /* ... */ }
```

## Types, Word Arithmetic, and Limits

- `Word` is `bigint` with 256-bit modular arithmetic: `MASK_256 = (1n << 256n) - 1n`.
- All arithmetic ops wrap modulo 2^256 (for signed ops, convert via two’s complement).
- Stack limit default: 1024 items per EVM spec.
- Shift semantics: shift count ≥ 256 yields 0 (for logical shifts).
- Byte-order: big-endian for serialization of `Word` to bytes.

Helpers (examples):
```ts
export type Word = bigint;
export const MASK_256 = (1n << 256n) - 1n;
export const U256 = 256n;
export function u256(v: bigint): Word { return v & MASK_256; }
export function toSigned(w: Word): bigint { return (w & (1n << 255n)) !== 0n ? -((~w & MASK_256) + 1n) : w; }
export function fromSigned(s: bigint): Word { return u256(s < 0n ? (~(-s) + 1n) : s); }
```

## Error Model (Errors as Values)

- Errors are classes extending `Error` with a `_tag: string` discriminant.
- All public APIs return a union: `ReturnType | ErrorUnion`.
- Stack layer errors (Milestone 1): `StackOverflowError`, `StackUnderflowError`, `InvalidOpcodeError`, `SafetyCounterExceededError`.

Example:
```ts
export class StackOverflowError extends Error { readonly _tag = 'StackOverflowError'; constructor() { super('stack overflow'); this.name = this._tag; } }
export type StackError = StackOverflowError | StackUnderflowError;
export type ErrorUnion = StackError | InvalidOpcodeError | SafetyCounterExceededError;
```

## Module Layout (ts-evm)

- `src/evm.ts`: EVM root, `call(params)` entry.
- `src/frame/frame.ts`: Frame data (`evm`, `stack`, `cursor`, `safetyLimit`).
- `src/stack/stack.ts`: Stack interface, factory, and functions.
- `src/instructions/handlers_arithmetic.ts`: ADD, MUL, SUB, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD.
- `src/instructions/handlers_bitwise.ts`: AND, OR, XOR, NOT, BYTE, SHL, SHR, SAR.
- `src/instructions/handlers_comparison.ts`: LT, GT, SLT, SGT, EQ, ISZERO.
- `src/instructions/handlers_stack.ts`: PUSH1..PUSH32, DUP1..DUP16, SWAP1..SWAP16, POP.
- `src/preprocessor/dispatch.ts`: Preprocess bytecode to a schedule of handlers + inline data.
- `src/bytecode/bytecode.ts`: Bytecode reader utilities and constants.
- `src/opcodes/opcode_synthetic.ts`: Placeholder (future fusions; not in M1).
- `src/call_params.ts`: Minimal call parameters (bytecode, optional gas/safety).
- `src/frame/call_result.ts`: `ReturnData` type, plus helpers for encoding stack word to bytes.
- `src/log.ts` (optional): thin logging wrapper.

Testing structure (Bun):
- `test/stack.test.ts`
- `test/arithmetic.test.ts`
- `test/bitwise.test.ts`
- `test/comparison.test.ts`
- `test/stack_ops.test.ts` (PUSH/DUP/SWAP/POP)
- `test/e2e_return.test.ts` (PUSH1 1, PUSH1 2, ADD, RETURN → 0x03)

## Dispatch & Schedule (Milestone 1 scope)

We will implement a minimal dispatch compiler that supports:
- PUSH1..PUSH32 (embed inline constants into schedule)
- Arithmetic/bitwise/comparison opcodes listed above
- Stack utility opcodes (POP/DUP/SWAP)
- RETURN (simplified): returns the top-of-stack word as bytes

Schedule shape:
```ts
export type Item = { kind: 'meta' | 'handler' | 'inline'; handler?: Handler; data?: any };
export interface Schedule { items: Item[]; entry: { handler: Handler; cursor: number }; }
```

The compiler emits:
- `meta` items for block gas (reserved for parity; may be no-op in M1)
- `handler` items for each opcode’s function pointer
- `inline` items immediately following handlers that need immediate data (e.g., PUSH)

Handlers read inline data relative to `cursor` to avoid reading raw bytecode at runtime (parity with Zig’s preprocessed model).

## EVM.call() (Milestone 1 behavior)

- Input: `CallParams` with `bytecode: Uint8Array` and optional `safetyLimit`.
- Preprocess: `dispatch.compile(bytecode)` → `Schedule`.
- Execute: `interpret(frame, schedule.entry)`.
- Return: `ReturnData` or `ErrorUnion`.

`ReturnData` (M1) will return the top-of-stack as 32-byte big-endian bytes:
```ts
export interface ReturnData { data: Uint8Array; }
// Helper to encode a Word to 32 bytes
function wordToBytes32(w: Word): Uint8Array { /* big-endian */ }
```

Note: This simplifies EVM RETURN (which normally returns a memory slice). Memory semantics will be added later.

## Stack Semantics & API (Detailed)

- LIFO; first pop = top of stack.
- Capacity: 1024.
- Operations:
  - `stackSize(s): number`
  - `stackPush(s, v): void | StackOverflowError`
  - `stackPop(s): Word | StackUnderflowError`
  - `stackPeek(s, depth=0): Word | StackUnderflowError` (depth 0 is top)
  - `stackSetTop(s, v): void | StackUnderflowError`
  - `stackDup(s, nth: 1..16): void | StackUnderflowError | StackOverflowError`
  - `stackSwap(s, nth: 1..16): void | StackUnderflowError`
  - `stackPopN(s, n): Word[] | StackUnderflowError` (internal convenience)

All functions return either a value or a typed error instance (never throw during normal operation).

## Opcode Handler Pattern (TS)

```ts
export function add(f: Frame, cursor: number): Tail {
  const b = stackPop(f.stack); if (b instanceof Error) return b;
  const a = stackPop(f.stack); if (a instanceof Error) return a;
  const r = u256((a as Word) + (b as Word));
  const pe = stackPush(f.stack, r); if (pe instanceof Error) return pe;
  return next(f, cursor); // helper returning { next, cursor } to the next handler
}
```

Each handler:
- Reads/writes only through `Frame` (which contains `stack` and references `evm`).
- Must return either `Next`, `ReturnData`, or an `ErrorUnion`.
- Must not swallow errors.

## Safety Counter

- `Frame.safetyLimit` default: `300_000_000`.
- Interpreter decrements each step; upon reaching 0, returns `SafetyCounterExceededError`.

## TDD Plan (Milestone 1)

1) Stack tests (then impl):
- push/pop/peek/setTop basics
- underflow/overflow
- DUPn and SWAPn

2) Opcode tests (then impl):
- Arithmetic: ADD, SUB, MUL, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD
- Bitwise: AND, OR, XOR, NOT, BYTE, SHL, SHR, SAR
- Comparison: LT, GT, SLT, SGT, EQ, ISZERO
- Stack ops: PUSH1..PUSH32, DUP1..DUP16, SWAP1..SWAP16, POP

3) Dispatch + trampoline and e2e:
- Compile bytecode → schedule
- Execute schedule via trampoline
- e2e: `PUSH1 0x01, PUSH1 0x02, ADD, RETURN` returns `0x03` as 32-byte big-endian

We will use Bun’s test runner (`bun test`) and keep tests self-contained per module.

## Future Milestones

- Memory module and true RETURN semantics (memory slice).
- Gas metering and hardfork configuration.
- Host system calls and storage.
- Synthetic/fused opcodes and dispatch optimizations.
- Tracer parity and differential testing vs. MinimalEvm.

## Implementation Notes

- Use `Uint8Array` for bytecode and returned data.
- Note on signed ops: conform to EVM two’s complement behavior.
- All public APIs are pure or side-effect-limited to their inputs; no hidden globals.
- Logging is minimal and disabled by default in tests.

## Open Questions / Decisions

- ReturnData shape: for M1, `Uint8Array` of 32 bytes (word). Later: `offset/len` from memory.
- Gas: initially disabled; later add optional toggles in `call()`.
- Tracing: integrate after core parity; keep hooks in `beforeInstruction`/`afterInstruction` if needed.

---

This document will guide initial scaffolding, TDD, and implementation for the TS EVM prototype under `ts-evm/`. Next step: initialize a Bun project and begin with Stack tests.
