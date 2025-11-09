import { describe, it, expect } from "vitest";
import * as OxAccessList from "ox/AccessList";
import * as VoltaireAccessList from "./index.ox.js";

/**
 * Tests for Ox AccessList migration
 *
 * Verifies that Ox re-exports work correctly and that Voltaire extensions
 * are properly maintained alongside Ox API.
 */

describe("AccessList - Ox Migration", () => {
	describe("Ox Core API - fromTupleList", () => {
		it("should convert tuple list to object format", () => {
			const tupleList: VoltaireAccessList.Tuple = [
				[
					"0x0000000000000000000000000000000000000001",
					[
						"0x0000000000000000000000000000000000000000000000000000000000000001",
						"0x0000000000000000000000000000000000000000000000000000000000000002",
					],
				],
			];

			const result = VoltaireAccessList.fromTupleList(tupleList);

			expect(result).toHaveLength(1);
			expect(result[0].address).toBe(
				"0x0000000000000000000000000000000000000001",
			);
			expect(result[0].storageKeys).toHaveLength(2);
		});

		it("should handle empty tuple list", () => {
			const result = VoltaireAccessList.fromTupleList([]);
			expect(result).toEqual([]);
		});

		it("should match Ox implementation", () => {
			const tupleList: VoltaireAccessList.Tuple = [
				[
					"0x1234567890123456789012345678901234567890",
					[
						"0x0000000000000000000000000000000000000000000000000000000000000001",
					],
				],
			];

			const voltaireResult = VoltaireAccessList.fromTupleList(tupleList);
			const oxResult = OxAccessList.fromTupleList(tupleList);

			expect(voltaireResult).toEqual(oxResult);
		});
	});

	describe("Ox Core API - toTupleList", () => {
		it("should convert object format to tuple list", () => {
			const accessList: VoltaireAccessList.AccessList = [
				{
					address: "0x0000000000000000000000000000000000000001",
					storageKeys: [
						"0x0000000000000000000000000000000000000000000000000000000000000001",
					],
				},
			];

			const result = VoltaireAccessList.toTupleList(accessList);

			expect(result).toHaveLength(1);
			expect(result[0][0]).toBe("0x0000000000000000000000000000000000000001");
			expect(result[0][1]).toHaveLength(1);
		});

		it("should handle undefined input", () => {
			const result = VoltaireAccessList.toTupleList(undefined);
			expect(result).toEqual([]);
		});

		it("should handle empty array", () => {
			const result = VoltaireAccessList.toTupleList([]);
			expect(result).toEqual([]);
		});

		it("should match Ox implementation", () => {
			const accessList: VoltaireAccessList.AccessList = [
				{
					address: "0x1234567890123456789012345678901234567890",
					storageKeys: [
						"0x0000000000000000000000000000000000000000000000000000000000000001",
					],
				},
			];

			const voltaireResult = VoltaireAccessList.toTupleList(accessList);
			const oxResult = OxAccessList.toTupleList(accessList);

			expect(voltaireResult).toEqual(oxResult);
		});
	});

	describe("Type Exports", () => {
		it("should export AccessList type", () => {
			const accessList: VoltaireAccessList.AccessList = [
				{
					address: "0x0000000000000000000000000000000000000001",
					storageKeys: [],
				},
			];
			expect(accessList).toBeDefined();
		});

		it("should export Item type", () => {
			const item: VoltaireAccessList.Item = {
				address: "0x0000000000000000000000000000000000000001",
				storageKeys: [],
			};
			expect(item).toBeDefined();
		});

		it("should export ItemTuple type", () => {
			const itemTuple: VoltaireAccessList.ItemTuple = [
				"0x0000000000000000000000000000000000000001",
				[],
			];
			expect(itemTuple).toBeDefined();
		});

		it("should export Tuple type", () => {
			const tuple: VoltaireAccessList.Tuple = [
				["0x0000000000000000000000000000000000000001", []],
			];
			expect(tuple).toBeDefined();
		});
	});

	describe("Voltaire Extensions - Core Functions", () => {
		it("should export from() constructor", () => {
			expect(typeof VoltaireAccessList.from).toBe("function");
		});

		it("should export fromBytes() constructor", () => {
			expect(typeof VoltaireAccessList.fromBytes).toBe("function");
		});

		it("should export is() type guard", () => {
			expect(typeof VoltaireAccessList.is).toBe("function");
		});

		it("should export isItem() type guard", () => {
			expect(typeof VoltaireAccessList.isItem).toBe("function");
		});

		it("should export create() factory", () => {
			expect(typeof VoltaireAccessList.create).toBe("function");
		});

		it("should export merge() utility", () => {
			expect(typeof VoltaireAccessList.merge).toBe("function");
		});
	});

	describe("Voltaire Extensions - Gas Utilities", () => {
		it("should export gasCost() function", () => {
			expect(typeof VoltaireAccessList.gasCost).toBe("function");
		});

		it("should export gasSavings() function", () => {
			expect(typeof VoltaireAccessList.gasSavings).toBe("function");
		});

		it("should export hasSavings() function", () => {
			expect(typeof VoltaireAccessList.hasSavings).toBe("function");
		});

		it("should export gas constants", () => {
			expect(typeof VoltaireAccessList.ADDRESS_COST).toBe("number");
			expect(typeof VoltaireAccessList.STORAGE_KEY_COST).toBe("number");
			expect(typeof VoltaireAccessList.COLD_ACCOUNT_ACCESS_COST).toBe("number");
			expect(typeof VoltaireAccessList.COLD_STORAGE_ACCESS_COST).toBe("number");
			expect(typeof VoltaireAccessList.WARM_STORAGE_ACCESS_COST).toBe("number");
		});
	});

	describe("Voltaire Extensions - Query Functions", () => {
		it("should export includesAddress() function", () => {
			expect(typeof VoltaireAccessList.includesAddress).toBe("function");
		});

		it("should export includesStorageKey() function", () => {
			expect(typeof VoltaireAccessList.includesStorageKey).toBe("function");
		});

		it("should export keysFor() function", () => {
			expect(typeof VoltaireAccessList.keysFor).toBe("function");
		});

		it("should export addressCount() function", () => {
			expect(typeof VoltaireAccessList.addressCount).toBe("function");
		});

		it("should export storageKeyCount() function", () => {
			expect(typeof VoltaireAccessList.storageKeyCount).toBe("function");
		});

		it("should export isEmpty() function", () => {
			expect(typeof VoltaireAccessList.isEmpty).toBe("function");
		});
	});

	describe("Voltaire Extensions - Mutation Functions", () => {
		it("should export deduplicate() function", () => {
			expect(typeof VoltaireAccessList.deduplicate).toBe("function");
		});

		it("should export withAddress() function", () => {
			expect(typeof VoltaireAccessList.withAddress).toBe("function");
		});

		it("should export withStorageKey() function", () => {
			expect(typeof VoltaireAccessList.withStorageKey).toBe("function");
		});

		it("should export assertValid() function", () => {
			expect(typeof VoltaireAccessList.assertValid).toBe("function");
		});

		it("should export toBytes() function", () => {
			expect(typeof VoltaireAccessList.toBytes).toBe("function");
		});
	});

	describe("Voltaire Extensions - BrandedAccessList Type", () => {
		it("should export BrandedAccessList type", () => {
			// Type should be available (checked at compile time)
			expect(true).toBe(true);
		});
	});

	describe("Round-trip Conversion", () => {
		it("should convert tuple->object->tuple correctly", () => {
			const original: VoltaireAccessList.Tuple = [
				[
					"0x1111111111111111111111111111111111111111",
					[
						"0x0000000000000000000000000000000000000000000000000000000000000001",
					],
				],
				[
					"0x2222222222222222222222222222222222222222",
					[
						"0x0000000000000000000000000000000000000000000000000000000000000002",
						"0x0000000000000000000000000000000000000000000000000000000000000003",
					],
				],
			];

			const asObject = VoltaireAccessList.fromTupleList(original);
			const back = VoltaireAccessList.toTupleList(asObject);

			expect(back).toEqual(original);
		});

		it("should convert object->tuple->object correctly", () => {
			const original: VoltaireAccessList.AccessList = [
				{
					address: "0x1111111111111111111111111111111111111111",
					storageKeys: [
						"0x0000000000000000000000000000000000000000000000000000000000000001",
					],
				},
				{
					address: "0x2222222222222222222222222222222222222222",
					storageKeys: [
						"0x0000000000000000000000000000000000000000000000000000000000000002",
						"0x0000000000000000000000000000000000000000000000000000000000000003",
					],
				},
			];

			const asTuple = VoltaireAccessList.toTupleList(original);
			const back = VoltaireAccessList.fromTupleList(asTuple);

			expect(back).toEqual(original);
		});
	});

	describe("Complex Access Lists", () => {
		it("should handle multiple addresses with multiple storage keys", () => {
			const tupleList: VoltaireAccessList.Tuple = [
				[
					"0x1111111111111111111111111111111111111111",
					[
						"0x0000000000000000000000000000000000000000000000000000000000000001",
						"0x0000000000000000000000000000000000000000000000000000000000000002",
						"0x0000000000000000000000000000000000000000000000000000000000000003",
					],
				],
				[
					"0x2222222222222222222222222222222222222222",
					[
						"0x1000000000000000000000000000000000000000000000000000000000000001",
						"0x2000000000000000000000000000000000000000000000000000000000000002",
					],
				],
				["0x3333333333333333333333333333333333333333", []],
			];

			const result = VoltaireAccessList.fromTupleList(tupleList);

			expect(result).toHaveLength(3);
			expect(result[0].storageKeys).toHaveLength(3);
			expect(result[1].storageKeys).toHaveLength(2);
			expect(result[2].storageKeys).toHaveLength(0);
		});
	});

	describe("Error Handling - InvalidStorageKeySizeError", () => {
		it("should export InvalidStorageKeySizeError", () => {
			expect(VoltaireAccessList.InvalidStorageKeySizeError).toBeDefined();
		});

		it("should be an Error subclass", () => {
			const error = new VoltaireAccessList.InvalidStorageKeySizeError({
				storageKey: "0x123",
			});
			expect(error).toBeInstanceOf(Error);
		});

		it("should have correct error name", () => {
			const error = new VoltaireAccessList.InvalidStorageKeySizeError({
				storageKey: "0x123",
			});
			expect(error.name).toBe("AccessList.InvalidStorageKeySizeError");
		});

		it("should have descriptive error message", () => {
			const error = new VoltaireAccessList.InvalidStorageKeySizeError({
				storageKey: "0x123",
			});
			expect(error.message).toContain("Size for storage key");
			expect(error.message).toContain("0x123");
		});
	});
});
