# Uint Utils Architecture

## Module Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                                                               │
│  • Gas calculations                                           │
│  • Token amounts                                              │
│  • Balance operations                                         │
│  • Block number arithmetic                                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Uint Utils Module                           │
│              (src/primitives/uint-utils/)                    │
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   Uint64 API   │  │  Uint256 API   │  │  U256Compat   │ │
│  │                │  │                │  │               │ │
│  │ • fromBigInt   │  │ • fromBigInt   │  │ • toU256      │ │
│  │ • toBigInt     │  │ • toBigInt     │  │ • fromU256    │ │
│  │ • fromNumber   │  │ • fromHex      │  │ • bigIntToU256│ │
│  │ • toNumber     │  │ • toHex        │  │ • hexToU256   │ │
│  │ • add, sub     │  │ • fromBytes    │  └───────────────┘ │
│  │ • mul, div     │  │ • toBytes      │                    │
│  │ • mod          │  │ • add, sub     │                    │
│  │ • compare      │  │ • mul, div     │                    │
│  │ • eq, lt, gt   │  │ • mod, pow     │                    │
│  │ • min, max     │  │ • and, or, xor │                    │
│  │ • isUint64     │  │ • not, shl,shr │                    │
│  └────────────────┘  │ • compare      │                    │
│                      │ • eq, lt, gt   │                    │
│                      │ • min, max     │                    │
│                      │ • isUint256    │                    │
│                      └────────────────┘                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               Existing Types Module                          │
│                (src/types/index.ts)                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  U256 Interface (C API compatible)                   │   │
│  │                                                       │   │
│  │  interface U256 {                                    │   │
│  │    bytes: Uint8Array;  // 32 bytes, big-endian      │   │
│  │  }                                                    │   │
│  │                                                       │   │
│  │  • Used for FFI/C API interop                        │   │
│  │  • Matches C struct layout                           │   │
│  │  • Direct memory representation                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Type System

```
┌─────────────────────────────────────────────────────────────┐
│                     Branded Types                            │
│                                                               │
│  type Uint64 = `0x${string}` & { __brand: 'Uint64' }        │
│  type Uint256 = `0x${string}` & { __brand: 'Uint256' }      │
│                                                               │
│  Benefits:                                                    │
│  ✓ Compile-time type safety                                  │
│  ✓ Prevents mixing with regular strings                      │
│  ✓ Zero runtime overhead                                     │
│  ✓ Self-documenting code                                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Runtime Validation                          │
│                                                               │
│  • Range checking (0 to 2^64-1 or 2^256-1)                  │
│  • Overflow/underflow detection                              │
│  • Input format validation                                   │
│  • Descriptive error messages                                │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: Application to C API

```
┌──────────────┐
│ Application  │
│    Code      │
└──────┬───────┘
       │
       │ (1) Create Uint256 from business logic
       │
       ▼
┌────────────────────────────────────────────┐
│  const gasPrice = Uint256.fromBigInt(...)  │
│  const gasLimit = Uint256.fromBigInt(...)  │
│  const gasCost = Uint256.mul(price, limit) │
└────────┬───────────────────────────────────┘
         │
         │ (2) Perform operations in TypeScript
         │     (Fast, ergonomic, type-safe)
         │
         ▼
┌────────────────────────────────────────────┐
│  const result = Uint256.add(...)           │
│                Uint256.sub(...)            │
│                Uint256.mul(...)            │
└────────┬───────────────────────────────────┘
         │
         │ (3) Convert to U256 at boundary
         │
         ▼
┌────────────────────────────────────────────┐
│  const u256 = U256Compat.toU256(result)    │
└────────┬───────────────────────────────────┘
         │
         │ (4) Call C API with U256
         │
         ▼
┌────────────────────────────────────────────┐
│         C API / Zig Native Code            │
│     (Operates on U256 bytes directly)      │
└────────┬───────────────────────────────────┘
         │
         │ (5) Receive U256 result
         │
         ▼
┌────────────────────────────────────────────┐
│  const resultU256: U256 = { bytes: ... }   │
└────────┬───────────────────────────────────┘
         │
         │ (6) Convert back to Uint256
         │
         ▼
