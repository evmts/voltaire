# Add Missing ERC20 View Function Encoders

<issue>
<metadata>
  <priority>P3</priority>
  <status>OPEN</status>
  <category>api-completeness</category>
  <complexity>low</complexity>
  <estimated_effort>1 hour</estimated_effort>
  <updated>2026-01-26</updated>
  <files>
    - voltaire-effect/src/standards/ERC20.ts
    - src/standards/ERC20.ts
  </files>
  <related_reviews>
    - 083-erc-standards-review.md
    - 090-unit-conversion-and-formatting-gaps.md
  </related_reviews>
</metadata>

<context>
## ERC-20 Token Standard

ERC-20 (EIP-20) is the most widely used token standard on Ethereum, defining a common interface for fungible tokens. The standard specifies:

### Required Functions
- `totalSupply()` → `uint256` - Total token supply
- `balanceOf(address)` → `uint256` - Token balance of an address
- `transfer(address, uint256)` → `bool` - Transfer tokens
- `approve(address, uint256)` → `bool` - Approve spender
- `allowance(address, address)` → `uint256` - Check allowance
- `transferFrom(address, address, uint256)` → `bool` - Transfer on behalf

### Optional Metadata (EIP-20 extension)
- `name()` → `string` - Token name (e.g., "Tether USD")
- `symbol()` → `string` - Token symbol (e.g., "USDT")
- `decimals()` → `uint8` - Decimal places (usually 18, but USDC uses 6)

## Function Selectors
```
totalSupply()  : 0x18160ddd
name()         : 0x06fdde03
symbol()       : 0x95d89b41
decimals()     : 0x313ce567
balanceOf()    : 0x70a08231
```
</context>

<problem>
ERC20 module is missing encoders for common view functions: `totalSupply()`, `name()`, `symbol()`, `decimals()`. 

**Current state:**
- Action functions have encoders (`encodeTransfer`, `encodeApprove`, etc.)
- View functions require manual ABI encoding
- Inconsistent API where some functions are convenient and others aren't

**Impact:**
- Users must manually encode these common calls
- More boilerplate code for simple token queries
- Incomplete standard implementation
- Doesn't match viem's complete API surface
</problem>

<status_update>
**Current status (2026-01-26)**:
- `voltaire-effect/src/standards/ERC20.ts` still lacks `encodeTotalSupply`, `encodeName`, `encodeSymbol`, `encodeDecimals` and matching result decoders.
- Base implementation in `src/standards/ERC20.ts` also lacks these helpers.

**Remaining work**:
1. Add the four view encoders (totalSupply/name/symbol/decimals) to both base and Effect wrapper.
2. Add `decode*Result` helpers so callers can decode the response without manual ABI parsing.
3. Add quick unit tests for the selectors and decoder outputs.
</status_update>

<solution>
Add Effect-wrapped encoders and result decoders for all ERC20 view functions, following the existing pattern in `ERC20.ts`.

### Implementation

```typescript
// voltaire-effect/src/standards/ERC20.ts

import { Effect } from "effect";
import * as ERC20Impl from "@tevm/voltaire/standards/ERC20";
import { StandardsError } from "./errors.js";
import type { Uint256Type } from "../primitives/Uint/Uint256Type.js";

// ============================================================================
// View Function Encoders (no parameters)
// ============================================================================

/**
 * Encodes a call to `totalSupply()`.
 * Returns the total number of tokens in existence.
 * 
 * @example
 * ```typescript
 * const calldata = await Effect.runPromise(ERC20.encodeTotalSupply())
 * const result = await provider.call({ to: tokenAddress, data: calldata })
 * const supply = await Effect.runPromise(ERC20.decodeTotalSupplyResult(result))
 * ```
 */
export const encodeTotalSupply = (): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC20Impl.encodeTotalSupply(),
    catch: (e) =>
      new StandardsError({
        operation: "ERC20.encodeTotalSupply",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

/**
 * Encodes a call to `name()`.
 * Returns the name of the token (e.g., "Tether USD").
 */
export const encodeName = (): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC20Impl.encodeName(),
    catch: (e) =>
      new StandardsError({
        operation: "ERC20.encodeName",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

/**
 * Encodes a call to `symbol()`.
 * Returns the symbol of the token (e.g., "USDT").
 */
export const encodeSymbol = (): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC20Impl.encodeSymbol(),
    catch: (e) =>
      new StandardsError({
        operation: "ERC20.encodeSymbol",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

/**
 * Encodes a call to `decimals()`.
 * Returns the number of decimals used for display (e.g., 18 for most tokens, 6 for USDC).
 */
export const encodeDecimals = (): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC20Impl.encodeDecimals(),
    catch: (e) =>
      new StandardsError({
        operation: "ERC20.encodeDecimals",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

// ============================================================================
// Result Decoders
// ============================================================================

/**
 * Decodes the result of a `totalSupply()` call.
 * 
 * @param data - ABI-encoded return data
 * @returns The total supply as bigint
 */
export const decodeTotalSupplyResult = (
  data: string,
): Effect.Effect<Uint256Type, StandardsError> =>
  Effect.try({
    try: () => ERC20Impl.decodeTotalSupplyResult(data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC20.decodeTotalSupplyResult",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

/**
 * Decodes the result of a `name()` call.
 * 
 * @param data - ABI-encoded return data
 * @returns The token name as string
 */
export const decodeNameResult = (
  data: string,
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC20Impl.decodeNameResult(data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC20.decodeNameResult",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

/**
 * Decodes the result of a `symbol()` call.
 * 
 * @param data - ABI-encoded return data
 * @returns The token symbol as string
 */
export const decodeSymbolResult = (
  data: string,
): Effect.Effect<string, StandardsError> =>
  Effect.try({
    try: () => ERC20Impl.decodeSymbolResult(data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC20.decodeSymbolResult",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });

/**
 * Decodes the result of a `decimals()` call.
 * 
 * @param data - ABI-encoded return data  
 * @returns The decimals as number (0-255)
 */
export const decodeDecimalsResult = (
  data: string,
): Effect.Effect<number, StandardsError> =>
  Effect.try({
    try: () => ERC20Impl.decodeDecimalsResult(data),
    catch: (e) =>
      new StandardsError({
        operation: "ERC20.decodeDecimalsResult",
        message: e instanceof Error ? e.message : String(e),
        cause: e,
      }),
  });
```

