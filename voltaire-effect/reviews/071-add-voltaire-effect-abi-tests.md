# Add voltaire-effect Abi Module Tests

## Problem

The voltaire-effect Abi module has no test files despite wrapping all Abi operations in Effect.

**Location**: `voltaire-effect/src/primitives/Abi/` - no `*.test.ts` files exist

## Why This Matters

- Effect wrappers untested
- Error channel types unverified
- Regressions in Effect integration undetected

## Solution

Create test file for Effect-wrapped Abi operations:

```typescript
// voltaire-effect/src/primitives/Abi/Abi.test.ts
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import * as Abi from "./index";

const ERC20_ABI = [
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

describe("Abi Effect wrappers", () => {
  describe("encodeFunctionData", () => {
    it("encodes valid function call", async () => {
      const result = await Effect.runPromise(
        Abi.encodeFunctionData(ERC20_ABI, "transfer", [
          "0x1234567890123456789012345678901234567890",
          1000n,
        ])
      );
      expect(result).toMatch(/^0xa9059cbb/);  // transfer selector
    });

    it("fails with AbiItemNotFoundError for missing function", async () => {
      const result = await Effect.runPromiseExit(
        Abi.encodeFunctionData(ERC20_ABI, "nonexistent", [])
      );
      expect(result._tag).toBe("Failure");
    });
  });

  describe("decodeFunctionData", () => {
    it("decodes valid calldata", async () => {
      const encoded = "0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000a";
      const result = await Effect.runPromise(
        Abi.decodeFunctionData(ERC20_ABI, encoded)
      );
      expect(result.name).toBe("transfer");
      expect(result.params[1]).toBe(10n);
    });

    it("fails with AbiInvalidSelectorError for unknown selector", async () => {
      const result = await Effect.runPromiseExit(
        Abi.decodeFunctionData(ERC20_ABI, "0xdeadbeef")
      );
      expect(result._tag).toBe("Failure");
    });
  });

  describe("parseItem", () => {
    it("parses valid ABI item JSON", async () => {
      const json = JSON.stringify(ERC20_ABI[0]);
      const result = await Effect.runPromise(Abi.parseItem(json));
      expect(result.name).toBe("transfer");
    });

    it("fails with AbiItemParseError for invalid JSON", async () => {
      const result = await Effect.runPromiseExit(
        Abi.parseItem("not json")
      );
      expect(result._tag).toBe("Failure");
    });
  });
});
```

## Acceptance Criteria

- [ ] Create `Abi.test.ts` in voltaire-effect
- [ ] Test `encodeFunctionData` success and failure
- [ ] Test `decodeFunctionData` success and failure
- [ ] Test `parseItem` success and failure
- [ ] Test error types are correct
- [ ] All tests pass

## Priority

**Medium** - Test coverage for Effect wrappers
