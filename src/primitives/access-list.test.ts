/**
 * Tests for AccessList module (EIP-2930)
 */

import { describe, it, expect } from "vitest";
import { AccessList } from "./access-list.js";
import type { Address } from "./address.js";
import type { Hash } from "./hash.js";

// ============================================================================
// Test Data
// ============================================================================

// Helper to create test addresses
function createAddress(byte: number): Address {
  const addr = new Uint8Array(20);
  addr.fill(byte);
  return addr as Address;
}

// Helper to create test storage keys
function createStorageKey(byte: number): Hash {
  const key = new Uint8Array(32);
  key.fill(byte);
  return key as Hash;
}

const addr1 = createAddress(1);
const addr2 = createAddress(2);
const _addr3 = createAddress(3);

const key1 = createStorageKey(10);
const key2 = createStorageKey(20);
const key3 = createStorageKey(30);

// ============================================================================
// Type Guard Tests
// ============================================================================

describe("AccessList.isItem", () => {
  it("returns true for valid item", () => {
    const item: AccessList.Item = {
      address: addr1,
      storageKeys: [key1],
    };
    expect(AccessList.isItem(item)).toBe(true);
  });

  it("returns true for item with empty storage keys", () => {
    const item: AccessList.Item = {
      address: addr1,
      storageKeys: [],
    };
    expect(AccessList.isItem(item)).toBe(true);
  });

  it("returns false for null", () => {
    expect(AccessList.isItem(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(AccessList.isItem(undefined)).toBe(false);
  });

  it("returns false for non-object", () => {
    expect(AccessList.isItem(42)).toBe(false);
    expect(AccessList.isItem("string")).toBe(false);
  });

  it("returns false for object without address", () => {
    expect(AccessList.isItem({ storageKeys: [] })).toBe(false);
  });

  it("returns false for object with invalid address length", () => {
    const item = {
      address: new Uint8Array(19),
      storageKeys: [],
    };
    expect(AccessList.isItem(item)).toBe(false);
  });

  it("returns false for object with non-Uint8Array address", () => {
    const item = {
      address: "0x1234",
      storageKeys: [],
    };
    expect(AccessList.isItem(item)).toBe(false);
  });

  it("returns false for object with invalid storage key length", () => {
    const item = {
      address: addr1,
      storageKeys: [new Uint8Array(31)],
    };
    expect(AccessList.isItem(item)).toBe(false);
  });

  it("returns false for object with non-array storage keys", () => {
    const item = {
      address: addr1,
      storageKeys: "not-an-array",
    };
    expect(AccessList.isItem(item)).toBe(false);
  });
});

describe("AccessList.is", () => {
  it("returns true for empty array", () => {
    expect(AccessList.is([])).toBe(true);
  });

  it("returns true for valid access list", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1] },
      { address: addr2, storageKeys: [key2, key3] },
    ];
    expect(AccessList.is(list)).toBe(true);
  });

  it("returns false for non-array", () => {
    expect(AccessList.is(null)).toBe(false);
    expect(AccessList.is(undefined)).toBe(false);
    expect(AccessList.is({})).toBe(false);
  });

  it("returns false for array with invalid item", () => {
    const list = [
      { address: addr1, storageKeys: [key1] },
      { address: "invalid", storageKeys: [] },
    ];
    expect(AccessList.is(list)).toBe(false);
  });
});

// ============================================================================
// Gas Cost Tests
// ============================================================================

describe("AccessList.gasCost", () => {
  it("returns 0 for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.gasCost.call(list)).toBe(0n);
  });

  it("calculates cost for single address with no keys", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    expect(AccessList.gasCost.call(list)).toBe(AccessList.ADDRESS_COST);
  });

  it("calculates cost for single address with one key", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    expect(AccessList.gasCost.call(list)).toBe(
      AccessList.ADDRESS_COST + AccessList.STORAGE_KEY_COST,
    );
  });

  it("calculates cost for single address with multiple keys", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1, key2, key3] }];
    expect(AccessList.gasCost.call(list)).toBe(
      AccessList.ADDRESS_COST + AccessList.STORAGE_KEY_COST * 3n,
    );
  });

  it("calculates cost for multiple addresses", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1] },
      { address: addr2, storageKeys: [key2, key3] },
    ];
    expect(AccessList.gasCost.call(list)).toBe(
      AccessList.ADDRESS_COST * 2n + AccessList.STORAGE_KEY_COST * 3n,
    );
  });

  it("verifies EIP-2930 gas cost constants", () => {
    // Verify constants match EIP-2930 specification
    expect(AccessList.ADDRESS_COST).toBe(2400n);
    expect(AccessList.STORAGE_KEY_COST).toBe(1900n);
  });
});

