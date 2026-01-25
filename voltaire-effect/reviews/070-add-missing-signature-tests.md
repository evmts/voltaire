# Add Missing Signature Edge Case Tests

## Problem

Signature module is missing tests for EIP-2930/1559 signatures and large chainId values.

**Location**: `src/primitives/Signature/` tests

Missing:
- EIP-2930 (type 1) and EIP-1559 (type 2) signatures with yParity
- Large chainId values (Polygon 137, BSC 56)
- Signature with r or s = 0 (should reject)
- Signature with r or s >= curve order (should reject)
- EIP-2098 compact format roundtrip with various chainIds

## Why This Matters

- EIP-1559 is now dominant transaction type
- Many chains have chainId > 255
- Invalid signature rejection is security-critical

## Solution

Add comprehensive tests:

```typescript
describe("Signature edge cases", () => {
  describe("EIP-2930/1559 yParity", () => {
    it("handles yParity=0 (even y)", () => {
      const sig = Signature.fromRpc({ r: "0x...", s: "0x...", yParity: "0x0" });
      expect(sig.v).toBe(0);
    });

    it("handles yParity=1 (odd y)", () => {
      const sig = Signature.fromRpc({ r: "0x...", s: "0x...", yParity: "0x1" });
      expect(sig.v).toBe(1);
    });
  });

  describe("large chainId", () => {
    it("handles Polygon chainId 137", () => {
      // v = chainId * 2 + 35 + yParity = 137 * 2 + 35 + 0 = 309
      const sig = Signature.fromLegacy({ r, s, v: 309 });
      expect(Signature.getChainId(sig)).toBe(137);
    });

    it("handles BSC chainId 56", () => {
      // v = 56 * 2 + 35 + 1 = 148
      const sig = Signature.fromLegacy({ r, s, v: 148 });
      expect(Signature.getChainId(sig)).toBe(56);
      expect(Signature.getYParity(sig)).toBe(1);
    });

    it("normalize flips v correctly for chainId=137", () => {
      const sig = { r, s, v: 309 };  // yParity=0
      const normalized = Signature.normalize(sig, true);  // flip parity
      expect(normalized.v).toBe(310);  // yParity=1
    });
  });

  describe("invalid signatures", () => {
    it("rejects r=0", () => {
      const zeroR = new Uint8Array(32).fill(0);
      expect(() => Signature.fromBytes(concat([zeroR, s, [27]]))).toThrow();
    });

    it("rejects s=0", () => {
      const zeroS = new Uint8Array(32).fill(0);
      expect(() => Signature.fromBytes(concat([r, zeroS, [27]]))).toThrow();
    });

    it("rejects r >= secp256k1 order", () => {
      const rTooLarge = /* n + 1 */;
      expect(() => Signature.fromBytes(concat([rTooLarge, s, [27]]))).toThrow();
    });

    it("rejects s >= secp256k1 order", () => {
      const sTooLarge = /* n + 1 */;
      expect(() => Signature.fromBytes(concat([r, sTooLarge, [27]]))).toThrow();
    });
  });

  describe("EIP-2098 compact", () => {
    it("roundtrips with chainId=1 (mainnet)", () => {
      const sig = { r, s, v: 28 };
      const compact = Signature.toCompact(sig);
      const restored = Signature.fromCompact(compact);
      expect(restored.r).toEqual(sig.r);
      expect(restored.s).toEqual(sig.s);
      expect(restored.v).toBe(1);  // yParity only in compact
    });

    it("roundtrips with yParity=1", () => {
      const sig = { r, s, yParity: 1 };
      const compact = Signature.toCompact(sig);
      expect(compact[31] & 0x80).toBe(0x80);  // High bit set
    });
  });
});
```

## Acceptance Criteria

- [ ] Add EIP-2930/1559 yParity tests
- [ ] Add large chainId tests (137, 56)
- [ ] Add r=0, s=0 rejection tests
- [ ] Add r/s >= n rejection tests
- [ ] Add EIP-2098 compact roundtrip tests
- [ ] All tests pass

## Priority

**Low** - Edge case coverage
