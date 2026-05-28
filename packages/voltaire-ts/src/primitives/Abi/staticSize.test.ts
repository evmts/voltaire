import { describe, expect, it } from "vitest";
import * as Abi from "./index.js";
import type { ParametersToPrimitiveTypes } from "./Parameter.js";
import { staticSize } from "./staticSize.js";

describe("staticSize", () => {
	it("returns 32 for plain static types", () => {
		expect(staticSize("uint256")).toBe(32);
		expect(staticSize("address")).toBe(32);
		expect(staticSize("bool")).toBe(32);
		expect(staticSize("bytes32")).toBe(32);
	});

	it("multiplies for fixed-size arrays", () => {
		expect(staticSize("uint256[3]")).toBe(96);
		expect(staticSize("uint256[3][2]")).toBe(192);
	});

	it("sums component sizes for static tuples", () => {
		const components = [
			{ type: "uint256[3]" },
			{ type: "uint256" },
		] as const;
		expect(staticSize("tuple", components)).toBe(96 + 32);
	});

	it("recurses through nested static tuples", () => {
		const components = [
			{ type: "tuple", components: [{ type: "uint256" }, { type: "bool" }] },
			{ type: "address" },
		] as const;
		expect(staticSize("tuple", components)).toBe(64 + 32);
	});
});

describe("decodeValue static-tuple offset", () => {
	it("decodes a static tuple containing a fixed array followed by another param", () => {
		// tuple(uint256[3], uint256) followed by a trailing uint256.
		// The static tuple head occupies 96 + 32 = 128 bytes; the bug summed
		// 32 per component (64 bytes), corrupting the trailing param's offset.
		const params = [
			{
				type: "tuple",
				components: [{ type: "uint256[3]" }, { type: "uint256" }],
			},
			{ type: "uint256" },
		] as const;

		const value = [[1n, 2n, 3n], 4n];
		const trailing = 99n;
		const values = [
			value,
			trailing,
		] satisfies ParametersToPrimitiveTypes<typeof params>;

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		const tuple = decoded[0] as unknown[];
		expect(tuple[0]).toEqual([1n, 2n, 3n]);
		expect(tuple[1]).toBe(4n);
		expect(decoded[1]).toBe(99n);
	});

	it("decodes a static tuple with a nested static tuple followed by another param", () => {
		const params = [
			{
				type: "tuple",
				components: [
					{
						type: "tuple",
						components: [{ type: "uint256" }, { type: "uint256" }],
					},
					{ type: "uint256" },
				],
			},
			{ type: "address" },
		] as const;

		const value = [[10n, 20n], 30n];
		const addr = "0x0000000000000000000000000000000000000042";
		const values = [
			value,
			addr,
		] satisfies ParametersToPrimitiveTypes<typeof params>;

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		const tuple = decoded[0] as unknown[];
		const nested = tuple[0] as unknown[];
		expect(nested[0]).toBe(10n);
		expect(nested[1]).toBe(20n);
		expect(tuple[1]).toBe(30n);
		expect(String(decoded[1]).toLowerCase()).toBe(addr.toLowerCase());
	});
});