describe("AccessList.gasSavings", () => {
  it("returns 0 for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.gasSavings.call(list)).toBe(0n);
  });

  it("calculates savings for single address with no keys", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    const expected = AccessList.COLD_ACCOUNT_ACCESS_COST - AccessList.ADDRESS_COST;
    expect(AccessList.gasSavings.call(list)).toBe(expected);
  });

  it("calculates savings for single address with one key", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const expected =
      AccessList.COLD_ACCOUNT_ACCESS_COST -
      AccessList.ADDRESS_COST +
      (AccessList.COLD_STORAGE_ACCESS_COST - AccessList.STORAGE_KEY_COST);
    expect(AccessList.gasSavings.call(list)).toBe(expected);
  });

  it("calculates savings for multiple addresses and keys", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1, key2] },
      { address: addr2, storageKeys: [key3] },
    ];
    const expected =
      (AccessList.COLD_ACCOUNT_ACCESS_COST - AccessList.ADDRESS_COST) * 2n +
      (AccessList.COLD_STORAGE_ACCESS_COST - AccessList.STORAGE_KEY_COST) * 3n;
    expect(AccessList.gasSavings.call(list)).toBe(expected);
  });
});

describe("AccessList.hasSavings", () => {
  it("returns false for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.hasSavings.call(list)).toBe(false);
  });

  it("returns true for address with storage keys", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    expect(AccessList.hasSavings.call(list)).toBe(true);
  });

  it("returns true for address without storage keys", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    // COLD_ACCOUNT_ACCESS_COST (2600) - ADDRESS_COST (2400) = 200 > 0
    expect(AccessList.hasSavings.call(list)).toBe(true);
  });
});

// ============================================================================
// Query Operation Tests
// ============================================================================

describe("AccessList.includesAddress", () => {
  it("returns false for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.includesAddress.call(list, addr1)).toBe(false);
  });

  it("returns true when address is present", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    expect(AccessList.includesAddress.call(list, addr1)).toBe(true);
  });

  it("returns false when address is not present", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    expect(AccessList.includesAddress.call(list, addr2)).toBe(false);
  });

  it("finds address in list with multiple items", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [] },
      { address: addr2, storageKeys: [] },
    ];
    expect(AccessList.includesAddress.call(list, addr2)).toBe(true);
  });
});

describe("AccessList.includesStorageKey", () => {
  it("returns false for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.includesStorageKey.call(list, addr1, key1)).toBe(false);
  });

  it("returns false when address not in list", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    expect(AccessList.includesStorageKey.call(list, addr2, key1)).toBe(false);
  });

  it("returns false when address present but key is not", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    expect(AccessList.includesStorageKey.call(list, addr1, key2)).toBe(false);
  });

  it("returns true when both address and key are present", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1, key2] }];
    expect(AccessList.includesStorageKey.call(list, addr1, key1)).toBe(true);
  });
});

describe("AccessList.keysFor", () => {
  it("returns undefined for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.keysFor.call(list, addr1)).toBeUndefined();
  });

  it("returns undefined when address not in list", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    expect(AccessList.keysFor.call(list, addr2)).toBeUndefined();
  });

  it("returns empty array when address has no keys", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    const keys = AccessList.keysFor.call(list, addr1);
    expect(keys).toBeDefined();
    expect(keys?.length).toBe(0);
  });

  it("returns storage keys for address", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1, key2] }];
    const keys = AccessList.keysFor.call(list, addr1);
    expect(keys).toBeDefined();
    expect(keys?.length).toBe(2);
    expect(keys?.[0]).toBe(key1);
    expect(keys?.[1]).toBe(key2);
  });
});

// ============================================================================
// Transformation Operation Tests
// ============================================================================

describe("AccessList.deduplicate", () => {
  it("returns empty array for empty list", () => {
    const list: AccessList = [];
    const result = AccessList.deduplicate.call(list);
    expect(result.length).toBe(0);
  });

  it("returns same list when no duplicates", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1] },
      { address: addr2, storageKeys: [key2] },
    ];
    const result = AccessList.deduplicate.call(list);
    expect(result.length).toBe(2);
  });

  it("merges duplicate addresses", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1] },
      { address: addr1, storageKeys: [key2] },
    ];
    const result = AccessList.deduplicate.call(list);
    expect(result.length).toBe(1);
    expect(result[0].address).toBe(addr1);
    expect(result[0].storageKeys.length).toBe(2);
  });

  it("removes duplicate storage keys", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1, key2] },
      { address: addr1, storageKeys: [key2, key3] },
    ];
    const result = AccessList.deduplicate.call(list);
    expect(result.length).toBe(1);
    expect(result[0].storageKeys.length).toBe(3);
  });

  it("handles complex deduplication", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1] },
      { address: addr2, storageKeys: [key2] },
      { address: addr1, storageKeys: [key1, key3] },
      { address: addr2, storageKeys: [key2] },
    ];
    const result = AccessList.deduplicate.call(list);
    expect(result.length).toBe(2);
    // addr1 should have key1 and key3
    const addr1Item = result.find((item) =>
      Array.from(item.address).every((b, i) => b === addr1[i]),
    );
    expect(addr1Item?.storageKeys.length).toBe(2);
  });
});

