import { describe, expect, it } from "vitest";
import { AbiItemNotFoundError } from "./Errors.js";
import { encode } from "./encode.js";
import * as Function from "./function/index.js";

describe("encode", () => {
	/** @type {import('./Item/ItemType.js').ItemType[]} */
	const testAbi = [
		{
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [],
		},
		{
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [{ type: "address", name: "account" }],
			outputs: [{ type: "uint256" }],
		},
		{
			type: "function",
			name: "approve",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "spender" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		},
		{
			type: "function",
			name: "totalSupply",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "uint256" }],
		},
	];

	describe("basic encoding", () => {
		it("encodes transfer function call", () => {
			const to = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const amount = 1000n;
			const encoded = encode.call(testAbi, "transfer", [to, amount]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(68);
			expect(Array.from(encoded.slice(0, 4))).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
		});

		it("encodes balanceOf function call", () => {
			const account = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const encoded = encode.call(testAbi, "balanceOf", [account]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(36);
			expect(Array.from(encoded.slice(0, 4))).toEqual([0x70, 0xa0, 0x82, 0x31]);
		});

		it("encodes approve function call", () => {
			const spender = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const amount = 999n;
			const encoded = encode.call(testAbi, "approve", [spender, amount]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(68);
			expect(Array.from(encoded.slice(0, 4))).toEqual([0x09, 0x5e, 0xa7, 0xb3]);
		});
	});

	describe("function with no parameters", () => {
		it("encodes call with only selector", () => {
			const encoded = encode.call(testAbi, "totalSupply", []);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(4);
		});
	});

	describe("selector verification", () => {
		it("includes correct selector for transfer", () => {
			const encoded = encode.call(testAbi, "transfer", [
				"0x0000000000000000000000000000000000000000",
				100n,
			]);
			const selector = encoded.slice(0, 4);
			expect(Array.from(selector)).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
		});

		it("includes correct selector for balanceOf", () => {
			const encoded = encode.call(testAbi, "balanceOf", [
				"0x0000000000000000000000000000000000000000",
			]);
			const selector = encoded.slice(0, 4);
			expect(Array.from(selector)).toEqual([0x70, 0xa0, 0x82, 0x31]);
		});
	});

	describe("parameter encoding", () => {
		it("encodes address parameter correctly", () => {
			const encoded = encode.call(testAbi, "balanceOf", [
				"0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
			]);

			expect(encoded[4]).toBe(0);
			const addressBytes = encoded.slice(16, 36);
			expect(Array.from(addressBytes)).toEqual([
				0x14, 0xdc, 0x79, 0x96, 0x4d, 0xa2, 0xc0, 0x8b, 0x23, 0x69, 0x8b, 0x3d,
				0x3c, 0xc7, 0xca, 0x32, 0x19, 0x3d, 0x99, 0x55,
			]);
		});

		it("encodes uint256 parameter correctly", () => {
			const encoded = encode.call(testAbi, "transfer", [
				"0x0000000000000000000000000000000000000000",
				69420n,
			]);

			const amountBytes = encoded.slice(36, 68);
			expect(amountBytes[31]).toBe(0x2c);
			expect(amountBytes[30]).toBe(0x0f);
			expect(amountBytes[29]).toBe(0x01);
		});
	});

	describe("error cases", () => {
		it("throws when function not found", () => {
			expect(() => {
				encode.call(testAbi, "nonExistent", []);
			}).toThrow(AbiItemNotFoundError);
		});

		it("throws with descriptive message for missing function", () => {
			expect(() => {
				encode.call(testAbi, "missing", []);
			}).toThrow('Function "missing" not found in ABI');
		});

		it("throws when item is not a function", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const abi = [
				{
					type: "event",
					name: "Transfer",
					inputs: [],
				},
			];
			expect(() => {
				encode.call(abi, "Transfer", []);
			}).toThrow(AbiItemNotFoundError);
		});
	});

	describe("complex parameter types", () => {
		it("encodes function with array parameter", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const abi = [
				{
					type: "function",
					name: "batchTransfer",
					stateMutability: "nonpayable",
					inputs: [
						{ type: "address[]", name: "recipients" },
						{ type: "uint256[]", name: "amounts" },
					],
					outputs: [],
				},
			];
			const recipients = [
				"0x0000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000002",
			];
			const amounts = [100n, 200n];
			const encoded = encode.call(abi, "batchTransfer", [recipients, amounts]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(4);
		});

		it("encodes function with string parameter", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const abi = [
				{
					type: "function",
					name: "setName",
					stateMutability: "nonpayable",
					inputs: [{ type: "string", name: "name" }],
					outputs: [],
				},
			];
			const name = "Alice";
			const encoded = encode.call(abi, "setName", [name]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(4);
		});

		it("encodes function with bytes parameter", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const abi = [
				{
					type: "function",
					name: "setData",
					stateMutability: "nonpayable",
					inputs: [{ type: "bytes", name: "data" }],
					outputs: [],
				},
			];
			const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const encoded = encode.call(abi, "setData", [data]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(4);
		});

		it("encodes function with bool parameter", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const abi = [
				{
					type: "function",
					name: "setFlag",
					stateMutability: "nonpayable",
					inputs: [{ type: "bool", name: "flag" }],
					outputs: [],
				},
			];
			const encoded = encode.call(abi, "setFlag", [true]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(36);
			expect(encoded[35]).toBe(1);
		});
	});

	describe("boundary values", () => {
		it("encodes max uint256 amount", () => {
			const maxUint256 =
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
			const encoded = encode.call(testAbi, "transfer", [
				"0x0000000000000000000000000000000000000000",
				maxUint256,
			]);

			const amountBytes = encoded.slice(36, 68);
			for (let i = 0; i < 32; i++) {
				expect(amountBytes[i]).toBe(0xff);
			}
		});

		it("encodes zero address", () => {
			const zeroAddr = "0x0000000000000000000000000000000000000000";
			const encoded = encode.call(testAbi, "balanceOf", [zeroAddr]);

			const addressBytes = encoded.slice(4, 36);
			for (let i = 0; i < 32; i++) {
				expect(addressBytes[i]).toBe(0);
			}
		});

		it("encodes zero amount", () => {
			const encoded = encode.call(testAbi, "transfer", [
				"0x0000000000000000000000000000000000000000",
				0n,
			]);

			const amountBytes = encoded.slice(36, 68);
			for (let i = 0; i < 32; i++) {
				expect(amountBytes[i]).toBe(0);
			}
		});
	});

	describe("this binding", () => {
		it("uses this context as abi", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const abi = [
				{
					type: "function",
					name: "test",
					stateMutability: "pure",
					inputs: [{ type: "uint256" }],
					outputs: [],
				},
			];
			const encoded = encode.call(abi, "test", [42n]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(0);
		});
	});

	describe("round-trip encoding/decoding", () => {
		it("encodes and decodes consistently", () => {
			const to = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const amount = 1000n;
			const encoded = encode.call(testAbi, "transfer", [to, amount]);

			const decoded = Function.decodeParams(/** @type {*} */ (testAbi[0]), encoded);
			expect(decoded).toEqual([to, amount]);
		});

		it("handles multiple parameters consistently", () => {
			const spender = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const amount = 999n;
			const encoded = encode.call(testAbi, "approve", [spender, amount]);

			const decoded = Function.decodeParams(/** @type {*} */ (testAbi[2]), encoded);
			expect(decoded).toEqual([spender, amount]);
		});
	});

	describe("real-world scenarios", () => {
		it("encodes ERC20 transfer", () => {
			const encoded = encode.call(testAbi, "transfer", [
				"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
				1000000000000000000n,
			]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(68);
			expect(Array.from(encoded.slice(0, 4))).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
		});

		it("encodes ERC20 approve with max uint256", () => {
			const maxUint256 =
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
			const encoded = encode.call(testAbi, "approve", [
				"0x7a250d5630b4cf539939c1f07d1e3ea40f6063af",
				maxUint256,
			]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(68);
		});
	});

	describe("overloaded functions", () => {
		it("encodes first matching function name", () => {
			/** @type {import('./Item/ItemType.js').ItemType[]} */
			const abi = [
				{
					type: "function",
					name: "process",
					stateMutability: "pure",
					inputs: [{ type: "uint256" }],
					outputs: [],
				},
				{
					type: "function",
					name: "process",
					stateMutability: "pure",
					inputs: [{ type: "string" }],
					outputs: [],
				},
			];
			const encoded = encode.call(abi, "process", [42n]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(4);
		});
	});
});
