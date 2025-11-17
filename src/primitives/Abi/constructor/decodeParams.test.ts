/**
 * Unit tests for decodeParams function
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../../Address/AddressType.js";
import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";

describe("decodeParams", () => {
	it("decodes constructor with single parameter", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "uint256", name: "initialSupply" }],
		} as const;

		const encoded = encodeParams(constructor, [1000n]);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toEqual([1000n]);
	});

	it("decodes constructor with multiple parameters", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "string", name: "name" },
				{ type: "string", name: "symbol" },
				{ type: "uint8", name: "decimals" },
			],
		} as const;

		const args = ["Token", "TKN", 18n] as any;
		const encoded = encodeParams(constructor, args);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toEqual(args);
	});

	it("decodes constructor with no parameters", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [],
		} as const;

		const encoded = encodeParams(constructor, []);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toEqual([]);
	});

	it("decodes constructor with address parameter", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "address", name: "owner" }],
		} as const;

		const addr = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as BrandedAddress;
		const encoded = encodeParams(constructor, [addr]);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded[0]).toBe(addr);
	});

	it("decodes constructor with bool parameter", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "bool", name: "paused" }],
		} as const;

		const encoded = encodeParams(constructor, [true]);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toEqual([true]);
	});

	it("decodes constructor with string parameter", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "string", name: "message" }],
		} as const;

		const encoded = encodeParams(constructor, ["Hello"]);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toEqual(["Hello"]);
	});

	it("decodes constructor with bytes parameter", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "bytes", name: "data" }],
		} as const;

		const encoded = encodeParams(constructor, ["0x123456"]);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toHaveLength(1);
	});

	it("decodes constructor with array parameter", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "uint256[]", name: "values" }],
		} as const;

		const values = [1n, 2n, 3n];
		const encoded = encodeParams(constructor, [values]);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toEqual([values]);
	});

	it("decodes constructor with tuple parameter", () => {
		const constructor = {
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

		const config = [
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3" as BrandedAddress,
			100n,
		];
		const encoded = encodeParams(constructor, [config]);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toHaveLength(1);
		expect(Array.isArray(decoded[0])).toBe(true);
	});

	it("decodes payable constructor parameters", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "payable",
			inputs: [{ type: "uint256", name: "value" }],
		} as const;

		const encoded = encodeParams(constructor, [42n]);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded).toEqual([42n]);
	});

	it("round-trips encoding and decoding", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "uint256", name: "a" },
				{ type: "address", name: "b" },
				{ type: "bool", name: "c" },
			],
		} as const;

		const args = [
			1000n,
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			true,
		] as any;
		const encoded = encodeParams(constructor, args);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded[0]).toBe(args[0]);
		expect(decoded[1]).toBe(args[1]);
		expect(decoded[2]).toBe(args[2]);
	});

	it("decodes complex ERC20 constructor", () => {
		const constructor = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "string", name: "name" },
				{ type: "string", name: "symbol" },
				{ type: "uint256", name: "initialSupply" },
				{ type: "address", name: "owner" },
			],
		} as const;

		const args = [
			"MyToken",
			"MTK",
			1000000n,
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3" as BrandedAddress,
		];
		const encoded = encodeParams(constructor, args);
		const decoded = decodeParams(constructor, encoded);

		expect(decoded[0]).toBe(args[0]);
		expect(decoded[1]).toBe(args[1]);
		expect(decoded[2]).toBe(args[2]);
		expect(decoded[3]).toBe(args[3]);
	});
});