describe("AccessList.withAddress", () => {
  it("adds address to empty list", () => {
    const list: AccessList = [];
    const result = AccessList.withAddress.call(list, addr1);
    expect(result.length).toBe(1);
    expect(result[0].address).toBe(addr1);
    expect(result[0].storageKeys.length).toBe(0);
  });

  it("adds new address to existing list", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    const result = AccessList.withAddress.call(list, addr2);
    expect(result.length).toBe(2);
  });

  it("returns original list when address already exists", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const result = AccessList.withAddress.call(list, addr1);
    expect(result).toBe(list);
  });

  it("does not modify original list", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    const result = AccessList.withAddress.call(list, addr2);
    expect(list.length).toBe(1);
    expect(result.length).toBe(2);
  });
});

describe("AccessList.withStorageKey", () => {
  it("adds address and key to empty list", () => {
    const list: AccessList = [];
    const result = AccessList.withStorageKey.call(list, addr1, key1);
    expect(result.length).toBe(1);
    expect(result[0].address).toBe(addr1);
    expect(result[0].storageKeys.length).toBe(1);
    expect(result[0].storageKeys[0]).toBe(key1);
  });

  it("adds key to existing address", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const result = AccessList.withStorageKey.call(list, addr1, key2);
    expect(result.length).toBe(1);
    expect(result[0].storageKeys.length).toBe(2);
  });

  it("does not add duplicate key", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const result = AccessList.withStorageKey.call(list, addr1, key1);
    expect(result.length).toBe(1);
    expect(result[0].storageKeys.length).toBe(1);
  });

  it("adds address with key when address does not exist", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    const result = AccessList.withStorageKey.call(list, addr2, key1);
    expect(result.length).toBe(2);
  });

  it("does not modify original list", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const result = AccessList.withStorageKey.call(list, addr1, key2);
    expect(list[0].storageKeys.length).toBe(1);
    expect(result[0].storageKeys.length).toBe(2);
  });
});

describe("AccessList.merge", () => {
  it("returns empty list for no inputs", () => {
    const result = AccessList.merge();
    expect(result.length).toBe(0);
  });

  it("returns same list for single input", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const result = AccessList.merge(list);
    expect(result.length).toBe(1);
  });

  it("merges two lists", () => {
    const list1: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const list2: AccessList = [{ address: addr2, storageKeys: [key2] }];
    const result = AccessList.merge(list1, list2);
    expect(result.length).toBe(2);
  });

  it("deduplicates merged lists", () => {
    const list1: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const list2: AccessList = [{ address: addr1, storageKeys: [key2] }];
    const result = AccessList.merge(list1, list2);
    expect(result.length).toBe(1);
    expect(result[0].storageKeys.length).toBe(2);
  });

  it("merges multiple lists", () => {
    const list1: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const list2: AccessList = [{ address: addr2, storageKeys: [key2] }];
    const list3: AccessList = [{ address: addr3, storageKeys: [key3] }];
    const result = AccessList.merge(list1, list2, list3);
    expect(result.length).toBe(3);
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe("AccessList.assertValid", () => {
  it("does not throw for empty list", () => {
    const list: AccessList = [];
    expect(() => AccessList.assertValid.call(list)).not.toThrow();
  });

  it("does not throw for valid list", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1] },
      { address: addr2, storageKeys: [key2, key3] },
    ];
    expect(() => AccessList.assertValid.call(list)).not.toThrow();
  });

  it("throws for non-array", () => {
    expect(() => AccessList.assertValid.call({} as any)).toThrow("Access list must be an array");
  });

  it("throws for invalid item", () => {
    const list = [{ address: "invalid", storageKeys: [] }] as any;
    expect(() => AccessList.assertValid.call(list)).toThrow("Invalid access list item");
  });

  it("throws for invalid address length", () => {
    const list = [{ address: new Uint8Array(19), storageKeys: [] }] as any;
    expect(() => AccessList.assertValid.call(list)).toThrow("Invalid access list item");
  });

  it("throws for non-Uint8Array address", () => {
    const list = [{ address: [1, 2, 3], storageKeys: [] }] as any;
    expect(() => AccessList.assertValid.call(list)).toThrow("Invalid access list item");
  });

  it("throws for invalid storage key length", () => {
    const list = [{ address: addr1, storageKeys: [new Uint8Array(31)] }] as any;
    expect(() => AccessList.assertValid.call(list)).toThrow("Invalid access list item");
  });
});

