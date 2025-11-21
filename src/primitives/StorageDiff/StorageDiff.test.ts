import { describe, expect, it } from "vitest";
import type { AddressType } from "../Address/AddressType.js";
import type { StorageKeyType } from "../State/StorageKeyType.js";
import type { StorageValueType } from "../StorageValue/StorageValueType.js";
import type { StorageChange } from "./StorageDiffType.js";
import { from, getChange, getKeys, size } from "./index.js";

describe("StorageDiff", () => {
	const mockAddress = new Uint8Array(20) as AddressType;
	const mockValue1 = new Uint8Array(32) as StorageValueType;
	const mockValue2 = new Uint8Array(32) as StorageValueType;
	mockValue1[31] = 1;
	mockValue2[31] = 2;

	const key1: StorageKeyType = { address: mockAddress, slot: 0n };
	const key2: StorageKeyType = { address: mockAddress, slot: 1n };

	describe("from", () => {
		it("creates from address and Map", () => {
			const changes = new Map<StorageKeyType, StorageChange>([
				[key1, { from: null, to: mockValue1 }],
			]);

			const diff = from(mockAddress, changes);

			expect(diff.address).toBe(mockAddress);
			expect(diff.changes).toBe(changes);
		});

		it("creates from address and array", () => {
			const changesArray: Array<[StorageKeyType, StorageChange]> = [
				[key1, { from: mockValue1, to: mockValue2 }],
			];

			const diff = from(mockAddress, changesArray);

			expect(diff.address).toBe(mockAddress);
			expect(diff.changes.size).toBe(1);
			expect(diff.changes.get(key1)).toEqual({
				from: mockValue1,
				to: mockValue2,
			});
		});

		it("creates empty diff", () => {
			const diff = from(mockAddress, new Map());

			expect(diff.address).toBe(mockAddress);
			expect(diff.changes.size).toBe(0);
		});

		it("throws on missing address", () => {
			expect(() => from(null as any, new Map())).toThrow("Address is required");
		});
	});

	describe("getChange", () => {
		it("returns change for existing key", () => {
			const change: StorageChange = { from: null, to: mockValue1 };
			const diff = from(mockAddress, new Map([[key1, change]]));

			const result = getChange(diff, key1);

			expect(result).toEqual(change);
		});

		it("returns undefined for non-existent key", () => {
			const diff = from(
				mockAddress,
				new Map([[key1, { from: null, to: mockValue1 }]]),
			);

			const result = getChange(diff, key2);

			expect(result).toBeUndefined();
		});

		it("matches keys by address and slot", () => {
			const change: StorageChange = { from: mockValue1, to: mockValue2 };
			const diff = from(mockAddress, new Map([[key1, change]]));

			// Create equivalent key (different object instance)
			const equivalentKey: StorageKeyType = {
				address: mockAddress,
				slot: 0n,
			};

			const result = getChange(diff, equivalentKey);

			expect(result).toEqual(change);
		});
	});

	describe("getKeys", () => {
		it("returns all storage keys", () => {
			const diff = from(
				mockAddress,
				new Map([
					[key1, { from: null, to: mockValue1 }],
					[key2, { from: mockValue1, to: mockValue2 }],
				]),
			);

			const keys = getKeys(diff);

			expect(keys).toHaveLength(2);
			expect(keys).toContain(key1);
			expect(keys).toContain(key2);
		});

		it("returns empty array for no changes", () => {
			const diff = from(mockAddress, new Map());

			const keys = getKeys(diff);

			expect(keys).toHaveLength(0);
		});
	});

	describe("size", () => {
		it("returns number of changed slots", () => {
			const diff = from(
				mockAddress,
				new Map([
					[key1, { from: null, to: mockValue1 }],
					[key2, { from: mockValue1, to: mockValue2 }],
				]),
			);

			expect(size(diff)).toBe(2);
		});

		it("returns 0 for no changes", () => {
			const diff = from(mockAddress, new Map());

			expect(size(diff)).toBe(0);
		});
	});
});