### Core Implementation (if needed)

```typescript
// src/standards/ERC20.ts - Add if not present

export const SELECTORS = {
  totalSupply: "0x18160ddd",
  name: "0x06fdde03", 
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  balanceOf: "0x70a08231",
  // ... existing selectors
} as const;

export const encodeTotalSupply = (): string => SELECTORS.totalSupply;
export const encodeName = (): string => SELECTORS.name;
export const encodeSymbol = (): string => SELECTORS.symbol;
export const encodeDecimals = (): string => SELECTORS.decimals;

export const decodeTotalSupplyResult = (data: string): bigint => {
  // Remove 0x prefix and decode uint256
  const hex = data.startsWith("0x") ? data.slice(2) : data;
  return BigInt("0x" + hex);
};

export const decodeNameResult = (data: string): string => {
  return decodeAbiString(data);
};

export const decodeSymbolResult = (data: string): string => {
  return decodeAbiString(data);
};

export const decodeDecimalsResult = (data: string): number => {
  const hex = data.startsWith("0x") ? data.slice(2) : data;
  return Number(BigInt("0x" + hex));
};

// Helper for ABI string decoding
const decodeAbiString = (data: string): string => {
  const hex = data.startsWith("0x") ? data.slice(2) : data;
  // offset (32 bytes) + length (32 bytes) + string data
  const offset = parseInt(hex.slice(0, 64), 16);
  const length = parseInt(hex.slice(offset * 2, offset * 2 + 64), 16);
  const stringHex = hex.slice(offset * 2 + 64, offset * 2 + 64 + length * 2);
  return Buffer.from(stringHex, "hex").toString("utf8");
};
```
</solution>

<implementation>
<steps>
1. Add encoder functions to src/standards/ERC20.ts if not present
2. Add decoder functions to src/standards/ERC20.ts if not present
3. Add Effect-wrapped versions to voltaire-effect/src/standards/ERC20.ts
4. Export all new functions from index.ts
5. Add comprehensive tests
</steps>

<patterns>
- **Effect.try for wrapping**: Catch errors and convert to StandardsError
- **Selector constants**: Use SELECTORS object for function selectors
- **Paired encode/decode**: Every encoder has a corresponding result decoder
- **Consistent error wrapping**: All errors wrapped in StandardsError with operation context
</patterns>