// ============================================================================
// Encoding/Decoding Tests (Not Implemented)
// ============================================================================

describe("AccessList.toBytes", () => {
  it("throws not implemented error", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1] }];
    expect(() => AccessList.toBytes.call(list)).toThrow("Not implemented");
  });
});

describe("AccessList.fromBytes", () => {
  it("throws not implemented error", () => {
    expect(() => AccessList.fromBytes(new Uint8Array())).toThrow("Not implemented");
  });
});

// ============================================================================
// Utility Operation Tests
// ============================================================================

describe("AccessList.addressCount", () => {
  it("returns 0 for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.addressCount.call(list)).toBe(0);
  });

  it("returns correct count for list", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [] },
      { address: addr2, storageKeys: [] },
      { address: addr3, storageKeys: [] },
    ];
    expect(AccessList.addressCount.call(list)).toBe(3);
  });
});

describe("AccessList.storageKeyCount", () => {
  it("returns 0 for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.storageKeyCount.call(list)).toBe(0);
  });

  it("returns 0 when no storage keys", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    expect(AccessList.storageKeyCount.call(list)).toBe(0);
  });

  it("returns correct count for single address", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [key1, key2, key3] }];
    expect(AccessList.storageKeyCount.call(list)).toBe(3);
  });

  it("returns correct total count for multiple addresses", () => {
    const list: AccessList = [
      { address: addr1, storageKeys: [key1] },
      { address: addr2, storageKeys: [key2, key3] },
    ];
    expect(AccessList.storageKeyCount.call(list)).toBe(3);
  });
});

describe("AccessList.isEmpty", () => {
  it("returns true for empty list", () => {
    const list: AccessList = [];
    expect(AccessList.isEmpty.call(list)).toBe(true);
  });

  it("returns false for non-empty list", () => {
    const list: AccessList = [{ address: addr1, storageKeys: [] }];
    expect(AccessList.isEmpty.call(list)).toBe(false);
  });
});

describe("AccessList.create", () => {
  it("creates empty access list", () => {
    const list = AccessList.create();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("AccessList edge cases", () => {
  it("handles large lists efficiently", () => {
    const items: AccessList.Item[] = [];
    for (let i = 0; i < 100; i++) {
      items.push({
        address: createAddress(i % 20),
        storageKeys: [createStorageKey(i), createStorageKey(i + 1)],
      });
    }
    const list: AccessList = items;

    expect(AccessList.addressCount.call(list)).toBe(100);
    expect(AccessList.storageKeyCount.call(list)).toBe(200);

    const deduped = AccessList.deduplicate.call(list);
    expect(deduped.length).toBeLessThan(100);
  });

  it("handles multiple operations chained", () => {
    const list: AccessList = [];
    const step1 = AccessList.withAddress.call(list, addr1);
    const step2 = AccessList.withStorageKey.call(step1, addr1, key1);
    const step3 = AccessList.withAddress.call(step2, addr2);
    const step4 = AccessList.withStorageKey.call(step3, addr2, key2);

    expect(step4.length).toBe(2);
    expect(AccessList.storageKeyCount.call(step4)).toBe(2);
  });

  it("maintains immutability through transformations", () => {
    const original: AccessList = [{ address: addr1, storageKeys: [key1] }];
    const modified = AccessList.withStorageKey.call(original, addr1, key2);

    expect(original[0].storageKeys.length).toBe(1);
    expect(modified[0].storageKeys.length).toBe(2);
  });

  it("handles identical addresses correctly", () => {
    const sameAddr = createAddress(1);
    const list: AccessList = [
      { address: addr1, storageKeys: [key1] },
      { address: sameAddr, storageKeys: [key2] },
    ];

    const deduped = AccessList.deduplicate.call(list);
    expect(deduped.length).toBe(1);
    expect(deduped[0].storageKeys.length).toBe(2);
  });

  it("handles identical storage keys correctly", () => {
    const sameKey = createStorageKey(10);
    const list: AccessList = [
      { address: addr1, storageKeys: [key1, sameKey] },
    ];

    const result = AccessList.withStorageKey.call(list, addr1, sameKey);
    expect(result[0].storageKeys.length).toBe(2);
  });
});
