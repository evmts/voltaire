/**
 * Unit tests for encodeParams function
 */

import { describe, expect, it } from "vitest";
import { encodeParams } from "./encodeParams.js";

describe("encodeParams", () => {
	it("encodes constructor with single parameter", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "uint256", name: "initialSupply" }],
		} as const;

		const encoded = encodeParams(ctor, [1000n]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(232); // Low byte of 1000
	});

	it("encodes constructor with multiple parameters", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "string", name: "name" },
				{ type: "string", name: "symbol" },
				{ type: "uint8", name: "decimals" },
			],
		} as const;

		const encoded = encodeParams(ctor, ["Token", "TKN", 18n] as any);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(0);
	});

	it("encodes constructor with no parameters", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [],
		} as const;

		const encoded = encodeParams(ctor, []);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(0);
	});

	it("encodes constructor with address parameter", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "address", name: "owner" }],
		} as const;

		const encoded = encodeParams(ctor, [
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(32);
	});

	it("encodes constructor with bool parameter", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "bool", name: "paused" }],
		} as const;

		const encoded = encodeParams(ctor, [true]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded[31]).toBe(1);
	});

	it("encodes constructor with string parameter", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "string", name: "message" }],
		} as const;

		const encoded = encodeParams(ctor, ["Hello"]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBeGreaterThan(32);
	});

	it("encodes constructor with bytes parameter", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "bytes", name: "data" }],
		} as const;

		const encoded = encodeParams(ctor, ["0x123456"]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes constructor with array parameter", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "uint256[]", name: "values" }],
		} as const;

		const encoded = encodeParams(ctor, [[1n, 2n, 3n]]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes constructor with tuple parameter", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{
					type: "tuple",
					name: "config",
					components: [
						{ type: "address", name: "owner" },
						{ type: "uint256", name: "fee" },
					],
				},
			],
		} as const;

		const encoded = encodeParams(ctor, [
			["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 100n],
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes payable constructor parameters", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "payable",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const encoded = encodeParams(ctor, [42n]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});

	it("encodes constructor with fixed bytes parameter", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "bytes32", name: "hash" }],
		} as const;

		const encoded = encodeParams(ctor, [
			"0x0000000000000000000000000000000000000000000000000000000000000001",
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(32);
	});

	it("encodes constructor with multiple uint sizes", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "uint8", name: "a" },
				{ type: "uint16", name: "b" },
				{ type: "uint256", name: "c" },
			],
		} as const;

		const encoded = encodeParams(ctor, [1n, 2n, 3n] as any);
		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(96); // 3 * 32 bytes
	});

	it("encodes complex ERC20 constructor", () => {
		const ctor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "string", name: "name" },
				{ type: "string", name: "symbol" },
				{ type: "uint256", name: "initialSupply" },
				{ type: "address", name: "owner" },
			],
		} as const;

		const encoded = encodeParams(ctor, [
			"MyToken",
			"MTK",
			1000000n,
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		]);
		expect(encoded).toBeInstanceOf(Uint8Array);
	});
});
