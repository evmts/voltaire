# Namespace+Type Overloading Pattern for Primitives

## Overview

This pattern enables dual usage of primitives as both namespaces (for functions) and types, with a clean public API that doesn't require `.call()`.

## Pattern Structure

### File Structure
```
src/primitives/Address/
├── index.ts          # Re-exports from Address.ts
├── Address.ts        # Main file with type, internal methods, and public wrappers
├── from.ts           # Constructor
├── toHex.ts          # Internal method with `this:` parameter
├── equals.ts         # Internal method with `this:` parameter
└── ...               # Other internal methods
```

### 1. Individual Method Files (e.g., `toHex.ts`)

**IMPORTANT**: Keep these as-is. They use `this:` parameter pattern:

```typescript
import type { Address } from "./Address.js";
import type { Hex } from "../Hex/index.js";

/**
 * Convert Address to hex string
 */
export function toHex(this: Address): Hex {
  return `0x${Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("")}` as Hex;
}
```

**DO NOT modify these files.** They remain internal implementation.

### 2. Main File (`Address.ts`)

This file has THREE sections:

#### Section 1: Export Internal Methods with `_` Prefix

```typescript
// Construction operations - exported as-is (no wrapper needed)
export { from } from "./from.js";
export { fromHex } from "./fromHex.js";
export { fromBytes } from "./fromBytes.js";

// Internal methods - exported with _ prefix for .call() usage
export { toHex as _toHex } from "./toHex.js";
export { equals as _equals } from "./equals.js";
export { isZero as _isZero } from "./isZero.js";
```

#### Section 2: Import Internal Methods for Wrapper Usage

```typescript
// Import internal methods for use in public wrappers
import { from } from "./from.js";
import { toHex as toHexInternal } from "./toHex.js";
import { equals as equalsInternal } from "./equals.js";
import { isZero as isZeroInternal } from "./isZero.js";
```

#### Section 3: Public Wrapper Functions

**THIS IS THE CRITICAL PART THAT WAS MISSING:**

```typescript
/**
 * Convert Address to hex string
 *
 * @param value - Value to convert to Address first
 * @returns Lowercase hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Address.toHex("0x742d35cc...");
 * // "0x742d35cc..."
 * ```
 */
export function toHex(value: number | bigint | string | Uint8Array): Hex {
  return toHexInternal.call(from(value));
}

/**
 * Check if address is zero address
 */
export function isZero(value: number | bigint | string | Uint8Array): boolean {
  return isZeroInternal.call(from(value));
}

/**
 * Check if two addresses are equal
 */
export function equals(
  value: number | bigint | string | Uint8Array,
  other: Address
): boolean {
  return equalsInternal.call(from(value), other);
}
```

### 3. Index File (`index.ts`)

```typescript
export * from './Address.js';
```

### 4. Primitives Index (`src/primitives/index.ts`)

```typescript
export * as Address from "./Address/index.js";
export * as Hash from "./Hash/index.js";
// ... etc
```

### 5. Root Index (`src/index.ts`)

```typescript
export * from "./primitives/index.js";
```

## Usage Patterns

### Old Pattern (Internal, still works)
```typescript
import * as Address from './primitives/Address/index.js';

const addr = Address.from("0x123...");
const hex = Address._toHex.call(addr);  // Uses internal method with .call()
```

### New Pattern (Public, what we want)
```typescript
import * as Address from './primitives/Address/index.js';

const hex = Address.toHex("0x123...");  // Clean API, no .call() needed
const isZero = Address.isZero("0x123...");
```

## Implementation Checklist

For each primitive (Address, Hash, Hex, Uint, etc.):

- [ ] Individual method files use `this:` parameter - **DO NOT MODIFY**
- [ ] `Address.ts` exports internal methods with `_` prefix
- [ ] `Address.ts` imports internal methods for wrapper usage
- [ ] `Address.ts` exports public wrapper functions for ALL methods
- [ ] Public wrappers accept `from()` compatible types as first parameter
- [ ] Public wrappers call `from(value)` then `.call()` internal method
- [ ] Binary operations accept both parameters appropriately
- [ ] `index.ts` uses `export * from './Address.js'`
- [ ] `primitives/index.ts` uses `export * as Address`

## Common Mistakes

### ❌ Wrong: Exporting internal method directly
```typescript
// Address.ts
export { toHex } from "./toHex.js";  // This exports the this: version!
```

### ✅ Correct: Export as _, then add wrapper
```typescript
// Address.ts
export { toHex as _toHex } from "./toHex.js";

import { toHex as toHexInternal } from "./toHex.js";
import { from } from "./from.js";

export function toHex(value: number | bigint | string | Uint8Array): Hex {
  return toHexInternal.call(from(value));
}
```

### ❌ Wrong: No wrapper function
```typescript
// Missing the public wrapper entirely
export { toHex as _toHex } from "./toHex.js";
// User would have to use Address._toHex.call(addr)
```

### ✅ Correct: Both internal and wrapper
```typescript
export { toHex as _toHex } from "./toHex.js";  // For advanced users

export function toHex(value: ...): Hex {  // For normal users
  return toHexInternal.call(from(value));
}
```

## Examples by Method Type

### Unary Methods (single parameter)
```typescript
// Internal (toHex.ts)
export function toHex(this: Address): Hex { ... }

// Wrapper (Address.ts)
import { toHex as toHexInternal } from "./toHex.js";
export function toHex(value: number | bigint | string | Uint8Array): Hex {
  return toHexInternal.call(from(value));
}
```

### Binary Methods (two parameters)
```typescript
// Internal (equals.ts)
export function equals(this: Address, other: Address): boolean { ... }

// Wrapper (Address.ts)
import { equals as equalsInternal } from "./equals.js";
export function equals(
  value: number | bigint | string | Uint8Array,
  other: Address
): boolean {
  return equalsInternal.call(from(value), other);
}
```

### Methods with Additional Parameters
```typescript
// Internal (calculateCreateAddress.ts)
export function calculateCreateAddress(this: Address, nonce: bigint): Address { ... }

// Wrapper (Address.ts)
import { calculateCreateAddress as calculateCreateAddressInternal } from "./calculateCreateAddress.js";
export function calculateCreateAddress(
  value: number | bigint | string | Uint8Array,
  nonce: bigint
): Address {
  return calculateCreateAddressInternal.call(from(value), nonce);
}
```

### Methods with Optional Parameters
```typescript
// Internal (toHex.ts for Uint)
export function toHex(this: Type, padded = true): string { ... }

// Wrapper (Uint.ts)
import { toHex as toHexInternal } from "./toHex.js";
export function toHex(value: number | bigint | string, padded = true): string {
  return toHexInternal.call(from(value), padded);
}
```

## Verification

After implementation, verify:

1. **Public API works without .call()**:
   ```typescript
   Address.toHex("0x123...")  // Should work
   ```

2. **Internal API still works with .call()**:
   ```typescript
   Address._toHex.call(addr)  // Should work for advanced users
   ```

3. **Type exports work**:
   ```typescript
   import type { Address } from './primitives/Address/index.js';
   const addr: Address = ...;
   ```

4. **Build passes**: `zig build && zig build test`
