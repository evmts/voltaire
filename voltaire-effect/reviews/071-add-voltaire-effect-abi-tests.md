# Add voltaire-effect Abi Module Tests

<issue>
<metadata>
<id>071</id>
<priority>P2</priority>
<category>Testing</category>
<module>voltaire-effect/src/primitives/Abi</module>
<files>
  - voltaire-effect/src/primitives/Abi/*.ts
</files>
</metadata>

<problem>
The voltaire-effect Abi module has no test files despite wrapping all Abi operations in Effect. Effect wrappers are untested, error channel types unverified, and regressions undetected.

**Location**: `voltaire-effect/src/primitives/Abi/` - no `*.test.ts` files exist
</problem>

<effect_pattern>
<name>Effect Test Patterns with vitest</name>
<rationale>
Effect provides testing utilities that integrate with vitest for:
- Running effectful tests with proper fiber semantics
- Testing error channels with Exit types
- Using TestContext for deterministic behavior
- Verifying typed errors in failure cases
</rationale>
<before>
```typescript
// ❌ Testing without Effect semantics
it("should encode function", async () => {
  try {
    const result = await somePromise();
    expect(result).toBe(...);
  } catch (e) {
    expect(e).toBeInstanceOf(SomeError);
  }
});
```
</before>
<after>
```typescript
// ✅ Idiomatic Effect testing
import { Effect, Exit } from "effect";
import { describe, it, expect } from "vitest";

describe("Abi Effect wrappers", () => {
  it("encodes valid function call", async () => {
    const result = await Effect.runPromise(
      Abi.encodeFunctionData(ERC20_ABI, "transfer", [
        "0x1234567890123456789012345678901234567890",
        1000n,
      ])
    );
    expect(result).toMatch(/^0xa9059cbb/);
  });

  it("fails with typed error for missing function", async () => {
    const exit = await Effect.runPromiseExit(
      Abi.encodeFunctionData(ERC20_ABI, "nonexistent", [])
    );
    
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = Cause.failureOption(exit.cause);
      expect(Option.isSome(error)).toBe(true);
      expect(error.value._tag).toBe("AbiItemNotFoundError");
    }
  });
});
```
</after>
<effect_docs>https://effect.website/docs/testing</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Testing Error Channels</name>
<rationale>
Effect's typed error channels should be verified in tests to ensure:
- Errors are properly typed (not just thrown)
- Error tags match expected values
- Error data is correctly populated
- Errors can be caught with catchTag
</rationale>
<before>
```typescript
// ❌ Only testing happy path
it("decodes data", async () => {
  const result = await Effect.runPromise(decode(...));
  expect(result).toBeDefined();
});
```
</before>
<after>
```typescript
// ✅ Testing both success and error channels
it("succeeds with valid input", async () => {
  const result = await Effect.runPromise(decode(validInput));
  expect(result.name).toBe("transfer");
});

it("fails with AbiDecodeError for invalid input", async () => {
  const program = decode(invalidInput).pipe(
    Effect.catchTag("AbiDecodeError", (e) => 
      Effect.succeed({ caught: true, message: e.message })
    )
  );
  
  const result = await Effect.runPromise(program);
  expect(result.caught).toBe(true);
  expect(result.message).toContain("invalid");
});

it("error has correct structure", async () => {
  const exit = await Effect.runPromiseExit(decode(invalidInput));
  
  expect(exit).toMatchObject({
    _tag: "Failure",
    cause: {
      _tag: "Fail",
      error: {
        _tag: "AbiDecodeError",
        // Verify error properties
      }
    }
  });
});
```
</after>
<effect_docs>https://effect.website/docs/error-management/expected-errors</effect_docs>
</effect_pattern>

<solution>
Create comprehensive test file for Effect-wrapped Abi operations:

```typescript
// voltaire-effect/src/primitives/Abi/Abi.test.ts
import { describe, it, expect } from "vitest";
import { Effect, Exit, Cause, Option } from "effect";
import * as Abi from "./index.js";

const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
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
      expect(result).toMatch(/^0xa9059cbb/);
    });

    it("fails with AbiItemNotFoundError for missing function", async () => {
      const exit = await Effect.runPromiseExit(
        Abi.encodeFunctionData(ERC20_ABI, "nonexistent", [])
      );
      
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("error can be caught with catchTag", async () => {
      const program = Abi.encodeFunctionData(ERC20_ABI, "nonexistent", []).pipe(
        Effect.catchTag("AbiItemNotFoundError", () => 
          Effect.succeed("caught")
        )
      );
      
      const result = await Effect.runPromise(program);
      expect(result).toBe("caught");
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
      const exit = await Effect.runPromiseExit(
        Abi.decodeFunctionData(ERC20_ABI, "0xdeadbeef")
      );
      
      expect(Exit.isFailure(exit)).toBe(true);
    });
  });

  describe("parseItem", () => {
    it("parses valid ABI item JSON", async () => {
      const json = JSON.stringify(ERC20_ABI[0]);
      const result = await Effect.runPromise(Abi.parseItem(json));
      expect(result.name).toBe("transfer");
    });

    it("fails with AbiItemParseError for invalid JSON", async () => {
      const exit = await Effect.runPromiseExit(
        Abi.parseItem("not json")
      );
      
      expect(Exit.isFailure(exit)).toBe(true);
    });
  });

  describe("encodeEventLog", () => {
    it("encodes event with indexed parameters", async () => {
      const result = await Effect.runPromise(
        Abi.encodeEventLog(ERC20_ABI, "Transfer", {
          from: "0x1111111111111111111111111111111111111111",
          to: "0x2222222222222222222222222222222222222222",
          value: 1000n,
        })
      );
      
      expect(result.topics).toHaveLength(3);
      expect(result.data).toBeDefined();
    });
  });

  describe("decodeEventLog", () => {
    it("decodes event from topics and data", async () => {
      const encoded = await Effect.runPromise(
        Abi.encodeEventLog(ERC20_ABI, "Transfer", {
          from: "0x1111111111111111111111111111111111111111",
          to: "0x2222222222222222222222222222222222222222",
          value: 1000n,
        })
      );
      
      const decoded = await Effect.runPromise(
        Abi.decodeEventLog(ERC20_ABI, encoded.topics, encoded.data)
      );
      
      expect(decoded.eventName).toBe("Transfer");
      expect(decoded.args.value).toBe(1000n);
    });
  });
});
```
</solution>

<implementation>
<steps>
1. Create `Abi.test.ts` in voltaire-effect/src/primitives/Abi/
2. Test all Effect-wrapped functions: encodeFunctionData, decodeFunctionData, parseItem, encodeEventLog, decodeEventLog
3. Test both success and error cases for each function
4. Verify error types can be caught with catchTag
5. Use Exit.isFailure for error channel verification
6. Run tests with `pnpm test`
</steps>
<imports>
```typescript
import { Effect, Exit, Cause, Option } from "effect";
import { describe, it, expect } from "vitest";
```
</imports>
</implementation>

<acceptance_criteria>
- [ ] Create `Abi.test.ts` in voltaire-effect
- [ ] Test `encodeFunctionData` success and failure
- [ ] Test `decodeFunctionData` success and failure
- [ ] Test `parseItem` success and failure
- [ ] Test `encodeEventLog` and `decodeEventLog`
- [ ] Verify error types are correct with catchTag
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect Testing](https://effect.website/docs/testing)
- [Effect Exit](https://effect.website/docs/data-types/exit)
- [Effect Error Management](https://effect.website/docs/error-management/expected-errors)
- [Effect catchTag](https://effect.website/docs/error-management/matching#catchtag)
</references>
</issue>
