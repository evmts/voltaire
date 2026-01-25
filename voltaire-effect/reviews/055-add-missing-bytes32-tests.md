# Add Missing Bytes32 Tests

## Problem

The Bytes32 module has no test file despite being a core primitive used throughout the codebase.

**Location**: `src/primitives/Bytes32/` - no `*.test.ts` file exists

## Why This Matters

- Core primitive is untested
- Regressions can go unnoticed
- Edge cases not verified
- Inconsistent with other primitives that have tests

## Solution

Create comprehensive test file:

```typescript
// src/primitives/Bytes32/Bytes32.test.ts
import { describe, it, expect } from "vitest";
import * as Bytes32 from "./index";
import * as Hex from "../Hex";

describe("Bytes32", () => {
  describe("fromHex", () => {
    it("parses valid 32-byte hex", () => {
      const hex = "0x" + "ab".repeat(32);
      const bytes = Bytes32.fromHex(hex);
      expect(bytes.length).toBe(32);
      expect(bytes[0]).toBe(0xab);
    });

    it("pads short hex to 32 bytes", () => {
      const bytes = Bytes32.fromHex("0x01");
      expect(bytes.length).toBe(32);
      expect(bytes[31]).toBe(0x01);
      expect(bytes[0]).toBe(0x00);
    });

    it("rejects hex longer than 32 bytes", () => {
      const hex = "0x" + "ab".repeat(33);
      expect(() => Bytes32.fromHex(hex)).toThrow();
    });

    it("handles zero", () => {
      const bytes = Bytes32.fromHex("0x0");
      expect(bytes.length).toBe(32);
      expect(bytes.every((b) => b === 0)).toBe(true);
    });
  });

  describe("fromBytes", () => {
    it("accepts exactly 32 bytes", () => {
      const input = new Uint8Array(32).fill(0xcd);
      const bytes = Bytes32.fromBytes(input);
      expect(bytes.length).toBe(32);
    });

    it("rejects wrong length", () => {
      expect(() => Bytes32.fromBytes(new Uint8Array(31))).toThrow();
      expect(() => Bytes32.fromBytes(new Uint8Array(33))).toThrow();
    });
  });

  describe("toHex", () => {
    it("converts to 66-char hex string", () => {
      const bytes = new Uint8Array(32).fill(0xef);
      const hex = Bytes32.toHex(bytes as Bytes32.Bytes32Type);
      expect(hex).toBe("0x" + "ef".repeat(32));
      expect(hex.length).toBe(66);
    });
  });

  describe("equals", () => {
    it("returns true for equal bytes", () => {
      const a = Bytes32.fromHex("0x" + "11".repeat(32));
      const b = Bytes32.fromHex("0x" + "11".repeat(32));
      expect(Bytes32.equals(a, b)).toBe(true);
    });

    it("returns false for different bytes", () => {
      const a = Bytes32.fromHex("0x" + "11".repeat(32));
      const b = Bytes32.fromHex("0x" + "22".repeat(32));
      expect(Bytes32.equals(a, b)).toBe(false);
    });
  });
});
```

## Acceptance Criteria

- [ ] Create `Bytes32.test.ts`
- [ ] Test `fromHex` with valid, short, and invalid inputs
- [ ] Test `fromBytes` with correct and wrong lengths
- [ ] Test `toHex` conversion
- [ ] Test `equals` for matching and non-matching
- [ ] All tests pass

## Priority

**Medium** - Test coverage for core primitive
