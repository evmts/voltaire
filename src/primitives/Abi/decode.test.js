import { describe, expect, it } from "vitest";
import { AbiItemNotFoundError } from "./Errors.js";
import { decode } from "./decode.js";
import * as Function from "./function/index.js";

describe("decode", () => {
	/** @type {import('./Item/ItemType.js').ItemType[]} */
	const testAbi = [
		{
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [{ type: "address", name: "account" }],
			outputs: [{ type: "uint256", name: "balance" }],
		},
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
			name: "getData",
			stateMutability: "pure",
			inputs: [],
			outputs: [{ type: "uint256" }, { type: "string" }, { type: "bool" }],
		},
	];

	describe("single return value", () => {
		it("decodes uint256 return value", () => {
			const func = /** @type {*} */ (testAbi[0]);
			const returnData = Function.encodeResult(func, [1000n]);
			const decoded = decode.call(testAbi, "balanceOf", returnData);
			expect(decoded).toEqual([1000n]);
		});

		it("decodes bool return value", () => {
			const func = /** @type {*} */ (testAbi[1]);
			const returnData = Function.encodeResult(func, [true]);
			const decoded = decode.call(testAbi, "transfer", returnData);
			expect(decoded).toEqual([true]);
		});

		it("decodes zero value", () => {
			const func = /** @type {*} */ (testAbi[0]);
			const returnData = Function.encodeResult(func, [0n]);
			const decoded = decode.call(testAbi, "balanceOf", returnData);
			expect(decoded).toEqual([0n]);
		});
	});

	describe("multiple return values", () => {
		it("decodes multiple types", () => {
			const func = /** @type {*} */ (testAbi[2]);
			const returnData = Function.encodeResult(func, [42n, "test", true]);
			const decoded = decode.call(testAbi, "getData", returnData);
			expect(decoded).toEqual([42n, "test", true]);
		});

		it("decodes with empty string", () => {
			const func = /** @type {*} */ (testAbi[2]);
			const returnData = Function.encodeResult(func, [0n, "", false]);
			const decoded = decode.call(testAbi, "getData", returnData);
			expect(decoded).toEqual([0n, "", false]);
		});
	});

	describe("empty return values", () => {
		it("decodes function with no outputs", () => {
			const abi = [
				{
					type: "function",
					name: "doSomething",
					stateMutability: "nonpayable",
					inputs: [],
					outputs: [],
				},
			];
			const func = abi[0];
			const returnData = Function.encodeResult(func, []);
			const decoded = decode.call(abi, "doSomething", returnData);
			expect(decoded).toEqual([]);
		});
	});

	describe("error cases", () => {
		it("throws when function not found", () => {
			expect(() => {
				decode.call(testAbi, "nonExistent", new Uint8Array(32));
			}).toThrow(AbiItemNotFoundError);
		});

		it("throws with descriptive message for missing function", () => {
			expect(() => {
				decode.call(testAbi, "missing", new Uint8Array(32));
			}).toThrow('Function "missing" not found in ABI');
		});

		it("throws when item is not a function", () => {
			const abi = [
				{
					type: "event",
					name: "Transfer",
					inputs: [],
				},
			];
			expect(() => {
				decode.call(abi, "Transfer", new Uint8Array(32));
			}).toThrow(AbiItemNotFoundError);
		});
	});

	describe("boundary values", () => {
		it("decodes max uint256", () => {
			const func = /** @type {*} */ (testAbi[0]);
			const maxUint256 =
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
			const returnData = Function.encodeResult(func, [maxUint256]);
			const decoded = decode.call(testAbi, "balanceOf", returnData);
			expect(decoded).toEqual([maxUint256]);
		});

		it("decodes zero uint256", () => {
			const func = /** @type {*} */ (testAbi[0]);
			const returnData = Function.encodeResult(func, [0n]);
			const decoded = decode.call(testAbi, "balanceOf", returnData);
			expect(decoded).toEqual([0n]);
		});
	});

	describe("complex types", () => {
		it("decodes array return value", () => {
			const abi = [
				{
					type: "function",
					name: "getArray",
					stateMutability: "view",
					inputs: [],
					outputs: [{ type: "uint256[]" }],
				},
			];
			const func = abi[0];
			const returnData = Function.encodeResult(func, [[1n, 2n, 3n]]);
			const decoded = decode.call(abi, "getArray", returnData);
			expect(decoded).toEqual([[1n, 2n, 3n]]);
		});

		it("decodes address return value", () => {
			const abi = [
				{
					type: "function",
					name: "getAddress",
					stateMutability: "view",
					inputs: [],
					outputs: [{ type: "address" }],
				},
			];
			const func = abi[0];
			const addr = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const returnData = Function.encodeResult(func, [addr]);
			const decoded = decode.call(abi, "getAddress", returnData);
			expect(decoded).toEqual([addr]);
		});

		it("decodes bytes return value", () => {
			const abi = [
				{
					type: "function",
					name: "getBytes",
					stateMutability: "view",
					inputs: [],
					outputs: [{ type: "bytes" }],
				},
			];
			const func = abi[0];
			const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const returnData = Function.encodeResult(func, [bytes]);
			const decoded = decode.call(abi, "getBytes", returnData);
			expect(decoded[0]).toEqual(bytes);
		});
	});

	describe("this binding", () => {
		it("uses this context as abi", () => {
			const abi = [
				{
					type: "function",
					name: "test",
					stateMutability: "pure",
					inputs: [],
					outputs: [{ type: "bool" }],
				},
			];
			const func = abi[0];
			const returnData = Function.encodeResult(func, [true]);
			const decoded = decode.call(abi, "test", returnData);
			expect(decoded).toEqual([true]);
		});
	});

	describe("overloaded functions", () => {
		it("decodes first matching function name", () => {
			const abi = [
				{
					type: "function",
					name: "process",
					stateMutability: "pure",
					inputs: [{ type: "uint256" }],
					outputs: [{ type: "bool" }],
				},
				{
					type: "function",
					name: "process",
					stateMutability: "pure",
					inputs: [{ type: "string" }],
					outputs: [{ type: "bool" }],
				},
			];
			const func = abi[0];
			const returnData = Function.encodeResult(func, [true]);
			const decoded = decode.call(abi, "process", returnData);
			expect(decoded).toEqual([true]);
		});
	});
});
