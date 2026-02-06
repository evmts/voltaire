/**
 * State Module Benchmarks
 *
 * Measures performance of StorageKey operations and state constants
 */

import { bench, run } from "mitata";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import { EMPTY_CODE_HASH, EMPTY_TRIE_ROOT } from "./constants.js";
import * as StorageKey from "./index.js";
import type { StorageKeyType } from "./StorageKeyType.js";

// ============================================================================
// Test Data
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

const key1: StorageKeyType = { address: addr1, slot: 0n };
const key2: StorageKeyType = { address: addr1, slot: 42n };
const key3: StorageKeyType = { address: addr2, slot: 100n };
const keyLarge: StorageKeyType = {
	address: addr3,
	slot: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
};

const str1 = StorageKey.toString(key1);
const str2 = StorageKey.toString(key2);

// Pre-populate map for get benchmarks
const testMap = new Map<string, bigint>();
for (let i = 0; i < 100; i++) {
	const key: StorageKeyType = {
		address: createAddress(i % 20),
		slot: BigInt(i),
	};
	testMap.set(StorageKey.toString(key), BigInt(i * 100));
}

// ============================================================================
// Benchmarks - Constants
// ============================================================================

bench("Access EMPTY_CODE_HASH - voltaire", () => {
	void EMPTY_CODE_HASH;
});

bench("Access EMPTY_TRIE_ROOT - voltaire", () => {
	void EMPTY_TRIE_ROOT;
});

bench("Read EMPTY_CODE_HASH byte - voltaire", () => {
	void EMPTY_CODE_HASH[0];
});

await run();

// ============================================================================
// Benchmarks - StorageKey Creation
// ============================================================================

bench("StorageKey.create - simple - voltaire", () => {
	StorageKey.create(addr1, 0n);
});

bench("StorageKey.create - with slot - voltaire", () => {
	StorageKey.create(addr1, 42n);
});

bench("StorageKey.create - large slot - voltaire", () => {
	StorageKey.create(
		addr1,
		0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
	);
});

bench("Literal key creation - voltaire", () => {
	void ({ address: addr1, slot: 42n } as StorageKeyType);
});

await run();

// ============================================================================
// Benchmarks - StorageKey Validation
// ============================================================================

bench("StorageKey.is - valid key - voltaire", () => {
	StorageKey.is(key1);
});

bench("StorageKey.is - invalid (null) - voltaire", () => {
	StorageKey.is(null);
});

bench("StorageKey.is - invalid (object) - voltaire", () => {
	StorageKey.is({ foo: "bar" });
});

bench("StorageKey.is - invalid (no slot) - voltaire", () => {
	StorageKey.is({ address: addr1 });
});

await run();

// ============================================================================
// Benchmarks - StorageKey Equality
// ============================================================================

bench("StorageKey.equals - same keys - voltaire", () => {
	StorageKey.equals(key1, key1);
});

bench("StorageKey.equals - equal keys - voltaire", () => {
	const k1: StorageKeyType = { address: addr1, slot: 42n };
	const k2: StorageKeyType = { address: addr1, slot: 42n };
	StorageKey.equals(k1, k2);
});

bench("StorageKey.equals - different slots - voltaire", () => {
	StorageKey.equals(key1, key2);
});

bench("StorageKey.equals - different addresses - voltaire", () => {
	StorageKey.equals(key1, key3);
});

await run();

// ============================================================================
// Benchmarks - StorageKey Serialization
// ============================================================================

bench("StorageKey.toString - zero slot - voltaire", () => {
	StorageKey.toString(key1);
});

bench("StorageKey.toString - small slot - voltaire", () => {
	StorageKey.toString(key2);
});

bench("StorageKey.toString - large slot - voltaire", () => {
	StorageKey.toString(keyLarge);
});

bench("StorageKey.fromString - valid - voltaire", () => {
	StorageKey.fromString(str1);
});

bench("StorageKey.fromString - with slot - voltaire", () => {
	StorageKey.fromString(str2);
});

bench("StorageKey.fromString - invalid - voltaire", () => {
	StorageKey.fromString("invalid");
});

bench("Round-trip: toString + fromString - voltaire", () => {
	const str = StorageKey.toString(key2);
	StorageKey.fromString(str);
});

await run();

// ============================================================================
// Benchmarks - StorageKey Hash
// ============================================================================

bench("StorageKey.hashCode - zero slot - voltaire", () => {
	StorageKey.hashCode(key1);
});

bench("StorageKey.hashCode - small slot - voltaire", () => {
	StorageKey.hashCode(key2);
});

bench("StorageKey.hashCode - large slot - voltaire", () => {
	StorageKey.hashCode(keyLarge);
});

await run();

// ============================================================================
// Benchmarks - Map Operations
// ============================================================================

bench("Map.set with StorageKey - voltaire", () => {
	const map = new Map<string, bigint>();
	const keyStr = StorageKey.toString(key2);
	map.set(keyStr, 100n);
});

bench("Map.get with StorageKey - voltaire", () => {
	const keyStr = StorageKey.toString(key2);
	testMap.get(keyStr);
});

bench("Map.has with StorageKey - voltaire", () => {
	const keyStr = StorageKey.toString(key2);
	testMap.has(keyStr);
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("Create 10 StorageKeys - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		void ({ address: addr1, slot: BigInt(i) } as StorageKeyType);
	}
});

bench("Convert 10 keys to string - voltaire", () => {
	const keys: StorageKeyType[] = [];
	for (let i = 0; i < 10; i++) {
		keys.push({ address: addr1, slot: BigInt(i) });
	}
	for (const key of keys) {
		StorageKey.toString(key);
	}
});

bench("Lookup 10 keys in Map - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		const key: StorageKeyType = { address: addr1, slot: BigInt(i) };
		testMap.get(StorageKey.toString(key));
	}
});

await run();

// ============================================================================
// Benchmarks - Edge Cases
// ============================================================================

bench("Zero address and slot - voltaire", () => {
	const key: StorageKeyType = { address: zeroAddr, slot: 0n };
	StorageKey.toString(key);
});

bench("Max address and slot - voltaire", () => {
	const key: StorageKeyType = {
		address: maxAddr,
		slot: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
	};
	StorageKey.toString(key);
});

bench("Hash collision check - voltaire", () => {
	const hash1 = StorageKey.hashCode(key1);
	const hash2 = StorageKey.hashCode(key2);
	void (hash1 === hash2);
});

await run();
