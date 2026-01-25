# Fix Abi encodeEventLog Null Topic Handling

<issue>
<metadata>
  <priority>P2</priority>
  <category>semantic-correctness</category>
  <complexity>low</complexity>
  <estimated_effort>30 minutes</estimated_effort>
  <files>
    - src/primitives/Abi/encodeEventLog.ts
    - voltaire-effect/src/primitives/Abi/encodeEventLog.ts
  </files>
  <related_reviews>
    - 082-abi-primitives-review.md
    - 093-receipt-eventlog-review.md
  </related_reviews>
</metadata>

<context>
## Ethereum Event Log Topics

Ethereum event logs have up to 4 topics:
1. **Topic 0**: Keccak-256 hash of the event signature (e.g., `Transfer(address,address,uint256)`)
2. **Topics 1-3**: Indexed event parameters (optional)

## Topic Semantics in Log Filters

When filtering logs, topics have specific meanings:
- **Specific value** (`"0x..."`) - Match only this exact value
- **null** - Match ANY value (wildcard)
- **Array** (`["0x...", "0x..."]`) - Match any of these values (OR)

This is defined in the JSON-RPC spec for `eth_getLogs`:
```json
{
  "topics": [
    "0xddf252ad...",  // Must be Transfer event
    null,              // Any 'from' address
    "0xd8da6bf2..."    // Specific 'to' address
  ]
}
```

## The Problem with "0x"

`"0x"` (empty hex) is NOT the same as `null`:
- `"0x"` means "match empty bytes" - a specific value
- `null` means "match any value" - a wildcard

Using `"0x"` instead of `null` for unspecified topics breaks log filtering.
</context>

<problem>
`encodeEventLog` returns `"0x"` for null indexed arguments, but should return `null` in the topics array.

```typescript
// src/primitives/Abi/encodeEventLog.ts#L79-81
return topics.map((t) =>
  t ? Hex.fromBytes(t as Uint8Array) : ("0x" as HexType),  // ❌ Wrong!
);
```

**Impact:**
- `"0x"` is a valid topic (represents empty bytes/zero)
- `null` means "match any value" in log filters
- Incorrect encoding breaks event filtering
- Inconsistent with Ethereum RPC semantics
- Filters fail to match expected events
</problem>

<solution>
Return `null` for null/undefined topics and update the return type accordingly:

```typescript
// src/primitives/Abi/encodeEventLog.ts

/**
 * Encodes event log topics and data.
 * 
 * Topics are:
 * - Topic 0: Event signature hash
 * - Topics 1-3: Indexed parameters (null = match any)
 * 
 * @param eventAbi - The event ABI definition
 * @param args - Event arguments (indexed and non-indexed)
 * @returns Object with topics array and encoded data
 */
export const encodeEventLog = (
  eventAbi: AbiEvent,
  args?: readonly unknown[],
): {
  topics: readonly (HexType | null)[];  // ✅ Updated type to allow null
  data: HexType;
} => {
  // ... encoding logic ...

  // Map topics, preserving null for undefined/null values
  const encodedTopics = topics.map((t) => {
    if (t === null || t === undefined) {
      return null;  // ✅ Return null, not "0x"
    }
    return Hex.fromBytes(t as Uint8Array);
  });

  return {
    topics: encodedTopics,
    data: encodeData(nonIndexedArgs),
  };
};
```

### For Log Filter Construction

```typescript
// Example: Encoding topics for eth_getLogs filter
const filter = {
  address: contractAddress,
  topics: [
    eventSignatureHash,     // Topic 0: Must be Transfer event
    null,                   // Topic 1: Any 'from' address (wildcard)
    toAddressHash,          // Topic 2: Specific 'to' address
  ],
};

// This correctly matches:
// - All Transfer events
// - From any address
// - To the specific address
```

### Update Effect Wrapper

```typescript
// voltaire-effect/src/primitives/Abi/encodeEventLog.ts
import { Effect } from "effect";
import { encodeEventLog as _encodeEventLog } from "@tevm/voltaire/primitives/Abi";
import type { AbiEvent } from "./types.js";
import type { HexType } from "../Hex/HexType.js";

export const encodeEventLog = (
  eventAbi: AbiEvent,
  args?: readonly unknown[],
): Effect.Effect<
  {
    topics: readonly (HexType | null)[];  // ✅ Correct type
    data: HexType;
  },
  AbiEncodingError
> =>
  Effect.try({
    try: () => _encodeEventLog(eventAbi, args),
    catch: (e) => new AbiEncodingError({
      message: `Failed to encode event log: ${e instanceof Error ? e.message : String(e)}`,
      cause: e,
    }),
  });
```
</solution>

<implementation>
<steps>
1. Update encodeEventLog.ts to return `null` instead of `"0x"` for null topics
2. Update return type to `readonly (HexType | null)[]`
3. Update Effect wrapper with correct type
4. Update any downstream consumers expecting `HexType[]`
5. Add tests for null topic handling
6. Verify log filter creation still works
</steps>