┌────────────────────────────────────────────┐
│  const result = U256Compat.fromU256(...)   │
└────────┬───────────────────────────────────┘
         │
         │ (7) Continue with TypeScript logic
         │
         ▼
┌──────────────┐
│ Application  │
│    Code      │
└──────────────┘
```

## Conversion Layer

```
┌──────────────────────────────────────────────────────────────┐
│                    U256Compat Layer                          │
│                                                               │
│  Purpose: Bridge between Uint256 (branded) and U256 (bytes)  │
│                                                               │
│  ┌────────────────┐              ┌────────────────┐          │
│  │    Uint256     │◄────────────►│      U256      │          │
│  │  (TypeScript)  │   toU256()   │   (C API)      │          │
│  │                │   fromU256() │                │          │
│  │ `0x${string}`  │              │ { bytes: ... } │          │
│  └────────────────┘              └────────────────┘          │
│                                                               │
│  Conversion Methods:                                          │
│  • toU256(uint256)        → U256                             │
│  • fromU256(u256)         → Uint256                          │
│  • bigIntToU256(bigint)   → U256                             │
│  • u256ToBigInt(u256)     → bigint                           │
│  • hexToU256(hex)         → U256                             │
│  • u256ToHex(u256)        → hex string                       │
└──────────────────────────────────────────────────────────────┘
```

## Operation Categories

```
┌─────────────────────────────────────────────────────────────┐
│                    Uint64 Operations                         │
├─────────────────────────────────────────────────────────────┤
│ Conversions   │ fromBigInt, toBigInt, fromNumber, toNumber  │
│ Arithmetic    │ add, sub, mul, div, mod                     │
│ Comparisons   │ compare, eq, lt, gt, lte, gte, min, max     │
│ Validation    │ isUint64 (type guard)                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Uint256 Operations                        │
├─────────────────────────────────────────────────────────────┤
│ Conversions   │ fromBigInt, toBigInt, fromHex, toHex,       │
│               │ fromBytes, toBytes                           │
│ Arithmetic    │ add, sub, mul, div, mod, pow                │
│ Bitwise       │ and, or, xor, not, shl, shr                 │
│ Comparisons   │ compare, eq, lt, gt, lte, gte, min, max     │
│ Validation    │ isUint256 (type guard)                      │
└─────────────────────────────────────────────────────────────┘
```

## Memory Layout

```
Uint64:  Hex String "0x..." → BigInt → 64-bit unsigned integer
         ┌────────────────────────────────────┐
         │         64 bits (8 bytes)          │
         │  0x0000000000000000 to             │
         │  0xffffffffffffffff                │
         └────────────────────────────────────┘

Uint256: Hex String "0x..." → BigInt → 256-bit unsigned integer
         ┌────────────────────────────────────────────────────┐
         │              256 bits (32 bytes)                   │
         │  0x00000...00000 to                                │
         │  0xfffff...fffff                                   │
         └────────────────────────────────────────────────────┘

