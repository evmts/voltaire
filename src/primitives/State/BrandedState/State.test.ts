/**
 * Tests for State module - Storage keys and state constants
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedStorageKey } from "./BrandedStorageKey.js";
import { EMPTY_CODE_HASH, EMPTY_TRIE_ROOT } from "./constants.js";
import * as StorageKey from "./index.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createAddress(byte: number): BrandedAddress {
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as BrandedAddress;
}

const addr1 = createAddress(0x01);
const addr2 = createAddress(0x02);
const addr3 = createAddress(0x03);
const zeroAddr = createAddress(0x00);
const maxAddr = createAddress(0xff);

// ============================================================================
// Constants Tests
// ============================================================================

describe("EMPTY_CODE_HASH", () => {
	it("has correct length", () => {
		expect(EMPTY_CODE_HASH.length).toBe(32);
	});

	it("is a Uint8Array", () => {
		expect(EMPTY_CODE_HASH).toBeInstanceOf(Uint8Array);
	});

	it("matches known Keccak256 of empty bytes", () => {
		// Known value: Keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
		const expected = new Uint8Array([
			0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c, 0x92, 0x7e, 0x7d, 0xb2,
			0xdc, 0xc7, 0x03, 0xc0, 0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
			0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
		]);
		expect(Array.from(EMPTY_CODE_HASH)).toEqual(Array.from(expected));
	});

	it("is immutable constant", () => {
		const original = Array.from(EMPTY_CODE_HASH);
		// Note: In JavaScript, Uint8Arrays are mutable even if const
		// This test just verifies the initial value is correct
		expect(EMPTY_CODE_HASH[0]).toBe(0xc5);
		expect(original[0]).toBe(0xc5);
	});
});

describe("EMPTY_TRIE_ROOT", () => {
	it("has correct length", () => {
		expect(EMPTY_TRIE_ROOT.length).toBe(32);
	});

	it("is a Uint8Array", () => {
		expect(EMPTY_TRIE_ROOT).toBeInstanceOf(Uint8Array);
	});

	it("matches known Keccak256 of RLP(null)", () => {
		// Known value: Keccak256(0x80) = 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
		const expected = new Uint8Array([
			0x56, 0xe8, 0x1f, 0x17, 0x1b, 0xcc, 0x55, 0xa6, 0xff, 0x83, 0x45, 0xe6,
			0x92, 0xc0, 0xf8, 0x6e, 0x5b, 0x48, 0xe0, 0x1b, 0x99, 0x6c, 0xad, 0xc0,
			0x01, 0x62, 0x2f, 0xb5, 0xe3, 0x63, 0xb4, 0x21,
		]);
		expect(Array.from(EMPTY_TRIE_ROOT)).toEqual(Array.from(expected));
	});

	it("differs from EMPTY_CODE_HASH", () => {
		expect(Array.from(EMPTY_TRIE_ROOT)).not.toEqual(
			Array.from(EMPTY_CODE_HASH),
		);
	});
});

// ============================================================================
// StorageKey Type Guard Tests
// ============================================================================

describe("StorageKey.is", () => {
	it("returns true for valid storage key", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 0n };
		expect(StorageKey.is(key)).toBe(true);
	});

	it("returns true for key with large slot", () => {
		const key: BrandedStorageKey = {
			address: addr1,
			slot: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		};
		expect(StorageKey.is(key)).toBe(true);
	});

	it("returns false for null", () => {
		expect(StorageKey.is(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(StorageKey.is(undefined)).toBe(false);
	});

	it("returns false for non-object", () => {
		expect(StorageKey.is(42)).toBe(false);
		expect(StorageKey.is("string")).toBe(false);
		expect(StorageKey.is(true)).toBe(false);
	});

	it("returns false for object without address", () => {
		expect(StorageKey.is({ slot: 0n })).toBe(false);
	});

	it("returns false for object without slot", () => {
		expect(StorageKey.is({ address: addr1 })).toBe(false);
	});

	it("returns false for object with invalid address type", () => {
		expect(StorageKey.is({ address: "0x123", slot: 0n })).toBe(false);
	});

	it("returns false for object with invalid address length", () => {
		const shortAddr = new Uint8Array(19);
		expect(StorageKey.is({ address: shortAddr, slot: 0n })).toBe(false);
	});

	it("returns false for object with invalid slot type", () => {
		expect(StorageKey.is({ address: addr1, slot: 42 })).toBe(false);
		expect(StorageKey.is({ address: addr1, slot: "42" })).toBe(false);
	});

	it("returns false for array", () => {
		expect(StorageKey.is([addr1, 0n])).toBe(false);
	});
});

// ============================================================================
// StorageKey Creation Tests
// ============================================================================

describe("StorageKey.create", () => {
	it("creates a valid storage key", () => {
		const key = StorageKey.create(addr1, 0n);
		expect(key.address).toBe(addr1);
		expect(key.slot).toBe(0n);
	});

	it("creates key with zero slot", () => {
		const key = StorageKey.create(addr1, 0n);
		expect(key.slot).toBe(0n);
	});

	it("creates key with large slot", () => {
		const largeSlot =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const key = StorageKey.create(addr1, largeSlot);
		expect(key.slot).toBe(largeSlot);
	});

	it("creates key with zero address", () => {
		const key = StorageKey.create(zeroAddr, 42n);
		expect(key.address).toBe(zeroAddr);
	});

	it("creates key with max address", () => {
		const key = StorageKey.create(maxAddr, 42n);
		expect(key.address).toBe(maxAddr);
	});

	it("creates multiple independent keys", () => {
		const key1 = StorageKey.create(addr1, 1n);
		const key2 = StorageKey.create(addr2, 2n);
		expect(key1.address).not.toBe(key2.address);
		expect(key1.slot).not.toBe(key2.slot);
	});
});

// ============================================================================
// StorageKey Equality Tests
// ============================================================================

describe("StorageKey.equals", () => {
	it("returns true for identical keys", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr1, slot: 42n };
		expect(StorageKey.equals(key1, key2)).toBe(true);
	});

	it("returns true for same reference", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 42n };
		expect(StorageKey.equals(key, key)).toBe(true);
	});

	it("returns false for different slots", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr1, slot: 43n };
		expect(StorageKey.equals(key1, key2)).toBe(false);
	});

	it("returns false for different addresses", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr2, slot: 42n };
		expect(StorageKey.equals(key1, key2)).toBe(false);
	});

	it("returns false for different addresses and slots", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr2, slot: 43n };
		expect(StorageKey.equals(key1, key2)).toBe(false);
	});

	it("handles zero values correctly", () => {
		const key1: BrandedStorageKey = { address: zeroAddr, slot: 0n };
		const key2: BrandedStorageKey = { address: zeroAddr, slot: 0n };
		expect(StorageKey.equals(key1, key2)).toBe(true);
	});

	it("handles maximum slot values", () => {
		const maxSlot =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const key1: BrandedStorageKey = { address: addr1, slot: maxSlot };
		const key2: BrandedStorageKey = { address: addr1, slot: maxSlot };
		expect(StorageKey.equals(key1, key2)).toBe(true);
	});

	it("detects single byte difference in address", () => {
		const addr1Copy = new Uint8Array(addr1);
		const addr1Diff = new Uint8Array(addr1);
		addr1Diff[19]! = addr1[19]! + 1;
		const key1: BrandedStorageKey = {
			address: addr1Copy as BrandedAddress,
			slot: 0n,
		};
		const key2: BrandedStorageKey = {
			address: addr1Diff as BrandedAddress,
			slot: 0n,
		};
		expect(StorageKey.equals(key1, key2)).toBe(false);
	});

	it("works with from conversion", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr1, slot: 42n };
		expect(StorageKey.equals(key1, key2)).toBe(true);
	});
});

// ============================================================================
// StorageKey String Conversion Tests
// ============================================================================

describe("StorageKey.toString", () => {
	it("converts key to string", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 0n };
		const str = StorageKey.toString(key);
		expect(typeof str).toBe("string");
		expect(str.length).toBeGreaterThan(0);
	});

	it("produces deterministic output", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 42n };
		const str1 = StorageKey.toString(key);
		const str2 = StorageKey.toString(key);
		expect(str1).toBe(str2);
	});

	it("produces different strings for different keys", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr2, slot: 42n };
		expect(StorageKey.toString(key1)).not.toBe(StorageKey.toString(key2));
	});

	it("produces different strings for different slots", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr1, slot: 43n };
		expect(StorageKey.toString(key1)).not.toBe(StorageKey.toString(key2));
	});

	it("handles zero slot", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 0n };
		const str = StorageKey.toString(key);
		expect(str).toContain("_");
		expect(str).toMatch(/^[0-9a-f]+_[0-9a-f]+$/);
	});

	it("handles large slot values", () => {
		const key: BrandedStorageKey = {
			address: addr1,
			slot: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		};
		const str = StorageKey.toString(key);
		expect(str).toContain("_");
	});

	it("contains underscore separator", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 42n };
		const str = StorageKey.toString(key);
		expect(str).toContain("_");
		expect(str.split("_").length).toBe(2);
	});

	it("works consistently", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 42n };
		const str1 = StorageKey.toString(key);
		const str2 = StorageKey.toString(key);
		expect(str1).toBe(str2);
	});
});

describe("StorageKey.fromString", () => {
	it("parses valid string back to key", () => {
		const original: BrandedStorageKey = { address: addr1, slot: 42n };
		const str = StorageKey.toString(original);
		const parsed = StorageKey.fromString(str);
		expect(parsed).toBeDefined();
		expect(StorageKey.equals(original, parsed!)).toBe(true);
	});

	it("round-trips correctly", () => {
		const key: BrandedStorageKey = { address: addr2, slot: 12345n };
		const str = StorageKey.toString(key);
		const parsed = StorageKey.fromString(str);
		expect(parsed).toBeDefined();
		expect(parsed!.slot).toBe(key.slot);
		expect(Array.from(parsed!.address)).toEqual(Array.from(key.address));
	});

	it("handles zero slot", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 0n };
		const str = StorageKey.toString(key);
		const parsed = StorageKey.fromString(str);
		expect(parsed).toBeDefined();
		expect(parsed!.slot).toBe(0n);
	});

	it("handles large slot values", () => {
		const largeSlot =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const key: BrandedStorageKey = { address: addr1, slot: largeSlot };
		const str = StorageKey.toString(key);
		const parsed = StorageKey.fromString(str);
		expect(parsed).toBeDefined();
		expect(parsed!.slot).toBe(largeSlot);
	});

	it("returns undefined for invalid string", () => {
		expect(StorageKey.fromString("invalid")).toBeUndefined();
	});

	it("returns undefined for missing separator", () => {
		expect(StorageKey.fromString("0123456789abcdef")).toBeUndefined();
	});

	it("returns undefined for too many separators", () => {
		expect(StorageKey.fromString("01_02_03")).toBeUndefined();
	});

	it("returns undefined for invalid hex", () => {
		expect(
			StorageKey.fromString(
				"ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ_0000000000000000000000000000000000000000000000000000000000000000",
			),
		).toBeUndefined();
	});

	it("returns undefined for wrong address length", () => {
		expect(
			StorageKey.fromString(
				"01020304_0000000000000000000000000000000000000000000000000000000000000000",
			),
		).toBeUndefined();
	});

	it("returns undefined for wrong slot length", () => {
		expect(
			StorageKey.fromString("0101010101010101010101010101010101010101_0102"),
		).toBeUndefined();
	});
});

// ============================================================================
// StorageKey Hash Code Tests
// ============================================================================

describe("StorageKey.hashCode", () => {
	it("produces a number", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 42n };
		const hash = StorageKey.hashCode(key);
		expect(typeof hash).toBe("number");
	});

	it("produces consistent hash for same key", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 42n };
		const hash1 = StorageKey.hashCode(key);
		const hash2 = StorageKey.hashCode(key);
		expect(hash1).toBe(hash2);
	});

	it("produces different hashes for different addresses", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr2, slot: 42n };
		const hash1 = StorageKey.hashCode(key1);
		const hash2 = StorageKey.hashCode(key2);
		expect(hash1).not.toBe(hash2);
	});

	it("produces different hashes for different slots", () => {
		const key1: BrandedStorageKey = { address: addr1, slot: 42n };
		const key2: BrandedStorageKey = { address: addr1, slot: 43n };
		const hash1 = StorageKey.hashCode(key1);
		const hash2 = StorageKey.hashCode(key2);
		expect(hash1).not.toBe(hash2);
	});

	it("handles zero values", () => {
		const key: BrandedStorageKey = { address: zeroAddr, slot: 0n };
		const hash = StorageKey.hashCode(key);
		expect(typeof hash).toBe("number");
	});

	it("handles maximum slot values", () => {
		const maxSlot =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const key: BrandedStorageKey = { address: addr1, slot: maxSlot };
		const hash = StorageKey.hashCode(key);
		expect(typeof hash).toBe("number");
	});

	it("works consistently", () => {
		const key: BrandedStorageKey = { address: addr1, slot: 42n };
		const hash1 = StorageKey.hashCode(key);
		const hash2 = StorageKey.hashCode(key);
		expect(hash1).toBe(hash2);
	});
});

// ============================================================================
// StorageKey Map Usage Tests
// ============================================================================

describe("StorageKey in Map", () => {
	it("can be used as Map key via toString", () => {
		const map = new Map<string, bigint>();
		const key: BrandedStorageKey = { address: addr1, slot: 0n };
		const keyStr = StorageKey.toString(key);
		map.set(keyStr, 100n);
		expect(map.get(keyStr)).toBe(100n);
	});

	it("handles multiple keys in Map", () => {
		const map = new Map<string, bigint>();
		const key1: BrandedStorageKey = { address: addr1, slot: 0n };
		const key2: BrandedStorageKey = { address: addr2, slot: 1n };
		const key3: BrandedStorageKey = { address: addr3, slot: 2n };

		map.set(StorageKey.toString(key1), 100n);
		map.set(StorageKey.toString(key2), 200n);
		map.set(StorageKey.toString(key3), 300n);

		expect(map.get(StorageKey.toString(key1))).toBe(100n);
		expect(map.get(StorageKey.toString(key2))).toBe(200n);
		expect(map.get(StorageKey.toString(key3))).toBe(300n);
	});

	it("distinguishes keys with same address but different slots", () => {
		const map = new Map<string, bigint>();
		const key1: BrandedStorageKey = { address: addr1, slot: 0n };
		const key2: BrandedStorageKey = { address: addr1, slot: 1n };

		map.set(StorageKey.toString(key1), 100n);
		map.set(StorageKey.toString(key2), 200n);

		expect(map.get(StorageKey.toString(key1))).toBe(100n);
		expect(map.get(StorageKey.toString(key2))).toBe(200n);
	});

	it("overwrites value for same key", () => {
		const map = new Map<string, bigint>();
		const key: BrandedStorageKey = { address: addr1, slot: 0n };
		const keyStr = StorageKey.toString(key);

		map.set(keyStr, 100n);
		expect(map.get(keyStr)).toBe(100n);

		map.set(keyStr, 200n);
		expect(map.get(keyStr)).toBe(200n);
	});

	it("supports deletion", () => {
		const map = new Map<string, bigint>();
		const key: BrandedStorageKey = { address: addr1, slot: 0n };
		const keyStr = StorageKey.toString(key);

		map.set(keyStr, 100n);
		expect(map.has(keyStr)).toBe(true);

		map.delete(keyStr);
		expect(map.has(keyStr)).toBe(false);
	});
});

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

describe("StorageKey edge cases", () => {
	it("handles address with all zeros", () => {
		const key: BrandedStorageKey = { address: zeroAddr, slot: 0n };
		expect(StorageKey.is(key)).toBe(true);
		const str = StorageKey.toString(key);
		const parsed = StorageKey.fromString(str);
		expect(parsed).toBeDefined();
		expect(StorageKey.equals(key, parsed!)).toBe(true);
	});

	it("handles address with all 0xFF", () => {
		const key: BrandedStorageKey = { address: maxAddr, slot: 0n };
		expect(StorageKey.is(key)).toBe(true);
		const str = StorageKey.toString(key);
		const parsed = StorageKey.fromString(str);
		expect(parsed).toBeDefined();
		expect(StorageKey.equals(key, parsed!)).toBe(true);
	});

	it("handles slot at boundaries", () => {
		const slots = [0n, 1n, 255n, 256n, 65535n, 65536n];
		for (const slot of slots) {
			const key: BrandedStorageKey = { address: addr1, slot };
			const str = StorageKey.toString(key);
			const parsed = StorageKey.fromString(str);
			expect(parsed).toBeDefined();
			expect(parsed!.slot).toBe(slot);
		}
	});

	it("maintains reference semantics", () => {
		const originalAddr = new Uint8Array(addr1);
		const key: BrandedStorageKey = {
			address: originalAddr as BrandedAddress,
			slot: 42n,
		};
		// In JavaScript, objects are passed by reference
		// Modifying the original array affects the key
		const originalValue = originalAddr[0]!;
		originalAddr[0] = 0xff;
		// Since they share reference, both should be updated
		expect(key.address[0]).toBe(0xff);
		// This demonstrates why you should not mutate addresses after creating keys
		// Reset for other tests
		originalAddr[0] = originalValue;
	});

	it("handles pattern addresses", () => {
		const patternAddr = new Uint8Array([
			0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
			0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14,
		]) as BrandedAddress;
		const key: BrandedStorageKey = { address: patternAddr, slot: 123456789n };
		const str = StorageKey.toString(key);
		const parsed = StorageKey.fromString(str);
		expect(parsed).toBeDefined();
		expect(Array.from(parsed!.address)).toEqual(Array.from(patternAddr));
	});
});

// ============================================================================
// Performance Characteristics Tests
// ============================================================================

describe("StorageKey performance characteristics", () => {
	it("handles large number of unique keys", () => {
		const keys: BrandedStorageKey[] = [];
		for (let i = 0; i < 1000; i++) {
			keys.push({ address: createAddress(i % 256), slot: BigInt(i) });
		}
		expect(keys.length).toBe(1000);

		// All should be valid
		for (const key of keys) {
			expect(StorageKey.is(key)).toBe(true);
		}
	});

	it("handles Map with many keys efficiently", () => {
		const map = new Map<string, bigint>();
		const keys: BrandedStorageKey[] = [];

		// Create 100 keys
		for (let i = 0; i < 100; i++) {
			const key: BrandedStorageKey = {
				address: createAddress(i % 20),
				slot: BigInt(i),
			};
			keys.push(key);
			map.set(StorageKey.toString(key), BigInt(i * 100));
		}

		// Verify all keys can be retrieved
		for (let i = 0; i < 100; i++) {
			const keyStr = StorageKey.toString(keys[i]!);
			expect(map.get(keyStr)).toBe(BigInt(i * 100));
		}
	});
});