<patterns>
- **Semantic correctness over convenience**: null has specific meaning in Ethereum
- **Accurate types**: Return type should reflect possible values
- **JSON-RPC compatibility**: Match eth_getLogs topic filter semantics
</patterns>

<viem_reference>
Viem's encodeEventTopics handles null correctly:
- [src/utils/abi/encodeEventTopics.ts](https://github.com/wevm/viem/blob/main/src/utils/abi/encodeEventTopics.ts)
- Returns `(Hex | Hex[] | null)[]` for topics
</viem_reference>

<voltaire_reference>
- [src/primitives/Abi/encodeEventLog.ts](file:///Users/williamcory/voltaire/src/primitives/Abi/encodeEventLog.ts) - Current implementation
- [src/primitives/Log/](file:///Users/williamcory/voltaire/src/primitives/Log/) - Log handling
</voltaire_reference>
</implementation>

<tests>
```typescript
// src/primitives/Abi/encodeEventLog.test.ts
import { describe, it, expect } from "vitest";
import { encodeEventLog } from "./encodeEventLog.js";

const transferEvent = {
  type: "event",
  name: "Transfer",
  inputs: [
    { name: "from", type: "address", indexed: true },
    { name: "to", type: "address", indexed: true },
    { name: "value", type: "uint256", indexed: false },
  ],
} as const;

const approvalEvent = {
  type: "event",
  name: "Approval",
  inputs: [
    { name: "owner", type: "address", indexed: true },
    { name: "spender", type: "address", indexed: true },
    { name: "value", type: "uint256", indexed: false },
  ],
} as const;

describe("encodeEventLog", () => {
  describe("topic encoding", () => {
    it("encodes all indexed args as topics", () => {
      const from = "0x1111111111111111111111111111111111111111";
      const to = "0x2222222222222222222222222222222222222222";
      
      const result = encodeEventLog(transferEvent, [from, to, 1000n]);
      
      expect(result.topics).toHaveLength(3);
      expect(result.topics[0]).toMatch(/^0x/); // Event signature
      expect(result.topics[1]).toMatch(/^0x/); // from address
      expect(result.topics[2]).toMatch(/^0x/); // to address
    });

    it("returns null for null indexed args", () => {
      const result = encodeEventLog(transferEvent, [null, null, 1000n]);
      
      expect(result.topics[0]).toMatch(/^0x/); // Event signature always present
      expect(result.topics[1]).toBeNull();     // ✅ null, not "0x"
      expect(result.topics[2]).toBeNull();     // ✅ null, not "0x"
    });

    it("returns null for undefined indexed args", () => {
      const result = encodeEventLog(transferEvent, [undefined, undefined, 1000n]);
      
      expect(result.topics[1]).toBeNull();
      expect(result.topics[2]).toBeNull();
    });

    it("mixes null and non-null topics", () => {
      const to = "0x2222222222222222222222222222222222222222";
      
      const result = encodeEventLog(transferEvent, [null, to, 1000n]);
      
      expect(result.topics[0]).toMatch(/^0x/); // Event signature
      expect(result.topics[1]).toBeNull();     // Any 'from'
      expect(result.topics[2]).toMatch(/^0x/); // Specific 'to'
    });

    it("null is not equal to empty hex", () => {
      const result = encodeEventLog(transferEvent, [null, null, 1000n]);
      
      // null !== "0x"
      expect(result.topics[1]).not.toBe("0x");
      expect(result.topics[1]).toBeNull();
    });
  });

  describe("data encoding", () => {
    it("encodes non-indexed args in data", () => {
      const from = "0x1111111111111111111111111111111111111111";
      const to = "0x2222222222222222222222222222222222222222";
      const value = 1000n;
      
      const result = encodeEventLog(transferEvent, [from, to, value]);
      
      expect(result.data).toMatch(/^0x/);
      // value (1000 = 0x3e8) should be in the data
      expect(result.data.toLowerCase()).toContain("3e8");
    });
  });

  describe("return type", () => {
    it("topics type allows null", () => {
      const result = encodeEventLog(transferEvent, [null, null, 0n]);
      
      // Type assertion should work
      const topics: readonly (string | null)[] = result.topics;
      
      // Filter should handle nulls
      const nonNullTopics = topics.filter((t): t is string => t !== null);
      expect(nonNullTopics).toHaveLength(1); // Only event signature
    });
  });

  describe("log filter usage", () => {
    it("creates valid eth_getLogs filter topics", () => {
      // Common pattern: filter for Transfer events to a specific address
      const toAddress = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
      
      const result = encodeEventLog(transferEvent, [
        null,      // Any 'from'
        toAddress, // Specific 'to'
        undefined, // Value is non-indexed, goes in data
      ]);
      
      // This should be valid for eth_getLogs
      const filter = {
        topics: result.topics,
      };
      
      expect(filter.topics[0]).not.toBeNull(); // Event signature
      expect(filter.topics[1]).toBeNull();     // Wildcard for 'from'
      expect(filter.topics[2]).not.toBeNull(); // Specific 'to'
    });
  });

  describe("edge cases", () => {
    it("handles event with no indexed params", () => {
      const event = {
        type: "event",
        name: "Log",
        inputs: [{ name: "message", type: "string", indexed: false }],
      } as const;
      
      const result = encodeEventLog(event, ["Hello"]);
      
      expect(result.topics).toHaveLength(1); // Just event signature
      expect(result.topics[0]).not.toBeNull();
    });

    it("handles empty args", () => {
      const event = {
        type: "event",
        name: "Ping",
        inputs: [],
      } as const;
      
      const result = encodeEventLog(event, []);
      
      expect(result.topics).toHaveLength(1);
      expect(result.data).toBe("0x");
    });

    it("handles anonymous event (no topic 0)", () => {
      const anonEvent = {
        type: "event",
        name: "Anonymous",
        inputs: [{ name: "value", type: "uint256", indexed: true }],
        anonymous: true,
      } as const;
      
      const result = encodeEventLog(anonEvent, [123n]);
      
      // Anonymous events don't have signature topic
      expect(result.topics).toHaveLength(1);
    });
  });
});

describe("encodeEventLog Effect wrapper", () => {
  it("returns correct type from Effect", async () => {
    const result = await Effect.runPromise(
      encodeEventLog(transferEvent, [null, null, 0n])
    );
    
    expect(result.topics[1]).toBeNull();
  });
});
```
</tests>

<docs>
```typescript
/**
 * Encodes event log topics and data for emission or filtering.
 * 
 * ## Topic Structure
 * 
 * Event logs have up to 4 topics:
 * - **Topic 0**: Keccak-256 hash of event signature (except anonymous events)
 * - **Topics 1-3**: Indexed parameter values (or null for wildcards)
 * 
 * ## Null vs "0x"
 * 
 * When filtering logs, these have different meanings:
 * - `null` - Match ANY value (wildcard)
 * - `"0x..."` - Match this specific value
 * 
 * This function correctly returns `null` for undefined indexed arguments,
 * enabling proper wildcard behavior in log filters.
 * 
 * ## Example
 * 
 * ```typescript
 * import { encodeEventLog } from 'voltaire-effect/primitives/Abi'
 * 
 * const transferEvent = {
 *   type: 'event',
 *   name: 'Transfer',
 *   inputs: [
 *     { name: 'from', type: 'address', indexed: true },
 *     { name: 'to', type: 'address', indexed: true },
 *     { name: 'value', type: 'uint256', indexed: false },
 *   ],
 * }
 * 
 * // Filter for transfers TO a specific address (any sender)
 * const filter = encodeEventLog(transferEvent, [
 *   null,                                    // Any 'from'
 *   '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // Specific 'to'
 *   undefined,                               // value is in data, not topics
 * ])
 * 
 * // filter.topics = [
 * //   '0xddf252ad...',  // Transfer event signature
 * //   null,             // Any 'from' address
 * //   '0x000...d8da6bf2...',  // Specific 'to' address
 * // ]
 * ```
 * 
 * @param eventAbi - Event ABI definition
 * @param args - Event arguments (null for wildcard on indexed params)
 * @returns Object with topics (including nulls) and encoded data
 */
```
</docs>

<api>
<before>
```typescript
// Wrong: returns "0x" for null topics
encodeEventLog(event, [null, toAddr, value])
// Returns: { topics: ["0xddf...", "0x", "0x000..."], data: "0x..." }
//                              ^^^^  Should be null!

// This breaks filtering - "0x" matches empty bytes, not "any value"
const filter = { topics: result.topics };
// ❌ Matches only events with empty 'from' address (none exist)
```
</before>

<after>
```typescript
// Correct: returns null for null topics
encodeEventLog(event, [null, toAddr, value])
// Returns: { topics: ["0xddf...", null, "0x000..."], data: "0x..." }
//                              ^^^^  Correct!

// Works for filtering
const filter = { topics: result.topics };
// ✅ Matches events with any 'from' address

// Type reflects reality
type Topics = readonly (HexType | null)[];
```
</after>
</api>

<acceptance_criteria>
- [ ] Update encodeEventLog to return `null` instead of `"0x"` for null topics
- [ ] Update return type to `readonly (HexType | null)[]`
- [ ] Update Effect wrapper with correct type
- [ ] Add test for null indexed args returning null
- [ ] Add test for undefined indexed args returning null
- [ ] Add test for mixed null and non-null topics
- [ ] Add test verifying null !== "0x"
- [ ] Add test for log filter usage pattern
- [ ] All existing tests pass
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
</acceptance_criteria>

<references>
- [Ethereum JSON-RPC: eth_getLogs](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs)
- [Viem encodeEventTopics](https://github.com/wevm/viem/blob/main/src/utils/abi/encodeEventTopics.ts)
- [Review 093: Receipt/EventLog review](file:///Users/williamcory/voltaire/voltaire-effect/reviews/093-receipt-eventlog-review.md)
</references>
</issue>
