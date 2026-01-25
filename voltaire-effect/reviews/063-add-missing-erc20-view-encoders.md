# Add Missing ERC20 View Function Encoders

## Problem

ERC20 module is missing encoders for common view functions.

**Location**: `src/standards/ERC20.ts`

Missing:
- `encodeTotalSupply()`
- `encodeName()`
- `encodeSymbol()`
- `encodeDecimals()`

## Why This Matters

- Users must manually encode these common calls
- Inconsistent API - some functions have encoders, others don't
- ERC20 is most common standard, should be complete

## Solution

Add missing encoders:

```typescript
/**
 * Encodes a call to `totalSupply()`.
 * @returns Encoded calldata
 */
export const encodeTotalSupply = (): Hex =>
  Abi.encodeFunction(ERC20_ABI, "totalSupply", []);

/**
 * Encodes a call to `name()`.
 * @returns Encoded calldata
 */
export const encodeName = (): Hex =>
  Abi.encodeFunction(ERC20_ABI, "name", []);

/**
 * Encodes a call to `symbol()`.
 * @returns Encoded calldata
 */
export const encodeSymbol = (): Hex =>
  Abi.encodeFunction(ERC20_ABI, "symbol", []);

/**
 * Encodes a call to `decimals()`.
 * @returns Encoded calldata
 */
export const encodeDecimals = (): Hex =>
  Abi.encodeFunction(ERC20_ABI, "decimals", []);

// Add corresponding decoders:
export const decodeTotalSupplyResult = (data: Hex): bigint =>
  Abi.decodeFunctionResult(ERC20_ABI, "totalSupply", data) as bigint;

export const decodeNameResult = (data: Hex): string =>
  Abi.decodeFunctionResult(ERC20_ABI, "name", data) as string;

export const decodeSymbolResult = (data: Hex): string =>
  Abi.decodeFunctionResult(ERC20_ABI, "symbol", data) as string;

export const decodeDecimalsResult = (data: Hex): number =>
  Number(Abi.decodeFunctionResult(ERC20_ABI, "decimals", data));
```

## Acceptance Criteria

- [ ] Add `encodeTotalSupply`
- [ ] Add `encodeName`
- [ ] Add `encodeSymbol`
- [ ] Add `encodeDecimals`
- [ ] Add corresponding result decoders
- [ ] Add tests for each
- [ ] Export from index

## Priority

**Low** - API completeness
