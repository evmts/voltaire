# Add Missing RLP Edge Case Tests

## Problem

RLP module is missing tests for extreme edge cases.

**Location**: `src/primitives/Rlp/` tests

Missing:
- Very long length prefix (4+ bytes / 16MB+ data)
- Deeply nested empty lists `[[[[]]]]`
- Integer overflow in length parsing
- Concurrent encode/decode (verify no shared state)

## Why This Matters

- Edge cases can reveal encoding bugs
- Security-critical for transaction serialization
- DOS vectors if length parsing is vulnerable

## Solution

Add edge case tests:

```typescript
describe("RLP edge cases", () => {
  it("handles 16MB+ data with 4-byte length prefix", () => {
    // RLP length > 16MB requires 4-byte length prefix
    const largeData = new Uint8Array(16 * 1024 * 1024 + 1).fill(0xab);
    const encoded = Rlp.encode(largeData);
    const decoded = Rlp.decode(encoded);
    expect(decoded).toEqual(largeData);
  });

  it("handles deeply nested empty lists [[[[]]]]", () => {
    const nested = [[[[]]]];
    const encoded = Rlp.encode(nested);
    const decoded = Rlp.decode(encoded);
    expect(decoded).toEqual(nested);
  });

  it("rejects length claiming integer overflow", () => {
    // Malicious RLP with length prefix claiming 2^64 bytes
    const malicious = new Uint8Array([
      0xbf,  // String > 55 bytes, 8 length bytes
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,  // 2^64 - 1
      0x00,  // Fake data
    ]);
    expect(() => Rlp.decode(malicious)).toThrow();
  });

  it("distinguishes empty list [] from empty bytes 0x", () => {
    const emptyList = Rlp.encode([]);
    const emptyBytes = Rlp.encode(new Uint8Array(0));
    
    expect(emptyList).toEqual(new Uint8Array([0xc0]));  // Empty list
    expect(emptyBytes).toEqual(new Uint8Array([0x80])); // Empty string
    
    expect(Rlp.decode(emptyList)).toEqual([]);
    expect(Rlp.decode(emptyBytes)).toEqual(new Uint8Array(0));
  });

  it("handles concurrent encode/decode (no shared state)", async () => {
    const data1 = new Uint8Array([1, 2, 3]);
    const data2 = new Uint8Array([4, 5, 6]);
    
    const [result1, result2] = await Promise.all([
      Promise.resolve(Rlp.decode(Rlp.encode(data1))),
      Promise.resolve(Rlp.decode(Rlp.encode(data2))),
    ]);
    
    expect(result1).toEqual(data1);
    expect(result2).toEqual(data2);
  });
});
```

## Acceptance Criteria

- [ ] Add 16MB+ data test (may need skip in CI)
- [ ] Add deeply nested empty list test
- [ ] Add integer overflow rejection test
- [ ] Add empty list vs empty bytes distinction test
- [ ] Add concurrency test
- [ ] All tests pass

## Priority

**Low** - Edge case coverage
