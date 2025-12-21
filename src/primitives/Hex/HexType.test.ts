import { describe, expect, it } from "vitest";
import type { HexType, Sized } from "./HexType.js";

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
	? 1
	: 2
	? true
	: false;

describe("HexType type-level tests", () => {
	describe("basic type structure", () => {
		it("should be a branded string type", () => {
			type Test1 = Equals<HexType, string>;
			const test1: Test1 = false;
			test1;

			type Test2 = HexType extends string ? true : false;
			const test2: Test2 = true;
			test2;
		});

		it("should be assignable to string", () => {
			const value = "0x1234" as HexType;
			const _str: string = value;
		});

		it("should start with 0x prefix in template", () => {
			type Test = HexType extends `0x${string}` ? true : false;
			const test: Test = true;
			test;
		});

		it("should not allow plain string assignment without cast", () => {
			const str = "0x1234";
			// @ts-expect-error - plain string not assignable to branded type
			const _value: HexType = str;
		});
	});

	describe("template literal validation", () => {
		it("should accept 0x prefixed strings", () => {
			const _valid1: HexType = "0x" as HexType;
			const _valid2: HexType = "0x1234" as HexType;
			const _valid3: HexType = "0xabcdef" as HexType;
		});

		it("should not accept non-0x strings", () => {
			// @ts-expect-error - missing 0x prefix
			const _invalid1: HexType = "1234";
			// @ts-expect-error - wrong prefix
			const _invalid2: HexType = "x1234";
			// @ts-expect-error - uppercase X
			const _invalid3: HexType = "0X1234";
		});
	});

	describe("branding", () => {
		it("should not allow other branded types", () => {
			type OtherBrand = string & { readonly __tag: "Other" };
			const other = "0x1234" as OtherBrand;
			// @ts-expect-error - different branded type not assignable
			const _value: HexType = other;
		});

		it("should maintain brand through const assertions", () => {
			const value = "0x1234" as const as HexType;
			const _typed: HexType = value;
		});
	});

	describe("Sized hex type", () => {
		it("should be a sized subtype of HexType", () => {
			type Test = Sized<4> extends HexType ? true : false;
			const test: Test = true;
			test;
		});

		it("should have size property", () => {
			const sized = "0x12345678" as Sized<4>;
			type SizeType = (typeof sized)["size"];
			const _size: SizeType = 4;
		});

		it("should not allow different sizes", () => {
			const sized4 = "0x12345678" as Sized<4>;
			// @ts-expect-error - size mismatch
			const _sized8: Sized<8> = sized4;
		});

		it("should not allow unsized hex", () => {
			const unsized = "0x1234" as HexType;
			// @ts-expect-error - unsized not assignable to sized
			const _sized: Sized<2> = unsized;
		});

		it("should be assignable to HexType", () => {
			const sized = "0x1234" as Sized<2>;
			const _hex: HexType = sized;
		});
	});

	describe("Bytes alias for Sized", () => {
		it("should be equivalent to Sized", () => {
			type Test = Equals<import("./HexType.js").Bytes<4>, Sized<4>>;
			const test: Test = true;
			test;
		});

		it("should work with size parameter", () => {
			const bytes4 = "0x12345678" as import("./HexType.js").Bytes<4>;
			const _sized: Sized<4> = bytes4;
		});
	});

	describe("common Ethereum sizes", () => {
		it("should support Bytes4 (selector)", () => {
			const _selector: Sized<4> = "0xa9059cbb" as Sized<4>;
		});

		it("should support Bytes20 (address)", () => {
			const _address: Sized<20> =
				"0xd8da6bf26964af9d7eed9e03e53415d37aa96045" as Sized<20>;
		});

		it("should support Bytes32 (hash)", () => {
			const _hash: Sized<32> =
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470" as Sized<32>;
		});

		it("should support Bytes64", () => {
			const _bytes64: Sized<64> =
				"0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" as Sized<64>;
		});
	});

	describe("generic size parameter", () => {
		it("should allow generic size", () => {
			function test<N extends number>(hex: Sized<N>): Sized<N> {
				return hex;
			}

			const hex4 = "0x12345678" as Sized<4>;
			const result = test(hex4);
			type ResultType = typeof result;
			const _check: Sized<4> = result;
		});

		it("should allow number as default size", () => {
			const _sized: Sized = "0x1234" as Sized;
			const _sizedExplicit: Sized<number> = "0x1234" as Sized<number>;
		});
	});

	describe("type narrowing", () => {
		it("should narrow from HexType to Sized", () => {
			const hex: HexType = "0x1234" as HexType;
			const sized = hex as Sized<2>;
			const _typed: Sized<2> = sized;
		});

		it("should widen from Sized to HexType", () => {
			const sized: Sized<4> = "0x12345678" as Sized<4>;
			const hex: HexType = sized;
			const _typed: HexType = hex;
		});
	});

	describe("readonly brand", () => {
		it("should have readonly brand property", () => {
			const hex = "0x1234" as HexType;
			// In strict mode (ES modules), assigning properties to primitives throws TypeError
			expect(() => {
				// @ts-expect-error - brand is readonly (TypeScript enforcement only)
				(hex as Record<string, unknown>).__tag = "Modified";
			}).toThrow(TypeError);
			// The brand property isn't actually on the runtime value
			expect((hex as Record<string, unknown>).__tag).toBeUndefined();
		});

		it("should have readonly size for Sized", () => {
			const sized = "0x1234" as Sized<2>;
			// In strict mode (ES modules), assigning properties to primitives throws TypeError
			expect(() => {
				// @ts-expect-error - size is readonly (TypeScript enforcement only)
				(sized as Record<string, unknown>).size = 4;
			}).toThrow(TypeError);
			// The size property isn't actually on the runtime value
			expect((sized as Record<string, unknown>).size).toBeUndefined();
		});
	});

	describe("union types", () => {
		it("should work in unions", () => {
			type HexOrString = HexType | string;
			const _hex: HexOrString = "0x1234" as HexType;
			const _str: HexOrString = "plain string";
		});

		it("should work with union of sizes", () => {
			type SmallHex = Sized<2> | Sized<4>;
			const _bytes2: SmallHex = "0x1234" as Sized<2>;
			const _bytes4: SmallHex = "0x12345678" as Sized<4>;
		});
	});

	describe("type compatibility", () => {
		it("should not accept number", () => {
			// @ts-expect-error - number is not HexType
			const _hex: HexType = 1234;
		});

		it("should not accept boolean", () => {
			// @ts-expect-error - boolean is not HexType
			const _hex: HexType = true;
		});

		it("should not accept array", () => {
			// @ts-expect-error - array is not HexType
			const _hex: HexType = [1, 2, 3, 4];
		});

		it("should not accept Uint8Array", () => {
			// @ts-expect-error - Uint8Array is not HexType
			const _hex: HexType = new Uint8Array([1, 2, 3]);
		});

		it("should not accept object", () => {
			// @ts-expect-error - object is not HexType
			const _hex: HexType = { value: "0x1234" };
		});
	});

	describe("Hex alias", () => {
		it("should be equivalent to HexType", () => {
			type Test = Equals<import("./HexType.js").Hex, HexType>;
			const test: Test = true;
			test;
		});

		it("should be interchangeable", () => {
			const hexType = "0x1234" as HexType;
			const hex: import("./HexType.js").Hex = hexType;
			const _back: HexType = hex;
		});
	});
});
