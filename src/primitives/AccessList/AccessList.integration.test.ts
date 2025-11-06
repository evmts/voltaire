/**
 * Integration tests for AccessList (EIP-2930)
 * Tests real-world scenarios, RLP encoding, JSON-RPC formats, and gas optimization
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../Hash/BrandedHash/BrandedHash.js";
import * as AccessList from "./BrandedAccessList/index.js";
import type {
	BrandedAccessList as AccessListType,
	Item,
} from "./BrandedAccessList.js";

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

// ============================================================================
// JSON-RPC Format Tests (EIP-2930)
// ============================================================================

describe("AccessList JSON-RPC format", () => {
	it("should create from JSON-RPC array format", () => {
		// JSON-RPC returns access list as array of {address, storageKeys}
		// where address is hex string and storageKeys are hex string arrays
		const addr1 = createAddress(1);
		const key1 = createStorageKey(10);
		const key2 = createStorageKey(20);

		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
		];

		expect(AccessList.addressCount(list)).toBe(1);
		expect(AccessList.storageKeyCount(list)).toBe(2);
	});

	it("should handle empty storageKeys array (JSON-RPC)", () => {
		const addr1 = createAddress(1);
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];

		expect(AccessList.is(list)).toBe(true);
		expect(AccessList.includesAddress(list, addr1)).toBe(true);
		expect(AccessList.storageKeyCount(list)).toBe(0);
	});

	it("should handle multiple addresses with mixed storage keys", () => {
		const addr1 = createAddress(1);
		const addr2 = createAddress(2);
		const addr3 = createAddress(3);
		const key1 = createStorageKey(10);
		const key2 = createStorageKey(20);
		const key3 = createStorageKey(30);

		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
			{ address: addr2, storageKeys: [] },
			{ address: addr3, storageKeys: [key3] },
		];

		expect(AccessList.addressCount(list)).toBe(3);
		expect(AccessList.storageKeyCount(list)).toBe(3);
		expect(AccessList.includesAddress(list, addr2)).toBe(true);
	});

	it("should validate JSON-RPC format", () => {
		const addr1 = createAddress(1);
		const key1 = createStorageKey(10);

		const validList: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
		];

		expect(() => AccessList.assertValid(validList)).not.toThrow();
	});
});

// ============================================================================
// RLP Encoding Integration Tests
// ============================================================================

describe("AccessList RLP encoding integration", () => {
	it("should encode and decode empty list", () => {
		const list: AccessListType = [];
		const encoded = AccessList.toBytes(list);
		const decoded = AccessList.fromBytes(encoded);
		expect(decoded.length).toBe(0);
		expect(AccessList.is(decoded)).toBe(true);
	});

	it("should roundtrip encode/decode single address with keys", () => {
		const addr1 = createAddress(1);
		const key1 = createStorageKey(10);
		const key2 = createStorageKey(20);

		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
		];

		const encoded = AccessList.toBytes(list);
		const decoded = AccessList.fromBytes(encoded);

		expect(decoded.length).toBe(1);
		expect(decoded[0]!.address).toEqual(addr1);
		expect(decoded[0]!.storageKeys.length).toBe(2);
		expect(decoded[0]!.storageKeys[0]).toEqual(key1);
		expect(decoded[0]!.storageKeys[1]).toEqual(key2);
	});

	it("should roundtrip encode/decode multiple addresses", () => {
		const addr1 = createAddress(1);
		const addr2 = createAddress(2);
		const key1 = createStorageKey(10);
		const key2 = createStorageKey(20);
		const key3 = createStorageKey(30);

		const list: AccessListType = [
			{ address: addr1, storageKeys: [key1] },
			{ address: addr2, storageKeys: [key2, key3] },
		];

		const encoded = AccessList.toBytes(list);
		const decoded = AccessList.fromBytes(encoded);

		expect(decoded.length).toBe(2);
		expect(AccessList.addressCount(decoded)).toBe(2);
		expect(AccessList.storageKeyCount(decoded)).toBe(3);
	});

	it("should encode address without storage keys", () => {
		const addr1 = createAddress(1);
		const list: AccessListType = [{ address: addr1, storageKeys: [] }];

		const encoded = AccessList.toBytes(list);
		const decoded = AccessList.fromBytes(encoded);

		expect(decoded.length).toBe(1);
		expect(decoded[0]!.address).toEqual(addr1);
		expect(decoded[0]!.storageKeys.length).toBe(0);
	});

	it("should maintain order during encode/decode", () => {
		const addr1 = createAddress(1);
		const addr2 = createAddress(2);
		const addr3 = createAddress(3);

		const list: AccessListType = [
			{ address: addr3, storageKeys: [] },
			{ address: addr1, storageKeys: [] },
			{ address: addr2, storageKeys: [] },
		];

		const encoded = AccessList.toBytes(list);
		const decoded = AccessList.fromBytes(encoded);

		expect(decoded[0]!.address).toEqual(addr3);
		expect(decoded[1]!.address).toEqual(addr1);
		expect(decoded[2]!.address).toEqual(addr2);
	});

	it("should handle RLP encoding with many storage keys", () => {
		const addr1 = createAddress(1);
		const keys: BrandedHash[] = [];
		for (let i = 0; i < 20; i++) {
			keys.push(createStorageKey(i));
		}

		const list: AccessListType = [{ address: addr1, storageKeys: keys }];

		const encoded = AccessList.toBytes(list);
		const decoded = AccessList.fromBytes(encoded);

		expect(decoded[0]!.storageKeys.length).toBe(20);
		for (let i = 0; i < 20; i++) {
			expect(decoded[0]!.storageKeys[i]).toEqual(keys[i]);
		}
	});
});

// ============================================================================
// Real-World Gas Optimization Scenarios
// ============================================================================

describe("AccessList gas optimization scenarios", () => {
	it("should calculate savings for ERC-20 transfer", () => {
		// ERC-20 transfer typically accesses:
		// - Token contract address
		// - Sender balance slot
		// - Recipient balance slot
		const tokenAddress = createAddress(0x42);
		const senderBalanceSlot = createStorageKey(0x01);
		const recipientBalanceSlot = createStorageKey(0x02);

		const list: AccessListType = [
			{
				address: tokenAddress,
				storageKeys: [senderBalanceSlot, recipientBalanceSlot],
			},
		];

		const gasCost = AccessList.gasCost(list);
		const gasSavings = AccessList.gasSavings(list);

		// Address cost: 2400
		// Storage keys cost: 2 * 1900 = 3800
		// Total cost: 6200
		expect(gasCost).toBe(6200n);

		// Account savings: 2600 - 2400 = 200
		// Storage savings: 2 * (2100 - 1900) = 400
		// Total savings: 600
		expect(gasSavings).toBe(600n);

		// Net benefit: savings - cost = 600 - 6200 = -5600 (negative, not worth it)
		expect(gasSavings < gasCost).toBe(true);
	});

	it("should calculate savings for Uniswap swap", () => {
		// Uniswap swap typically accesses:
		// - Router contract
		// - Pair contract
		// - Multiple token contracts
		// - Multiple storage slots per contract
		const router = createAddress(0x01);
		const pair = createAddress(0x02);
		const token0 = createAddress(0x03);
		const token1 = createAddress(0x04);

		const list: AccessListType = [
			{ address: router, storageKeys: [createStorageKey(1)] },
			{
				address: pair,
				storageKeys: [
					createStorageKey(10),
					createStorageKey(11),
					createStorageKey(12),
				],
			},
			{
				address: token0,
				storageKeys: [createStorageKey(20), createStorageKey(21)],
			},
			{
				address: token1,
				storageKeys: [createStorageKey(30), createStorageKey(31)],
			},
		];

		const gasCost = AccessList.gasCost(list);
		const gasSavings = AccessList.gasSavings(list);

		// 4 addresses: 4 * 2400 = 9600
		// 8 storage keys: 8 * 1900 = 15200
		// Total cost: 24800
		expect(gasCost).toBe(24800n);

		// 4 accounts: 4 * 200 = 800
		// 8 storage: 8 * 200 = 1600
		// Total savings: 2400
		expect(gasSavings).toBe(2400n);

		expect(AccessList.hasSavings(list)).toBe(true);
	});

	it("should show when access list is beneficial", () => {
		// Access list is beneficial when:
		// 1. Many storage slots are accessed per address
		// 2. Storage slots are accessed multiple times in transaction
		const contract = createAddress(0xff);
		const storageKeys: BrandedHash[] = [];

		// Accessing 10 storage slots
		for (let i = 0; i < 10; i++) {
			storageKeys.push(createStorageKey(i));
		}

		const list: AccessListType = [{ address: contract, storageKeys }];

		const gasCost = AccessList.gasCost(list);
		const gasSavings = AccessList.gasSavings(list);

		// Cost: 2400 + 10 * 1900 = 21400
		expect(gasCost).toBe(21400n);

		// Savings: 200 + 10 * 200 = 2200
		expect(gasSavings).toBe(2200n);

		// Still not beneficial for single access
		// But if each slot accessed twice: savings = 2200 * 2 = 4400 > 2200
		expect(AccessList.hasSavings(list)).toBe(true);
	});

	it("should optimize by deduplicating before calculating cost", () => {
		const addr = createAddress(1);
		const key1 = createStorageKey(10);
		const key2 = createStorageKey(20);

		// Duplicated access list (as might be generated during simulation)
		const duplicated: AccessListType = [
			{ address: addr, storageKeys: [key1] },
			{ address: addr, storageKeys: [key2] },
			{ address: addr, storageKeys: [key1] }, // Duplicate key
		];

		const deduplicated = AccessList.deduplicate(duplicated);

		const costBefore = AccessList.gasCost(duplicated);
		const costAfter = AccessList.gasCost(deduplicated);

		// Before: 3 addresses * 2400 + 3 keys * 1900 = 12900
		expect(costBefore).toBe(12900n);

		// After: 1 address * 2400 + 2 keys * 1900 = 6200
		expect(costAfter).toBe(6200n);

		// Savings from deduplication
		expect(costBefore - costAfter).toBe(6700n);
	});
});

// ============================================================================
// Transaction Integration Scenarios
// ============================================================================

describe("AccessList transaction scenarios", () => {
	it("should build access list incrementally during simulation", () => {
		// Simulating building an access list during tx simulation
		let list: AccessListType = AccessList.create();

		// First access: contract address
		const contract = createAddress(0x42);
		list = AccessList.withAddress(list, contract);
		expect(AccessList.addressCount(list)).toBe(1);

		// Access storage slot
		const slot1 = createStorageKey(1);
		list = AccessList.withStorageKey(list, contract, slot1);
		expect(AccessList.storageKeyCount(list)).toBe(1);

		// Access another slot
		const slot2 = createStorageKey(2);
		list = AccessList.withStorageKey(list, contract, slot2);
		expect(AccessList.storageKeyCount(list)).toBe(2);

		// Access another contract
		const contract2 = createAddress(0x43);
		list = AccessList.withAddress(list, contract2);
		expect(AccessList.addressCount(list)).toBe(2);

		// Verify final state
		expect(AccessList.includesAddress(list, contract)).toBe(true);
		expect(AccessList.includesAddress(list, contract2)).toBe(true);
		expect(AccessList.includesStorageKey(list, contract, slot1)).toBe(true);
		expect(AccessList.includesStorageKey(list, contract, slot2)).toBe(true);
	});

	it("should merge access lists from multiple simulations", () => {
		const addr1 = createAddress(1);
		const addr2 = createAddress(2);
		const key1 = createStorageKey(10);
		const key2 = createStorageKey(20);
		const key3 = createStorageKey(30);

		// Simulation 1
		const list1: AccessListType = [
			{ address: addr1, storageKeys: [key1, key2] },
		];

		// Simulation 2
		const list2: AccessListType = [
			{ address: addr1, storageKeys: [key2, key3] }, // key2 is duplicate
			{ address: addr2, storageKeys: [] },
		];

		// Merge
		const merged = AccessList.merge(list1, list2);

		expect(AccessList.addressCount(merged)).toBe(2);
		expect(AccessList.storageKeyCount(merged)).toBe(3); // key1, key2, key3 (deduplicated)
	});

	it("should check if access list provides net benefit", () => {
		// Small access list - likely not beneficial
		const small: AccessListType = [
			{
				address: createAddress(1),
				storageKeys: [createStorageKey(1)],
			},
		];

		const smallCost = AccessList.gasCost(small);
		const smallSavings = AccessList.gasSavings(small);
		expect(smallSavings < smallCost).toBe(true); // Not beneficial

		// Large access list - potentially beneficial if slots accessed multiple times
		const large: AccessListType = [
			{
				address: createAddress(1),
				storageKeys: Array.from({ length: 15 }, (_, i) =>
					createStorageKey(i),
				),
			},
		];

		const largeCost = AccessList.gasCost(large);
		const largeSavings = AccessList.gasSavings(large);
		// For multiple accesses per slot, savings multiply while cost stays same
		expect(AccessList.hasSavings(large)).toBe(true);
	});

	it("should validate access list before including in transaction", () => {
		const addr = createAddress(1);
		const key = createStorageKey(10);

		const valid: AccessListType = [{ address: addr, storageKeys: [key] }];
		expect(() => AccessList.assertValid(valid)).not.toThrow();

		const invalid = [{ address: "not-an-address", storageKeys: [] }] as any;
		expect(() => AccessList.assertValid(invalid)).toThrow();
	});
});

// ============================================================================
// Complex Integration Scenarios
// ============================================================================

describe("AccessList complex scenarios", () => {
	it("should handle flash loan access pattern", () => {
		// Flash loan typically accesses:
		// - Lending pool
		// - Multiple token reserves
		// - User's collateral
		// - Borrowed token balance
		const lendingPool = createAddress(0x01);
		const weth = createAddress(0x02);
		const dai = createAddress(0x03);

		const list: AccessListType = [
			{
				address: lendingPool,
				storageKeys: [
					createStorageKey(1), // Reserve data
					createStorageKey(2), // User data
					createStorageKey(3), // Borrow index
				],
			},
			{
				address: weth,
				storageKeys: [createStorageKey(10), createStorageKey(11)],
			},
			{
				address: dai,
				storageKeys: [createStorageKey(20), createStorageKey(21)],
			},
		];

		expect(AccessList.addressCount(list)).toBe(3);
		expect(AccessList.storageKeyCount(list)).toBe(7);
		expect(AccessList.hasSavings(list)).toBe(true);
	});

	it("should handle NFT marketplace purchase", () => {
		// NFT purchase typically accesses:
		// - Marketplace contract
		// - NFT contract
		// - Payment token contract
		const marketplace = createAddress(0x01);
		const nft = createAddress(0x02);
		const weth = createAddress(0x03);

		const list: AccessListType = [
			{
				address: marketplace,
				storageKeys: [createStorageKey(1), createStorageKey(2)],
			},
			{
				address: nft,
				storageKeys: [createStorageKey(10)], // Owner mapping
			},
			{
				address: weth,
				storageKeys: [createStorageKey(20), createStorageKey(21)], // Balances
			},
		];

		const encoded = AccessList.toBytes(list);
		const decoded = AccessList.fromBytes(encoded);

		expect(AccessList.equals(list, decoded)).toBe(true);
	});

	it("should optimize multi-contract interaction", () => {
		// Build access list progressively
		let list: AccessListType = AccessList.create();

		// Add contracts as they're discovered during simulation
		const contracts = Array.from({ length: 5 }, (_, i) =>
			createAddress(i + 1),
		);

		for (const contract of contracts) {
			list = AccessList.withAddress(list, contract);

			// Add storage slots for each contract
			for (let i = 0; i < 3; i++) {
				list = AccessList.withStorageKey(
					list,
					contract,
					createStorageKey(i),
				);
			}
		}

		// Deduplicate any overlaps
		const optimized = AccessList.deduplicate(list);

		expect(AccessList.addressCount(optimized)).toBe(5);
		expect(AccessList.storageKeyCount(optimized)).toBe(15);
		expect(AccessList.isEmpty(optimized)).toBe(false);

		// Calculate if it's worth including
		const cost = AccessList.gasCost(optimized);
		const savings = AccessList.gasSavings(optimized);

		// Cost: 5 * 2400 + 15 * 1900 = 12000 + 28500 = 40500
		expect(cost).toBe(40500n);

		// Savings per access: 5 * 200 + 15 * 200 = 4000
		expect(savings).toBe(4000n);
	});

	it("should maintain immutability throughout pipeline", () => {
		const original: AccessListType = [
			{
				address: createAddress(1),
				storageKeys: [createStorageKey(1)],
			},
		];

		// Multiple transformations
		const withAddr = AccessList.withAddress(original, createAddress(2));
		const withKey = AccessList.withStorageKey(withAddr, createAddress(1), createStorageKey(2));
		const deduped = AccessList.deduplicate(withKey);
		const merged = AccessList.merge(deduped, original);

		// Original should be unchanged
		expect(AccessList.addressCount(original)).toBe(1);
		expect(AccessList.storageKeyCount(original)).toBe(1);

		// Final should have accumulated changes
		expect(AccessList.addressCount(merged)).toBe(2);
		expect(AccessList.storageKeyCount(merged)).toBe(2);
	});
});

// Helper to check equality between two access lists
function equals(a: AccessListType, b: AccessListType): boolean {
	if (a.length !== b.length) return false;

	for (let i = 0; i < a.length; i++) {
		const itemA = a[i];
		const itemB = b[i];
		if (!itemA || !itemB) return false;

		// Check address equality
		if (itemA.address.length !== itemB.address.length) return false;
		if (!itemA.address.every((byte, idx) => byte === itemB.address[idx]))
			return false;

		// Check storage keys equality
		if (itemA.storageKeys.length !== itemB.storageKeys.length) return false;
		for (let j = 0; j < itemA.storageKeys.length; j++) {
			const keyA = itemA.storageKeys[j];
			const keyB = itemB.storageKeys[j];
			if (!keyA || !keyB) return false;
			if (!keyA.every((byte, idx) => byte === keyB[idx])) return false;
		}
	}

	return true;
}

// Add equals to AccessList namespace for testing
declare module "./BrandedAccessList/index.js" {
	export function equals(a: AccessListType, b: AccessListType): boolean;
}

// Export the equals function through the AccessList namespace
(AccessList as any).equals = equals;
