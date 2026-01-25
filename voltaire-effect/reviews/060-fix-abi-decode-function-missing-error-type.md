# Fix Abi decodeFunction Missing Error Type

<issue>
<metadata>
  <priority>P2</priority>
  <category>type-safety</category>
  <complexity>low</complexity>
  <estimated_effort>30 minutes</estimated_effort>
  <files>
    - src/primitives/Abi/decodeFunction.ts
    - voltaire-effect/src/primitives/Abi/decodeFunctionData.ts
  </files>
  <related_reviews>
    - 082-abi-primitives-review.md
    - 097-error-types-review.md
  </related_reviews>
</metadata>

<context>
## Effect Error Channel Philosophy

Effect's type system tracks possible errors in the error channel (`Effect<Success, Error>`). This enables:
- Compile-time error handling guarantees
- Exhaustive error matching
- Clear API contracts about what can fail

When an error type is missing from the error union, the type system lies about what can actually happen at runtime.

## ABI Decoding Errors

ABI decoding involves multiple failure modes:
1. **Selector not found**: The 4-byte function selector doesn't match any ABI entry
2. **Invalid selector format**: The data doesn't have a valid 4-byte prefix
3. **Decoding failure**: The parameters don't match the expected ABI types

Each should have its own error type for proper discrimination.
</context>

<problem>
`decodeFunction` return type is missing `AbiDecodingError` in its error union. The function internally calls `_decodeFunction` which can throw `AbiDecodingError` when parameter data is malformed.

```typescript
// src/primitives/Abi/decodeFunction.ts#L52-55
export const decodeFunction = (
  abi: Abi,
  data: Hex,
): Effect.Effect<
  { name: string; params: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError  // ❌ Missing AbiDecodingError!
>
```

**Impact:**
- Type lies about possible errors
- Callers don't handle decoding errors
- `_decodeFunction` can throw `AbiDecodingError` when params are malformed
- Runtime surprises when "impossible" errors occur
- Breaks Effect's error tracking guarantees
</problem>

<solution>
Add `AbiDecodingError` to the return type and properly catch it in the error handler:

```typescript
// src/primitives/Abi/decodeFunction.ts
import { Effect } from "effect";
import { _decodeFunction } from "./_decodeFunction.js";
import { 
  AbiItemNotFoundError, 
  AbiInvalidSelectorError, 
  AbiDecodingError 
} from "./Errors.js";
import type { Abi } from "./types.js";
import type { Hex } from "../Hex/HexType.js";

/**
 * Decodes function call data using an ABI.
 * 
 * @param abi - The contract ABI
 * @param data - The encoded function call data (selector + params)
 * @returns Effect with decoded function name and parameters
 * 
 * @example
 * ```typescript
 * const result = await Effect.runPromise(
 *   decodeFunction(contractAbi, calldata)
 * )
 * console.log(result.name)   // 'transfer'
 * console.log(result.params) // ['0x...', 1000n]
 * ```
 */
export const decodeFunction = (
  abi: Abi,
  data: Hex,
): Effect.Effect<
  { name: string; params: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError  // ✅ Complete error union
> =>
  Effect.try({
    try: () => _decodeFunction(abi, data),
    catch: (e) => {
      // Preserve typed errors
      if (e instanceof AbiItemNotFoundError) return e;
      if (e instanceof AbiInvalidSelectorError) return e;
      if (e instanceof AbiDecodingError) return e;
      
      // Wrap unknown errors in AbiDecodingError
      return new AbiDecodingError({
        message: `Failed to decode function: ${e instanceof Error ? e.message : String(e)}`,
        cause: e,
      });
    },
  });
```

Also update the Effect wrapper in voltaire-effect:

```typescript
// voltaire-effect/src/primitives/Abi/decodeFunctionData.ts
import { Effect } from "effect";
import { decodeFunction as _decodeFunction } from "@tevm/voltaire/primitives/Abi";
import { 
  AbiItemNotFoundError, 
  AbiInvalidSelectorError, 
  AbiDecodingError 
} from "./errors.js";

export const decodeFunctionData = (
  abi: Abi,
  data: HexType,
): Effect.Effect<
  { functionName: string; args: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError
> =>
  Effect.try({
    try: () => {
      const result = _decodeFunction(abi, data);
      return {
        functionName: result.name,
        args: result.params,
      };
    },
    catch: (e) => {
      if (e instanceof AbiItemNotFoundError) return e;
      if (e instanceof AbiInvalidSelectorError) return e;
      if (e instanceof AbiDecodingError) return e;
      return new AbiDecodingError({
        message: `Failed to decode function data: ${e instanceof Error ? e.message : String(e)}`,
        cause: e,
      });
    },
  });
```
</solution>

