/**
 * Tests for AccessList module (EIP-2930)
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../../Hash/BrandedHash/BrandedHash.js";
import { isItem } from "./isItem.js";
import { is } from "./is.js";
import { gasCost } from "./gasCost.js";
import { gasSavings } from "./gasSavings.js";
import { hasSavings } from "./hasSavings.js";
import { includesAddress } from "./includesAddress.js";
import { includesStorageKey } from "./includesStorageKey.js";
import { keysFor } from "./keysFor.js";
import { deduplicate } from "./deduplicate.js";
import { withAddress } from "./withAddress.js";
import { withStorageKey } from "./withStorageKey.js";
import { merge } from "./merge.js";
import { assertValid } from "./assertValid.js";
import { toBytes } from "./toBytes.js";
import { addressCount } from "./addressCount.js";
import { storageKeyCount } from "./storageKeyCount.js";
import { isEmpty } from "./isEmpty.js";
import { create } from "./create.js";
import { fromBytes } from "./fromBytes.js";
import {
	ADDRESS_COST,
	COLD_ACCOUNT_ACCESS_COST,
	COLD_STORAGE_ACCESS_COST,
	STORAGE_KEY_COST,
} from "./constants.js";
import type {
	BrandedAccessList as AccessListType,
	Item,
} from "../BrandedAccessList.js";

// ============================================================================
// Test Data
// ============================================================================

// Helper to create test addresses
function createAddress(byte: number): BrandedAddress {
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as BrandedAddress;
}

// Helper to create test storage keys
function createStorageKey(byte: number): BrandedHash {
	const key = new Uint8Array(32);
	key.fill(byte);
	return key as BrandedHash;
}

const addr1 = createAddress(1);
const addr2 = createAddress(2);
const addr3 = createAddress(3);

const key1 = createStorageKey(10);
const key2 = createStorageKey(20);
const key3 = createStorageKey(30);

// ============================================================================
// Type Guard Tests
// ============================================================================

describe("AccessList.isItem", () => {
	it("returns true for valid item", () => {
		const item: Item = {
			address: addr1,
			storageKeys: [key1],
		};
		expect(isItem(item)).toBe(true);
	});

	it("returns true for item with empty storage keys", () => {
		const item: Item = {
			address: addr1,
			storageKeys: [],
		};
		expect(isItem(item)).toBe(true);
	});

	it("returns false for null", () => {
		expect(isItem(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isItem(undefined)).toBe(false);
	});

	it("returns false for non-object", () => {
		expect(isItem(42)).toBe(false);
		expect(isItem("string")).toBe(false);
	});

	it("returns false for object without address", () => {
		expect(isItem({ storageKeys: [] })).toBe(false);
	});

	it("returns false for object with invalid address length", () => {
		const item = {
			address: new Uint8Array(19),
			storageKeys: [],
		};
		expect(isItem(item)).toBe(false);
	});

	it("returns false for object with non-Uint8Array address", () => {
		const item = {
			address: "0x1234",
			storageKeys: [],
		};
		expect(isItem(item)).toBe(false);
	});

	it("returns false for object with invalid storage key length", () => {
		const item = {
			address: addr1,
			storageKeys: [new Uint8Array(31)],
		};
		expect(isItem(item)).toBe(false);
	});

	it("returns false for object with non-array storage keys", () => {
		const item = {
			address: addr1,
			storageKeys: "not-an-array",
		};
		expect(isItem(item)).toBe(false);
	});
});

describe("AccessList.is", () => {
	it("returns true for empty array", () => {
		expect(is([])).toBe(true);
	});

	it("returns true for valid access list", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: addr2, storageKeys: [key2, key3] },
		];
		expect(is(list)).toBe(true);
	});

	it("returns false for non-array", () => {
		expect(is(null)).toBe(false);
		expect(is(undefined)).toBe(false);
		expect(is({})).toBe(false);
	});

	it("returns false for array with invalid item", () => {
		const list = [
			{ address: addr1, storageKeys: [key1] },
			{ address: "invalid", storageKeys: [] },
		];
		expect(is(list)).toBe(false);
	});
});

// ============================================================================
// Gas Cost Tests
// ============================================================================

describe("AccessList.gasCost", () => {
	it("returns 0 for empty list", () => {
		const list: AccessListType = [];
		expect(gasCost(list)).toBe(0n);
	});

	it("calculates cost for single address with no keys", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		expect(gasCost(list)).toBe(ADDRESS_COST);
	});

	it("calculates cost for single address with one key", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		expect(gasCost(list)).toBe(
			ADDRESS_COST + STORAGE_KEY_COST,
		);
	});

	it("calculates cost for single address with multiple keys", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2, key3] },
		];
		expect(gasCost(list)).toBe(
			ADDRESS_COST + STORAGE_KEY_COST * 3n,
		);
	});

	it("calculates cost for multiple addresses", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: addr2, storageKeys: [key2, key3] },
		];
		expect(gasCost(list)).toBe(
			ADDRESS_COST * 2n + STORAGE_KEY_COST * 3n,
		);
	});

	it("verifies EIP-2930 gas cost constants", () => {
		// Verify constants match EIP-2930 specification
		expect(ADDRESS_COST).toBe(2400n);
		expect(STORAGE_KEY_COST).toBe(1900n);
	});
});

describe("AccessList.gasSavings", () => {
	it("returns 0 for empty list", () => {
		const list: AccessListType = [];
		expect(gasSavings(list)).toBe(0n);
	});

	it("calculates savings for single address with no keys", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		const expected =
			COLD_ACCOUNT_ACCESS_COST - ADDRESS_COST;
		expect(gasSavings(list)).toBe(expected);
	});

	it("calculates savings for single address with one key", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const expected =
			COLD_ACCOUNT_ACCESS_COST -
			ADDRESS_COST +
			(COLD_STORAGE_ACCESS_COST - STORAGE_KEY_COST);
		expect(gasSavings(list)).toBe(expected);
	});

	it("calculates savings for multiple addresses and keys", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
			{ address: addr2, storageKeys: [key3] },
		];
		const addressSavings = COLD_ACCOUNT_ACCESS_COST - ADDRESS_COST;
		const storageSavings = COLD_STORAGE_ACCESS_COST - STORAGE_KEY_COST;
		const expected = addressSavings * 2n + storageSavings * 3n;
		expect(gasSavings(list)).toBe(expected);
	});
});

describe("AccessList.hasSavings", () => {
	it("returns false for empty list", () => {
		const list: AccessListType = [];
		expect(hasSavings(list)).toBe(false);
	});

	it("returns true for address with storage keys", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		expect(hasSavings(list)).toBe(true);
	});

	it("returns true for address without storage keys", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		// COLD_ACCOUNT_ACCESS_COST (2600) - ADDRESS_COST (2400) = 200 > 0
		expect(hasSavings(list)).toBe(true);
	});
});

// ============================================================================
// Query Operation Tests
// ============================================================================

describe("AccessList.includesAddress", () => {
	it("returns false for empty list", () => {
		const list: AccessListType = [];
		expect(includesAddress(list, addr1)).toBe(false);
	});

	it("returns true when address is present", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		expect(includesAddress(list, addr1)).toBe(true);
	});

	it("returns false when address is not present", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		expect(includesAddress(list, addr2)).toBe(false);
	});

	it("finds address in list with multiple items", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [] },
			{ address: addr2, storageKeys: [] },
		];
		expect(includesAddress(list, addr2)).toBe(true);
	});
});

describe("AccessList.includesStorageKey", () => {
	it("returns false for empty list", () => {
		const list: AccessListType = [];
		expect(includesStorageKey(list, addr1, key1)).toBe(false);
	});

	it("returns false when address not in list", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		expect(includesStorageKey(list, addr2, key1)).toBe(false);
	});

	it("returns false when address present but key is not", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		expect(includesStorageKey(list, addr1, key2)).toBe(false);
	});

	it("returns true when both address and key are present", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
		];
		expect(includesStorageKey(list, addr1, key1)).toBe(true);
	});
});

describe("AccessList.keysFor", () => {
	it("returns undefined for empty list", () => {
		const list: AccessListType = [];
		expect(keysFor(list, addr1)).toBeUndefined();
	});

	it("returns undefined when address not in list", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		expect(keysFor(list, addr2)).toBeUndefined();
	});

	it("returns empty array when address has no keys", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		const keys = keysFor(list, addr1);
		expect(keys).toBeDefined();
		expect(keys?.length).toBe(0);
	});

	it("returns storage keys for address", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
		];
		const keys = keysFor(list, addr1);
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
		const list: AccessListType = [];
		const result = deduplicate(list);
		expect(result.length).toBe(0);
	});

	it("returns same list when no duplicates", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: addr2, storageKeys: [key2] },
		];
		const result = deduplicate(list);
		expect(result.length).toBe(2);
	});

	it("merges duplicate addresses", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: addr1, storageKeys: [key2] },
		];
		const result = deduplicate(list);
		expect(result.length).toBe(1);
		expect(result[0]!.address).toBe(addr1);
		expect(result[0]!.storageKeys.length).toBe(2);
	});

	it("removes duplicate storage keys", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
			{ address: addr1, storageKeys: [key2, key3] },
		];
		const result = deduplicate(list);
		expect(result.length).toBe(1);
		expect(result[0]!.storageKeys.length).toBe(3);
	});

	it("handles complex deduplication", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: addr2, storageKeys: [key2] },
			{ address: addr1, storageKeys: [key1, key3] },
			{ address: addr2, storageKeys: [key2] },
		];
		const result = deduplicate(list);
		expect(result.length).toBe(2);
		// addr1 should have key1 and key3
		const addr1Item = result.find((item: Item) =>
			Array.from(item.address).every((b, i) => b === addr1[i]),
		);
		expect(addr1Item?.storageKeys.length).toBe(2);
	});
});

describe("AccessList.withAddress", () => {
	it("adds address to empty list", () => {
		const list: AccessListType = [];
		const result = withAddress(list, addr1);
		expect(result.length).toBe(1);
		expect(result[0]!.address).toBe(addr1);
		expect(result[0]!.storageKeys.length).toBe(0);
	});

	it("adds new address to existing list", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		const result = withAddress(list, addr2);
		expect(result.length).toBe(2);
	});

	it("returns original list when address already exists", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const result = withAddress(list, addr1);
		expect(result).toBe(list);
	});

	it("does not modify original list", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		const result = withAddress(list, addr2);
		expect(list.length).toBe(1);
		expect(result.length).toBe(2);
	});
});

describe("AccessList.withStorageKey", () => {
	it("adds address and key to empty list", () => {
		const list: AccessListType = [];
		const result = withStorageKey(list, addr1, key1);
		expect(result.length).toBe(1);
		expect(result[0]!.address).toBe(addr1);
		expect(result[0]!.storageKeys.length).toBe(1);
		expect(result[0]!.storageKeys[0]).toBe(key1);
	});

	it("adds key to existing address", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const result = withStorageKey(list, addr1, key2);
		expect(result.length).toBe(1);
		expect(result[0]!.storageKeys.length).toBe(2);
	});

	it("does not add duplicate key", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const result = withStorageKey(list, addr1, key1);
		expect(result.length).toBe(1);
		expect(result[0]!.storageKeys.length).toBe(1);
	});

	it("adds address with key when address does not exist", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		const result = withStorageKey(list, addr2, key1);
		expect(result.length).toBe(2);
	});

	it("does not modify original list", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const result = withStorageKey(list, addr1, key2);
		expect(list[0]!.storageKeys.length).toBe(1);
		expect(result[0]!.storageKeys.length).toBe(2);
	});
});

describe("AccessList.merge", () => {
	it("returns empty list for no inputs", () => {
		const result = merge();
		expect(result.length).toBe(0);
	});

	it("returns same list for single input", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const result = merge(list);
		expect(result.length).toBe(1);
	});

	it("merges two lists", () => {
		const list1: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const list2: AccessListType = [{ address: addr2, storageKeys: [key2] }];
		const result = merge(list1, list2);
		expect(result.length).toBe(2);
	});

	it("deduplicates merged lists", () => {
		const list1: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const list2: AccessListType = [{ address: addr1, storageKeys: [key2] }];
		const result = merge(list1, list2);
		expect(result.length).toBe(1);
		expect(result[0]!.storageKeys.length).toBe(2);
	});

	it("merges multiple lists", () => {
		const list1: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const list2: AccessListType = [{ address: addr2, storageKeys: [key2] }];
		const list3: AccessListType = [{ address: addr3, storageKeys: [key3] }];
		const result = merge(list1, list2, list3);
		expect(result.length).toBe(3);
	});
});

// ============================================================================
// Validation Tests
// ============================================================================

describe("AccessList.assertValid", () => {
	it("does not throw for empty list", () => {
		const list: AccessListType = [];
		expect(() => assertValid(list)).not.toThrow();
	});

	it("does not throw for valid list", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: addr2, storageKeys: [key2, key3] },
		];
		expect(() => assertValid(list)).not.toThrow();
	});

	it("throws for non-array", () => {
		expect(() => assertValid({} as any)).toThrow(
			"Access list must be an array",
		);
	});

	it("throws for invalid item", () => {
		const list = [{ address: "invalid", storageKeys: [] }] as any;
		expect(() => assertValid(list)).toThrow(
			"Invalid access list item",
		);
	});

	it("throws for invalid address length", () => {
		const list = [{ address: new Uint8Array(19), storageKeys: [] }] as any;
		expect(() => assertValid(list)).toThrow(
			"Invalid access list item",
		);
	});

	it("throws for non-Uint8Array address", () => {
		const list = [{ address: [1, 2, 3], storageKeys: [] }] as any;
		expect(() => assertValid(list)).toThrow(
			"Invalid access list item",
		);
	});

	it("throws for invalid storage key length", () => {
		const list = [{ address: addr1, storageKeys: [new Uint8Array(31)] }] as any;
		expect(() => assertValid(list)).toThrow(
			"Invalid access list item",
		);
	});
});

// ============================================================================
// Encoding/Decoding Tests
// ============================================================================

describe("AccessList.toBytes", () => {
	it("encodes empty list", () => {
		const list: AccessListType = [];
		const encoded = toBytes(list);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes list with single item", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const encoded = toBytes(list);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});
});

describe("AccessList.fromBytes", () => {
	it("decodes empty list", () => {
		const list: AccessListType = [];
		const encoded = toBytes(list);
		const decoded = fromBytes(encoded);
		expect(decoded.length).toBe(0);
	});

	it("roundtrip encodes and decodes", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
			{ address: addr2, storageKeys: [key3] },
		];
		const encoded = toBytes(list);
		const decoded = fromBytes(encoded);
		expect(decoded.length).toBe(2);
		expect(decoded[0]!.address).toEqual(addr1);
		expect(decoded[0]!.storageKeys.length).toBe(2);
	});
});

// ============================================================================
// Utility Operation Tests
// ============================================================================

describe("AccessList.addressCount", () => {
	it("returns 0 for empty list", () => {
		const list: AccessListType = [];
		expect(addressCount(list)).toBe(0);
	});

	it("returns correct count for list", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [] },
			{ address: addr2, storageKeys: [] },
			{ address: addr3, storageKeys: [] },
		];
		expect(addressCount(list)).toBe(3);
	});
});

describe("AccessList.storageKeyCount", () => {
	it("returns 0 for empty list", () => {
		const list: AccessListType = [];
		expect(storageKeyCount(list)).toBe(0);
	});

	it("returns 0 when no storage keys", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		expect(storageKeyCount(list)).toBe(0);
	});

	it("returns correct count for single address", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2, key3] },
		];
		expect(storageKeyCount(list)).toBe(3);
	});

	it("returns correct total count for multiple addresses", () => {
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: addr2, storageKeys: [key2, key3] },
		];
		expect(storageKeyCount(list)).toBe(3);
	});
});

describe("AccessList.isEmpty", () => {
	it("returns true for empty list", () => {
		const list: AccessListType = [];
		expect(isEmpty(list)).toBe(true);
	});

	it("returns false for non-empty list", () => {
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];
		expect(isEmpty(list)).toBe(false);
	});
});

describe("AccessList.create", () => {
	it("creates empty access list", () => {
		const list = create();
		expect(Array.isArray(list)).toBe(true);
		expect(list.length).toBe(0);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("AccessList edge cases", () => {
	it("handles large lists efficiently", () => {
		const items: Item[] = [];
		for (let i = 0; i < 100; i++) {
			items.push({
				address: createAddress(i % 20),
				storageKeys: [createStorageKey(i), createStorageKey(i + 1)],
			});
		}
		const list: AccessListType = items;

		expect(addressCount(list)).toBe(100);
		expect(storageKeyCount(list)).toBe(200);

		const deduped = deduplicate(list);
		expect(deduped.length).toBeLessThan(100);
	});

	it("handles multiple operations chained", () => {
		const list: AccessListType = [];
		const step1 = withAddress(list, addr1);
		const step2 = withStorageKey(step1, addr1, key1);
		const step3 = withAddress(step2, addr2);
		const step4 = withStorageKey(step3, addr2, key2);

		expect(step4.length).toBe(2);
		expect(storageKeyCount(step4)).toBe(2);
	});

	it("maintains immutability through transformations", () => {
		const original: AccessListType = [{ address: addr1, storageKeys: [key1] }];
		const modified = withStorageKey(original, addr1, key2);

		expect(original[0]!.storageKeys.length).toBe(1);
		expect(modified[0]!.storageKeys.length).toBe(2);
	});

	it("handles identical addresses correctly", () => {
		const sameAddr = createAddress(1);
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: sameAddr, storageKeys: [key2] },
		];

		const deduped = deduplicate(list);
		expect(deduped.length).toBe(1);
		expect(deduped[0]!.storageKeys.length).toBe(2);
	});

	it("handles identical storage keys correctly", () => {
		const sameKey = createStorageKey(10);
		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, sameKey] },
		];

		const result = withStorageKey(list, addr1, sameKey);
		expect(result[0]!.storageKeys.length).toBe(2);
	});
});
