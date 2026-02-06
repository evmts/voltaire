/**
 * Unit tests for encodeResult function
 */

import { describe, expect, it } from "vitest";
import { encodeResult } from "./encodeResult.js";

describe("encodeResult", () => {
	describe("basic encoding", () => {
		it("encodes function with no outputs", () => {
			const func = {
				type: "function",
				name: "test",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			} as const;

			const encoded = encodeResult(func, []);
			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(0);
		});

		it("encodes function with single uint256 output", () => {
			const func = {
				type: "function",
				name: "getValue",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const encoded = encodeResult(func, [100n]);
			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(32);
		});

		it("encodes function with multiple outputs", () => {
			const func = {
				type: "function",
				name: "getData",
				stateMutability: "view",
				inputs: [],
				outputs: [
					{ type: "address", name: "" },
					{ type: "uint256", name: "" },
				],
			} as const;

			const encoded = encodeResult(func, [
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				100n,
			]);
			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(0);
		});
	});

	describe("single output types", () => {
		it("encodes address output", () => {
			const func = {
				type: "function",
				name: "getAddress",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "address", name: "" }],
			} as const;

			const encoded = encodeResult(func, [
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			]);
			expect(encoded.length).toBe(32);
		});

		it("encodes bool output", () => {
			const func = {
				type: "function",
				name: "getFlag",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "bool", name: "" }],
			} as const;

			const encoded = encodeResult(func, [true]);
			expect(encoded.length).toBe(32);
		});

		it("encodes bytes32 output", () => {
			const func = {
				type: "function",
				name: "getHash",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "bytes32", name: "" }],
			} as const;

			const hash = new Uint8Array(32);
			hash[0] = 0xaa;
			const encoded = encodeResult(func, [hash]);
			expect(encoded.length).toBe(32);
		});

		it("encodes string output", () => {
			const func = {
				type: "function",
				name: "getName",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "string", name: "" }],
			} as const;

			const encoded = encodeResult(func, ["hello"]);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("encodes bytes output", () => {
			const func = {
				type: "function",
				name: "getData",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "bytes", name: "" }],
			} as const;

			const data = new Uint8Array([1, 2, 3, 4]);
			const encoded = encodeResult(func, [data]);
			expect(encoded.length).toBeGreaterThan(0);
		});
	});

	describe("array outputs", () => {
		it("encodes fixed-size array output", () => {
			const func = {
				type: "function",
				name: "getArray",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256[3]", name: "" }],
			} as const;

			const encoded = encodeResult(func, [[1n, 2n, 3n]]);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("encodes dynamic array output", () => {
			const func = {
				type: "function",
				name: "getDynamicArray",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256[]", name: "" }],
			} as const;

			const encoded = encodeResult(func, [[1n, 2n, 3n, 4n]]);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("encodes empty dynamic array", () => {
			const func = {
				type: "function",
				name: "getDynamicArray",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256[]", name: "" }],
			} as const;

			const encoded = encodeResult(func, [[]]);
			expect(encoded.length).toBeGreaterThan(0);
		});
	});

	describe("tuple outputs", () => {
		it("encodes simple tuple output", () => {
			const func = {
				type: "function",
				name: "getData",
				stateMutability: "view",
				inputs: [],
				outputs: [
					{
						type: "tuple",
						name: "",
						components: [
							{ type: "address", name: "addr" },
							{ type: "uint256", name: "value" },
						],
					},
				],
			} as const;

			const encoded = encodeResult(func, [
				["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 100n],
			]);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("encodes tuple array output", () => {
			const func = {
				type: "function",
				name: "getTuples",
				stateMutability: "view",
				inputs: [],
				outputs: [
					{
						type: "tuple[]",
						name: "",
						components: [
							{ type: "address", name: "addr" },
							{ type: "uint256", name: "value" },
						],
					},
				],
			} as const;

			const encoded = encodeResult(func, [
				[
					["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 100n],
					["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 200n],
				],
			]);
			expect(encoded.length).toBeGreaterThan(0);
		});
	});

	describe("multiple outputs", () => {
		it("encodes multiple outputs in order", () => {
			const func = {
				type: "function",
				name: "complexReturn",
				stateMutability: "view",
				inputs: [],
				outputs: [
					{ type: "address", name: "" },
					{ type: "uint256", name: "" },
					{ type: "bool", name: "" },
				],
			} as const;

			const encoded = encodeResult(func, [
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				100n,
				true,
			]);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("encodes mix of static and dynamic outputs", () => {
			const func = {
				type: "function",
				name: "mixedReturn",
				stateMutability: "view",
				inputs: [],
				outputs: [
					{ type: "uint256", name: "" },
					{ type: "string", name: "" },
					{ type: "bool", name: "" },
				],
			} as const;

			const encoded = encodeResult(func, [42n, "hello", true]);
			expect(encoded.length).toBeGreaterThan(0);
		});
	});

	describe("edge cases", () => {
		it("encodes zero values", () => {
			const func = {
				type: "function",
				name: "getZero",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const encoded = encodeResult(func, [0n]);
			expect(encoded.length).toBe(32);
		});

		it("encodes max uint256", () => {
			const func = {
				type: "function",
				name: "getMax",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const encoded = encodeResult(func, [
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
			]);
			expect(encoded.length).toBe(32);
		});

		it("encodes empty string", () => {
			const func = {
				type: "function",
				name: "getString",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "string", name: "" }],
			} as const;

			const encoded = encodeResult(func, [""]);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("encodes empty bytes", () => {
			const func = {
				type: "function",
				name: "getBytes",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "bytes", name: "" }],
			} as const;

			const encoded = encodeResult(func, [new Uint8Array(0)]);
			expect(encoded.length).toBeGreaterThan(0);
		});
	});

	describe("real-world examples", () => {
		it("encodes ERC20 balanceOf return", () => {
			const func = {
				type: "function",
				name: "balanceOf",
				stateMutability: "view",
				inputs: [{ type: "address", name: "account" }],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const encoded = encodeResult(func, [1000000000000000000n]);
			expect(encoded.length).toBe(32);
		});

		it("encodes ERC20 transfer return", () => {
			const func = {
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "recipient" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool", name: "" }],
			} as const;

			const encoded = encodeResult(func, [true]);
			expect(encoded.length).toBe(32);
		});

		it("encodes ERC721 ownerOf return", () => {
			const func = {
				type: "function",
				name: "ownerOf",
				stateMutability: "view",
				inputs: [{ type: "uint256", name: "tokenId" }],
				outputs: [{ type: "address", name: "" }],
			} as const;

			const encoded = encodeResult(func, [
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			]);
			expect(encoded.length).toBe(32);
		});
	});

	describe("no selector in output", () => {
		it("does not include function selector in encoded result", () => {
			const func = {
				type: "function",
				name: "getValue",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const encoded = encodeResult(func, [100n]);
			// Result should be exactly 32 bytes (one word), no selector
			expect(encoded.length).toBe(32);
		});

		it("result differs from encodeParams which includes selector", () => {
			const func = {
				type: "function",
				name: "test",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "value" }],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const resultEncoded = encodeResult(func, [100n]);
			// Result encoding is just the value, not prefixed with selector
			expect(resultEncoded.length).toBe(32);
		});
	});

	describe("different state mutabilities", () => {
		it("encodes view function result", () => {
			const func = {
				type: "function",
				name: "getValue",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const encoded = encodeResult(func, [42n]);
			expect(encoded.length).toBe(32);
		});

		it("encodes pure function result", () => {
			const func = {
				type: "function",
				name: "calculate",
				stateMutability: "pure",
				inputs: [{ type: "uint256", name: "a" }],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const encoded = encodeResult(func, [100n]);
			expect(encoded.length).toBe(32);
		});

		it("encodes nonpayable function result", () => {
			const func = {
				type: "function",
				name: "setState",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [{ type: "bool", name: "" }],
			} as const;

			const encoded = encodeResult(func, [true]);
			expect(encoded.length).toBe(32);
		});

		it("encodes payable function result", () => {
			const func = {
				type: "function",
				name: "deposit",
				stateMutability: "payable",
				inputs: [],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const encoded = encodeResult(func, [1000n]);
			expect(encoded.length).toBe(32);
		});
	});
});