<implementation>
<steps>
1. Add `AbiDecodingError` import to decodeFunction.ts
2. Update return type to include `AbiDecodingError` in error union
3. Update catch handler to check for and preserve `AbiDecodingError`
4. Update voltaire-effect/decodeFunctionData.ts similarly
5. Run type checker to find any call sites that need updating
6. Update call sites to handle the new error type
7. Add test for malformed parameter data
</steps>

<patterns>
- **Complete error unions**: Include all possible error types
- **Error preservation**: Re-throw typed errors without wrapping
- **Unknown error wrapping**: Wrap unexpected errors in appropriate type
- **Viem error patterns**: Follow viem's error hierarchy
</patterns>

<viem_reference>
Viem ABI decoding error handling:
- [src/utils/abi/decodeAbiParameters.ts](https://github.com/wevm/viem/blob/main/src/utils/abi/decodeAbiParameters.ts)
- [src/errors/abi.ts](https://github.com/wevm/viem/blob/main/src/errors/abi.ts) - AbiDecodingDataSizeTooSmallError, etc.
</viem_reference>

<voltaire_reference>
- [src/primitives/Abi/Errors.js#L55-L74](file:///Users/williamcory/voltaire/src/primitives/Abi/Errors.js#L55-L74) - AbiDecodingError definition
- [src/primitives/Abi/decodeValue.js#L49-L214](file:///Users/williamcory/voltaire/src/primitives/Abi/decodeValue.js#L49-L214) - Core decoding logic
- [voltaire-effect/src/primitives/Abi/decodeFunctionData.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Abi/decodeFunctionData.ts) - Effect wrapper
</voltaire_reference>
</implementation>

<tests>
```typescript
// src/primitives/Abi/decodeFunction.test.ts
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { decodeFunction } from "./decodeFunction.js";
import { 
  AbiItemNotFoundError, 
  AbiInvalidSelectorError, 
  AbiDecodingError 
} from "./Errors.js";

const transferAbi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

describe("decodeFunction", () => {
  describe("success cases", () => {
    it("decodes valid function call", async () => {
      const selector = "0xa9059cbb"; // transfer(address,uint256)
      const params = 
        "000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045" +
        "0000000000000000000000000000000000000000000000000de0b6b3a7640000";
      
      const result = await Effect.runPromise(
        decodeFunction(transferAbi, selector + params)
      );
      
      expect(result.name).toBe("transfer");
      expect(result.params).toHaveLength(2);
      expect(result.params[0]).toBe("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
      expect(result.params[1]).toBe(1000000000000000000n);
    });
  });

  describe("error cases", () => {
    it("returns AbiItemNotFoundError for unknown selector", async () => {
      const unknownSelector = "0xdeadbeef" + "00".repeat(64);
      
      const result = await Effect.runPromise(
        decodeFunction(transferAbi, unknownSelector).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AbiItemNotFoundError);
      }
    });

    it("returns AbiInvalidSelectorError for short data", async () => {
      const shortData = "0xab"; // Less than 4 bytes
      
      const result = await Effect.runPromise(
        decodeFunction(transferAbi, shortData).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AbiInvalidSelectorError);
      }
    });

    it("returns AbiDecodingError for malformed params", async () => {
      const selector = "0xa9059cbb"; // transfer(address,uint256)
      const malformedParams = "abcd"; // Too short, not valid ABI encoding
      
      const result = await Effect.runPromise(
        decodeFunction(transferAbi, selector + malformedParams).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AbiDecodingError);
      }
    });

    it("returns AbiDecodingError for truncated params", async () => {
      const selector = "0xa9059cbb";
      // Only partial address, missing uint256
      const truncatedParams = "000000000000000000000000d8da6bf26964af9d7eed9e03";
      
      const result = await Effect.runPromise(
        decodeFunction(transferAbi, selector + truncatedParams).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AbiDecodingError);
      }
    });
  });

  describe("type safety", () => {
    it("error union includes all three error types", async () => {
      const effect = decodeFunction(transferAbi, "0x");
      
      // This should type-check - exhaustive handling
      const result = await Effect.runPromise(
        effect.pipe(
          Effect.catchTags({
            AbiItemNotFoundError: (e) => Effect.succeed({ handled: "notFound", error: e }),
            AbiInvalidSelectorError: (e) => Effect.succeed({ handled: "invalidSelector", error: e }),
            AbiDecodingError: (e) => Effect.succeed({ handled: "decoding", error: e }),
          })
        )
      );
      
      expect(result.handled).toBeDefined();
    });
  });
});

describe("error messages", () => {
  it("AbiDecodingError includes helpful context", async () => {
    const selector = "0xa9059cbb";
    const badData = "not-hex-data";
    
    const result = await Effect.runPromise(
      decodeFunction(transferAbi, selector + badData).pipe(Effect.either)
    );
    
    if (result._tag === "Left" && result.left instanceof AbiDecodingError) {
      expect(result.left.message).toContain("decode");
    }
  });
});
```
</tests>

<docs>
```typescript
/**
 * Decodes function call data using an ABI.
 * 
 * Extracts the function selector from the first 4 bytes, finds the matching
 * ABI entry, and decodes the remaining bytes as function parameters.
 * 
 * ## Error Types
 * 
 * This function can fail with three different error types:
 * 
 * - `AbiItemNotFoundError` - No ABI entry matches the 4-byte selector
 * - `AbiInvalidSelectorError` - Data is too short or malformed selector
 * - `AbiDecodingError` - Parameter data doesn't match expected ABI types
 * 
 * ## Example
 * 
 * ```typescript
 * import { decodeFunction } from 'voltaire-effect/primitives/Abi'
 * import { Effect } from 'effect'
 * 
 * const result = await Effect.runPromise(
 *   decodeFunction(contractAbi, calldata).pipe(
 *     Effect.catchTags({
 *       AbiItemNotFoundError: (e) => {
 *         console.log('Unknown function:', e.selector)
 *         return Effect.fail(e)
 *       },
 *       AbiDecodingError: (e) => {
 *         console.log('Bad params:', e.message)
 *         return Effect.fail(e)
 *       },
 *     })
 *   )
 * )
 * ```
 * 
 * @param abi - Contract ABI array
 * @param data - Encoded calldata (0x + selector + params)
 * @returns Effect with function name and decoded parameters
 */
```
</docs>

<api>
<before>
```typescript
// Incomplete error union - lies about possible errors
export const decodeFunction = (
  abi: Abi,
  data: Hex,
): Effect.Effect<
  { name: string; params: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError  // Missing AbiDecodingError
>

// Caller can't handle decoding errors properly
decodeFunction(abi, data).pipe(
  Effect.catchTags({
    AbiItemNotFoundError: handleNotFound,
    AbiInvalidSelectorError: handleInvalidSelector,
    // AbiDecodingError not handleable - will throw at runtime!
  })
)
```
</before>

<after>
```typescript
// Complete error union
export const decodeFunction = (
  abi: Abi,
  data: Hex,
): Effect.Effect<
  { name: string; params: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError  // ✅ Complete
>

// Caller can exhaustively handle all errors
decodeFunction(abi, data).pipe(
  Effect.catchTags({
    AbiItemNotFoundError: handleNotFound,
    AbiInvalidSelectorError: handleInvalidSelector,
    AbiDecodingError: handleDecodingError,  // ✅ Now handleable
  })
)
```
</after>
</api>

<acceptance_criteria>
- [ ] Add `AbiDecodingError` to decodeFunction return type
- [ ] Update error handling in catch block to preserve AbiDecodingError
- [ ] Update voltaire-effect/decodeFunctionData.ts similarly
- [ ] All existing tests pass
- [ ] Add test for malformed params triggering AbiDecodingError
- [ ] Add test for truncated params triggering AbiDecodingError
- [ ] Add test demonstrating exhaustive error handling
- [ ] Type checker passes with no errors
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
</acceptance_criteria>

<references>
- [Effect error handling](https://effect.website/docs/guides/error-management/two-error-types)
- [Viem ABI errors](https://github.com/wevm/viem/blob/main/src/errors/abi.ts)
- [Voltaire ABI Errors](file:///Users/williamcory/voltaire/src/primitives/Abi/Errors.js#L55-L74)
- [Review 082: ABI primitives review](file:///Users/williamcory/voltaire/voltaire-effect/reviews/082-abi-primitives-review.md)
</references>
</issue>
