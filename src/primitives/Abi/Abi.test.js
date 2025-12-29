import { describe, expect, it } from "vitest";
import { Abi } from "./Abi.js";

describe("Abi", () => {
	describe("constructor", () => {
		it("creates Abi from empty array", () => {
			const abi = Abi([]);
			expect(abi).toBeInstanceOf(Array);
			expect(abi.length).toBe(0);
		});

		it("creates Abi from function items", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const items = [
				{
					type: "function",
					name: "transfer",
					stateMutability: "nonpayable",
					inputs: [
						{ type: "address", name: "to" },
						{ type: "uint256", name: "amount" },
					],
					outputs: [{ type: "bool" }],
				},
			];
			const abi = Abi(items);
			expect(abi.length).toBe(1);
			expect(/** @type {*} */ (abi[0]).type).toBe("function");
			expect(/** @type {*} */ (abi[0]).name).toBe("transfer");
		});

		it("creates Abi with multiple item types", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const items = [
				{
					type: "function",
					name: "transfer",
					stateMutability: "nonpayable",
					inputs: [],
					outputs: [],
				},
				{
					type: "event",
					name: "Transfer",
					inputs: [],
				},
				{
					type: "error",
					name: "InsufficientBalance",
					inputs: [],
				},
				{
					type: "constructor",
					stateMutability: "nonpayable",
					inputs: [],
				},
			];
			const abi = Abi(items);
			expect(abi.length).toBe(4);
		});

		it("sets correct prototype", () => {
			const abi = Abi([]);
			expect(Object.getPrototypeOf(abi)).toBe(Abi.prototype);
			expect(Object.getPrototypeOf(Object.getPrototypeOf(abi))).toBe(
				Array.prototype,
			);
		});
	});

	describe("Abi.from", () => {
		it("creates Abi from items", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const items = [
				{
					type: "function",
					name: "balanceOf",
					stateMutability: "view",
					inputs: [{ type: "address", name: "account" }],
					outputs: [{ type: "uint256" }],
				},
			];
			const abi = Abi.from(items);
			expect(abi.length).toBe(1);
			expect(abi[0].type).toBe("function");
		});

		it("creates new array instance", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const items = [
				{
					type: "function",
					name: "test",
					stateMutability: "pure",
					inputs: [],
					outputs: [],
				},
			];
			const abi = Abi.from(items);
			expect(abi).not.toBe(items);
		});
	});

	describe("instance methods", () => {
		const testAbi = Abi([
			{
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
			},
			{
				type: "function",
				name: "balanceOf",
				stateMutability: "view",
				inputs: [{ type: "address", name: "account" }],
				outputs: [{ type: "uint256" }],
			},
			{
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value", indexed: false },
				],
			},
			{
				type: "error",
				name: "InsufficientBalance",
				inputs: [
					{ type: "uint256", name: "available" },
					{ type: "uint256", name: "required" },
				],
			},
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "initialSupply" }],
			},
			{
				type: "fallback",
				stateMutability: "payable",
			},
			{
				type: "receive",
				stateMutability: "payable",
			},
		]);

		describe("getItem", () => {
			it("finds function by name", () => {
				const item = testAbi.getItem("transfer", "function");
				expect(item).toBeDefined();
				expect(/** @type {*} */ (item).type).toBe("function");
				expect(/** @type {*} */ (item).name).toBe("transfer");
			});

			it("finds event by name", () => {
				const item = testAbi.getItem("Transfer", "event");
				expect(item).toBeDefined();
				expect(/** @type {*} */ (item).type).toBe("event");
				expect(/** @type {*} */ (item).name).toBe("Transfer");
			});

			it("finds error by name", () => {
				const item = testAbi.getItem("InsufficientBalance", "error");
				expect(item).toBeDefined();
				expect(/** @type {*} */ (item).type).toBe("error");
				expect(/** @type {*} */ (item).name).toBe("InsufficientBalance");
			});

			it("returns undefined for missing item", () => {
				const item = testAbi.getItem("missing", "function");
				expect(item).toBeUndefined();
			});

			it("finds item by name without type filter", () => {
				const item = testAbi.getItem("transfer", "function");
				expect(item).toBeDefined();
				expect(/** @type {*} */ (item).name).toBe("transfer");
			});
		});

		describe("getFunction", () => {
			it("finds function by name", () => {
				const func = testAbi.getFunction("transfer");
				expect(func).toBeDefined();
				expect(/** @type {*} */ (func).type).toBe("function");
				expect(/** @type {*} */ (func).name).toBe("transfer");
			});

			it("returns undefined for missing function", () => {
				const func = testAbi.getFunction("missing");
				expect(func).toBeUndefined();
			});
		});

		describe("getEvent", () => {
			it("finds event by name", () => {
				const event = testAbi.getEvent("Transfer");
				expect(event).toBeDefined();
				expect(/** @type {*} */ (event).type).toBe("event");
				expect(/** @type {*} */ (event).name).toBe("Transfer");
			});

			it("returns undefined for missing event", () => {
				const event = testAbi.getEvent("missing");
				expect(event).toBeUndefined();
			});
		});

		describe("getError", () => {
			it("finds error by name", () => {
				const error = testAbi.getError("InsufficientBalance");
				expect(error).toBeDefined();
				expect(/** @type {*} */ (error).type).toBe("error");
				expect(/** @type {*} */ (error).name).toBe("InsufficientBalance");
			});

			it("returns undefined for missing error", () => {
				const error = testAbi.getError("missing");
				expect(error).toBeUndefined();
			});
		});

		describe("getConstructor", () => {
			it("finds constructor", () => {
				const ctor = testAbi.getConstructor();
				expect(ctor).toBeDefined();
				expect(/** @type {*} */ (ctor).type).toBe("constructor");
			});

			it("returns undefined when no constructor", () => {
				const abi = Abi([
					{
						type: "function",
						name: "test",
						stateMutability: "pure",
						inputs: [],
						outputs: [],
					},
				]);
				const ctor = abi.getConstructor();
				expect(ctor).toBeUndefined();
			});
		});

		describe("getFallback", () => {
			it("finds fallback", () => {
				const fallback = testAbi.getFallback();
				expect(fallback).toBeDefined();
				expect(fallback.type).toBe("fallback");
			});

			it("returns undefined when no fallback", () => {
				const abi = Abi([
					{
						type: "function",
						name: "test",
						stateMutability: "pure",
						inputs: [],
						outputs: [],
					},
				]);
				const fallback = abi.getFallback();
				expect(fallback).toBeUndefined();
			});
		});

		describe("getReceive", () => {
			it("finds receive", () => {
				const receive = testAbi.getReceive();
				expect(receive).toBeDefined();
				expect(receive.type).toBe("receive");
			});

			it("returns undefined when no receive", () => {
				const abi = Abi([
					{
						type: "function",
						name: "test",
						stateMutability: "pure",
						inputs: [],
						outputs: [],
					},
				]);
				const receive = abi.getReceive();
				expect(receive).toBeUndefined();
			});
		});

		describe("format", () => {
			it("formats all items", () => {
				const formatted = testAbi.format();
				expect(formatted).toBeInstanceOf(Array);
				expect(formatted.length).toBe(testAbi.length);
				expect(formatted[0]).toContain("transfer");
			});

			it("formats empty abi", () => {
				const abi = Abi([]);
				const formatted = abi.format();
				expect(formatted).toEqual([]);
			});
		});

		describe("toString", () => {
			it("returns string representation", () => {
				const str = testAbi.toString();
				expect(str).toContain("Abi([");
				expect(str).toContain("transfer");
				expect(str).toContain("balanceOf");
			});

			it("handles empty abi", () => {
				const abi = Abi([]);
				const str = abi.toString();
				expect(str).toBe("Abi([])");
			});
		});

		describe("inspect", () => {
			it("provides custom inspect output", () => {
				const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");
				const inspected = /** @type {*} */ (testAbi)[inspectSymbol]();
				expect(inspected).toBe("Abi(7 items)");
			});

			it("shows count for empty abi", () => {
				const abi = Abi([]);
				const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");
				const inspected = /** @type {*} */ (abi)[inspectSymbol]();
				expect(inspected).toBe("Abi(0 items)");
			});
		});
	});

	describe("static methods", () => {
		it("has getItem method", () => {
			expect(typeof Abi.getItem).toBe("function");
		});

		it("has format method", () => {
			expect(typeof Abi.format).toBe("function");
		});

		it("has formatWithArgs method", () => {
			expect(typeof Abi.formatWithArgs).toBe("function");
		});

		it("has encode method", () => {
			expect(typeof Abi.encode).toBe("function");
		});

		it("has decode method", () => {
			expect(typeof Abi.decode).toBe("function");
		});

		it("has decodeData method", () => {
			expect(typeof Abi.decodeData).toBe("function");
		});

		it("has parseLogs method", () => {
			expect(typeof Abi.parseLogs).toBe("function");
		});

		it("has encodeParameters method", () => {
			expect(typeof Abi.encodeParameters).toBe("function");
		});

		it("has decodeParameters method", () => {
			expect(typeof Abi.decodeParameters).toBe("function");
		});
	});

	describe("sub-namespaces", () => {
		it("has Function namespace", () => {
			expect(Abi.Function).toBeDefined();
			expect(typeof Abi.Function).toBe("function");
		});

		it("has Event namespace", () => {
			expect(Abi.Event).toBeDefined();
			expect(typeof Abi.Event).toBe("object");
		});

		it("has Error namespace", () => {
			expect(Abi.Error).toBeDefined();
			expect(typeof Abi.Error).toBe("object");
		});

		it("has Constructor namespace", () => {
			expect(Abi.Constructor).toBeDefined();
		});

		it("has Item namespace", () => {
			expect(Abi.Item).toBeDefined();
		});
	});

	describe("array behavior", () => {
		it("supports array methods", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const items = [
				{
					type: "function",
					name: "a",
					stateMutability: "pure",
					inputs: [],
					outputs: [],
				},
				{
					type: "function",
					name: "b",
					stateMutability: "pure",
					inputs: [],
					outputs: [],
				},
			];
			const abi = Abi(items);
			expect(abi.length).toBe(2);
			expect(/** @type {*} */ (abi[0]).name).toBe("a");
			expect(abi.filter((i) => /** @type {*} */ (i).name === "b").length).toBe(
				1,
			);
		});

		it("supports iteration", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const items = [
				{
					type: "function",
					name: "test",
					stateMutability: "pure",
					inputs: [],
					outputs: [],
				},
			];
			const abi = Abi(items);
			const collected = [];
			for (const item of abi) {
				collected.push(item);
			}
			expect(collected.length).toBe(1);
		});

		it("supports map", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const items = [
				{
					type: "function",
					name: "test",
					stateMutability: "pure",
					inputs: [],
					outputs: [],
				},
			];
			const abi = Abi(items);
			const names = abi.map((i) => /** @type {*} */ (i).name);
			expect(names).toEqual(["test"]);
		});
	});

	describe("edge cases", () => {
		it("handles abi with only special functions", () => {
			const abi = Abi([
				{
					type: "fallback",
					stateMutability: "payable",
				},
				{
					type: "receive",
					stateMutability: "payable",
				},
			]);
			expect(abi.length).toBe(2);
			expect(abi.getFallback()).toBeDefined();
			expect(abi.getReceive()).toBeDefined();
		});

		it("handles abi with overloaded functions", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const items = [
				{
					type: "function",
					name: "transfer",
					stateMutability: "nonpayable",
					inputs: [{ type: "address" }],
					outputs: [],
				},
				{
					type: "function",
					name: "transfer",
					stateMutability: "nonpayable",
					inputs: [{ type: "address" }, { type: "uint256" }],
					outputs: [],
				},
			];
			const abi = Abi(items);
			const func = abi.getFunction("transfer");
			expect(func).toBeDefined();
			expect(/** @type {*} */ (func).inputs.length).toBe(1);
		});

		it("handles items without names", () => {
			const abi = Abi([
				{
					type: "fallback",
					stateMutability: "payable",
				},
			]);
			const formatted = abi.format();
			expect(formatted[0]).toBe("fallback");
		});
	});
});
