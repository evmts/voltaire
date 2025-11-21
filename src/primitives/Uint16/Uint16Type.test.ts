import { describe, it } from "vitest";
import type { Uint16Type } from "./Uint16Type.js";

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
	? 1
	: 2
	? true
	: false;

describe("Uint16Type type-level tests", () => {
	it("should be a branded number type", () => {
		type Test1 = Equals<Uint16Type, number>;
		const test1: Test1 = false;
		test1;

		type Test2 = Uint16Type extends number ? true : false;
		const test2: Test2 = true;
		test2;
	});

	it("should be assignable to number", () => {
		const value = 0 as Uint16Type;
		const _num: number = value;
	});

	it("should not allow plain number assignment without cast", () => {
		const num = 42;
		// @ts-expect-error - plain number not assignable to branded type
		const _value: Uint16Type = num;
	});

	it("should not allow other branded types", () => {
		type OtherBrand = number & { readonly __tag: "Other" };
		const other = 0 as OtherBrand;
		// @ts-expect-error - different branded type not assignable
		const _value: Uint16Type = other;
	});

	it("should maintain brand through const assertions", () => {
		const value = 30000 as const as Uint16Type;
		const _typed: Uint16Type = value;
	});
});