U256:    Byte Array (big-endian)
         ┌──┬──┬──┬──┬──┬──┬──┬──┬ ─ ─ ─ ─ ┬──┬──┬──┬──┐
         │  │  │  │  │  │  │  │  │         │  │  │  │  │
         │ 0│ 1│ 2│ 3│ 4│ 5│ 6│ 7│   ...   │28│29│30│31│
         │  │  │  │  │  │  │  │  │         │  │  │  │  │
         └──┴──┴──┴──┴──┴──┴──┴──┴ ─ ─ ─ ─ ┴──┴──┴──┴──┘
         MSB                                          LSB
         (Most Significant Byte)        (Least Significant Byte)
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   Error Boundaries                           │
│                                                               │
│  Input Validation                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Range checks (0 to MAX)                            │   │
│  │ • Format validation (hex, bytes)                     │   │
│  │ • Type validation (number, bigint)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Operation Validation                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Overflow detection (add, mul, pow, shl)            │   │
│  │ • Underflow detection (sub)                          │   │
│  │ • Division by zero (div, mod)                        │   │
│  │ • Shift range (0-255 for Uint256)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Conversion Validation                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Safe integer check (toNumber)                      │   │
│  │ • Byte array length (fromBytes)                      │   │
│  │ • Hex format (fromHex)                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Error Messages: Clear, descriptive, actionable              │
└─────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────────┐
│                    Operation Complexity                      │
├────────────────────┬────────────────────────────────────────┤
│ fromBigInt         │ O(1) - Direct conversion               │
│ toBigInt           │ O(1) - Direct conversion               │
│ fromHex            │ O(n) - Parse hex digits (n = length)   │
│ toHex              │ O(1) - Already hex string              │
│ fromBytes          │ O(n) - Iterate bytes (n = 32)          │
│ toBytes            │ O(n) - Generate bytes (n = 32)         │
│ add, sub           │ O(n) - BigInt arithmetic (n = bits)    │
│ mul, div, mod      │ O(n²) - BigInt arithmetic              │
│ pow                │ O(log e) - Binary exponentiation       │
│ compare, eq, lt... │ O(n) - BigInt comparison               │
│ and, or, xor, not  │ O(n) - BigInt bitwise (n = bits)       │
│ shl, shr           │ O(n) - BigInt shift (n = bits)         │
└────────────────────┴────────────────────────────────────────┘

Memory Usage:
• Uint64/Uint256: Minimal (string reference + brand)
• U256: 32 bytes (Uint8Array)
• BigInt: Variable (depends on value)
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Test Coverage                           │
│                                                               │
│  uint64.test.ts (73 tests)                                   │
│  ├─ Constants (3 tests)                                      │
│  ├─ Conversions (24 tests)                                   │
│  ├─ Arithmetic (15 tests)                                    │
│  ├─ Comparisons (25 tests)                                   │
│  └─ Type Guards (6 tests)                                    │
│                                                               │
│  uint256.test.ts (80 tests)                                  │
│  ├─ Constants (3 tests)                                      │
│  ├─ Conversions (28 tests)                                   │
│  ├─ Arithmetic (16 tests)                                    │
│  ├─ Comparisons (10 tests)                                   │
│  ├─ Bitwise (12 tests)                                       │
│  ├─ Shifts (7 tests)                                         │
│  └─ Type Guards (4 tests)                                    │
│                                                               │
│  u256-compat.test.ts (14 tests)                              │
│  ├─ Conversions (8 tests)                                    │
│  ├─ Round-trips (2 tests)                                    │
│  ├─ Edge Cases (2 tests)                                     │
│  └─ Error Handling (2 tests)                                 │
│                                                               │
│  Total: 167 tests, 194 assertions, 100% pass rate            │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

```
1. Type Safety First
   • Branded types prevent accidental misuse
   • Compile-time checks catch errors early
   • Runtime validation for dynamic inputs

2. Fail Fast
   • Validate inputs immediately
   • Throw descriptive errors
   • No silent failures or truncation

3. Pure Functions
   • No side effects
   • Deterministic results
   • Easy to test and reason about

4. Ergonomic API
   • Intuitive function names
   • Consistent parameter order
   • Clear documentation

5. Performance Aware
   • Minimize conversions
   • Use native BigInt operations
   • Zero-cost abstractions where possible

6. Compatibility
   • Seamless interop with existing types
   • Clear conversion boundaries
   • Documented migration path
```

## Future Extension Points

```
┌─────────────────────────────────────────────────────────────┐
│              Potential Enhancements                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Wrapping Arithmetic     │ addWrapping, subWrapping       │
│ 2. Checked Arithmetic      │ Return Result<T, Error>        │
│ 3. Decimal Parsing         │ fromDecimal("1000000000")      │
│ 4. Formatting              │ Format options (decimal, etc)  │
│ 5. Bitwise Utilities       │ countOnes, leadingZeros        │
│ 6. Memoization             │ Cache common constants         │
│ 7. SIMD Operations         │ Vectorized arithmetic          │
│ 8. WebAssembly Bridge      │ Direct WASM integration        │
└─────────────────────────────────────────────────────────────┘
```