<viem_reference>
Viem provides these via readContract actions:
- [src/actions/public/readContract.ts](https://github.com/wevm/viem/blob/main/src/actions/public/readContract.ts)
- Uses ABI encoding internally for all ERC-20 calls
</viem_reference>

<voltaire_reference>
- [src/standards/ERC20.ts#L15-L41](file:///Users/williamcory/voltaire/src/standards/ERC20.ts#L15-L41) - Existing selectors
- [src/standards/ERC20.ts#L183-L218](file:///Users/williamcory/voltaire/src/standards/ERC20.ts#L183-L218) - Existing decoders
- [voltaire-effect/src/standards/ERC20.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/standards/ERC20.ts) - Effect wrappers
</voltaire_reference>
</implementation>

<tests>
```typescript
// voltaire-effect/src/standards/ERC20.test.ts
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import * as ERC20 from "./ERC20.js";

describe("ERC20 view function encoders", () => {
  describe("encodeTotalSupply", () => {
    it("encodes totalSupply() call", async () => {
      const result = await Effect.runPromise(ERC20.encodeTotalSupply());
      expect(result).toBe("0x18160ddd");
    });

    it("returns 4-byte selector", async () => {
      const result = await Effect.runPromise(ERC20.encodeTotalSupply());
      expect(result.length).toBe(10); // 0x + 8 hex chars
    });
  });

  describe("encodeName", () => {
    it("encodes name() call", async () => {
      const result = await Effect.runPromise(ERC20.encodeName());
      expect(result).toBe("0x06fdde03");
    });
  });

  describe("encodeSymbol", () => {
    it("encodes symbol() call", async () => {
      const result = await Effect.runPromise(ERC20.encodeSymbol());
      expect(result).toBe("0x95d89b41");
    });
  });

  describe("encodeDecimals", () => {
    it("encodes decimals() call", async () => {
      const result = await Effect.runPromise(ERC20.encodeDecimals());
      expect(result).toBe("0x313ce567");
    });
  });
});

describe("ERC20 result decoders", () => {
  describe("decodeTotalSupplyResult", () => {
    it("decodes uint256 total supply", async () => {
      // 1e18 in hex (1 token with 18 decimals)
      const encoded = "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000";
      const result = await Effect.runPromise(ERC20.decodeTotalSupplyResult(encoded));
      expect(result).toBe(1000000000000000000n);
    });

    it("decodes zero supply", async () => {
      const encoded = "0x" + "00".repeat(32);
      const result = await Effect.runPromise(ERC20.decodeTotalSupplyResult(encoded));
      expect(result).toBe(0n);
    });

    it("decodes max uint256", async () => {
      const encoded = "0x" + "ff".repeat(32);
      const result = await Effect.runPromise(ERC20.decodeTotalSupplyResult(encoded));
      expect(result).toBe(2n ** 256n - 1n);
    });

    it("fails on invalid data", async () => {
      const result = await Effect.runPromiseExit(ERC20.decodeTotalSupplyResult("0x"));
      expect(result._tag).toBe("Failure");
    });
  });

  describe("decodeNameResult", () => {
    it("decodes string name", async () => {
      // ABI-encoded "Test Token"
      const encoded = "0x" +
        "0000000000000000000000000000000000000000000000000000000000000020" + // offset
        "000000000000000000000000000000000000000000000000000000000000000a" + // length (10)
        "5465737420546f6b656e00000000000000000000000000000000000000000000"; // "Test Token" padded
      
      const result = await Effect.runPromise(ERC20.decodeNameResult(encoded));
      expect(result).toBe("Test Token");
    });

    it("decodes empty string", async () => {
      const encoded = "0x" +
        "0000000000000000000000000000000000000000000000000000000000000020" +
        "0000000000000000000000000000000000000000000000000000000000000000";
      
      const result = await Effect.runPromise(ERC20.decodeNameResult(encoded));
      expect(result).toBe("");
    });

    it("decodes unicode name", async () => {
      // ABI-encoded "Tether USD" (common real token)
      const encoded = "0x" +
        "0000000000000000000000000000000000000000000000000000000000000020" +
        "000000000000000000000000000000000000000000000000000000000000000a" +
        "5465746865722055534400000000000000000000000000000000000000000000";
      
      const result = await Effect.runPromise(ERC20.decodeNameResult(encoded));
      expect(result).toBe("Tether USD");
    });
  });

  describe("decodeSymbolResult", () => {
    it("decodes string symbol", async () => {
      // ABI-encoded "TST"
      const encoded = "0x" +
        "0000000000000000000000000000000000000000000000000000000000000020" +
        "0000000000000000000000000000000000000000000000000000000000000003" +
        "5453540000000000000000000000000000000000000000000000000000000000";
      
      const result = await Effect.runPromise(ERC20.decodeSymbolResult(encoded));
      expect(result).toBe("TST");
    });

    it("decodes USDC symbol", async () => {
      const encoded = "0x" +
        "0000000000000000000000000000000000000000000000000000000000000020" +
        "0000000000000000000000000000000000000000000000000000000000000004" +
        "5553444300000000000000000000000000000000000000000000000000000000";
      
      const result = await Effect.runPromise(ERC20.decodeSymbolResult(encoded));
      expect(result).toBe("USDC");
    });
  });

  describe("decodeDecimalsResult", () => {
    it("decodes 18 decimals (standard)", async () => {
      const encoded = "0x0000000000000000000000000000000000000000000000000000000000000012";
      const result = await Effect.runPromise(ERC20.decodeDecimalsResult(encoded));
      expect(result).toBe(18);
    });

    it("decodes 6 decimals (USDC)", async () => {
      const encoded = "0x0000000000000000000000000000000000000000000000000000000000000006";
      const result = await Effect.runPromise(ERC20.decodeDecimalsResult(encoded));
      expect(result).toBe(6);
    });

    it("decodes 8 decimals (WBTC)", async () => {
      const encoded = "0x0000000000000000000000000000000000000000000000000000000000000008";
      const result = await Effect.runPromise(ERC20.decodeDecimalsResult(encoded));
      expect(result).toBe(8);
    });

    it("decodes 0 decimals", async () => {
      const encoded = "0x" + "00".repeat(32);
      const result = await Effect.runPromise(ERC20.decodeDecimalsResult(encoded));
      expect(result).toBe(0);
    });
  });
});

describe("ERC20 integration patterns", () => {
  it("encode/decode roundtrip example", async () => {
    // Simulate calling totalSupply
    const calldata = await Effect.runPromise(ERC20.encodeTotalSupply());
    expect(calldata).toBe("0x18160ddd");
    
    // Simulate response: 1000 tokens with 18 decimals
    const response = "0x00000000000000000000000000000000000000000000003635c9adc5dea00000";
    const supply = await Effect.runPromise(ERC20.decodeTotalSupplyResult(response));
    expect(supply).toBe(1000n * 10n ** 18n);
  });
});
```
</tests>

<docs>
```typescript
/**
 * @module ERC20
 * 
 * ERC-20 token standard encoders and decoders.
 * 
 * ## View Functions
 * 
 * Encode calldata for read-only token queries:
 * 
 * ```typescript
 * import * as ERC20 from 'voltaire-effect/standards/ERC20'
 * 
 * // Get token metadata
 * const nameCall = await Effect.runPromise(ERC20.encodeName())
 * const symbolCall = await Effect.runPromise(ERC20.encodeSymbol())
 * const decimalsCall = await Effect.runPromise(ERC20.encodeDecimals())
 * const supplyCall = await Effect.runPromise(ERC20.encodeTotalSupply())
 * 
 * // Make calls (using your provider)
 * const nameResult = await provider.call({ to: token, data: nameCall })
 * 
 * // Decode results
 * const name = await Effect.runPromise(ERC20.decodeNameResult(nameResult))
 * const decimals = await Effect.runPromise(ERC20.decodeDecimalsResult(decimalsResult))
 * ```
 * 
 * ## Function Selectors
 * 
 * - `totalSupply()` → `0x18160ddd`
 * - `name()` → `0x06fdde03`
 * - `symbol()` → `0x95d89b41`
 * - `decimals()` → `0x313ce567`
 * 
 * @see https://eips.ethereum.org/EIPS/eip-20
 */
```
</docs>

<api>
<new_functions>
### Encoders
- `encodeTotalSupply(): Effect<string, StandardsError>`
- `encodeName(): Effect<string, StandardsError>`
- `encodeSymbol(): Effect<string, StandardsError>`
- `encodeDecimals(): Effect<string, StandardsError>`

### Decoders
- `decodeTotalSupplyResult(data: string): Effect<Uint256Type, StandardsError>`
- `decodeNameResult(data: string): Effect<string, StandardsError>`
- `decodeSymbolResult(data: string): Effect<string, StandardsError>`
- `decodeDecimalsResult(data: string): Effect<number, StandardsError>`
</new_functions>
</api>

<acceptance_criteria>
- [ ] Add encodeTotalSupply encoder
- [ ] Add encodeName encoder
- [ ] Add encodeSymbol encoder
- [ ] Add encodeDecimals encoder
- [ ] Add decodeTotalSupplyResult decoder
- [ ] Add decodeNameResult decoder
- [ ] Add decodeSymbolResult decoder
- [ ] Add decodeDecimalsResult decoder
- [ ] Export all functions from index
- [ ] Tests verify correct selectors (0x18160ddd, 0x06fdde03, 0x95d89b41, 0x313ce567)
- [ ] Tests verify uint256 decoding (totalSupply)
- [ ] Tests verify string decoding (name, symbol)
- [ ] Tests verify uint8 decoding (decimals)
- [ ] Tests for edge cases (empty string, 0 decimals, max uint256)
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
</acceptance_criteria>

<references>
- [ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [Viem ERC20 utilities](https://viem.sh/docs/contract/readContract)
- [OpenZeppelin ERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol)
- [Voltaire ERC20 selectors](file:///Users/williamcory/voltaire/src/standards/ERC20.ts#L15-L41)
</references>
</issue>
